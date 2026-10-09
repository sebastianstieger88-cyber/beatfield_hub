CREATE OR REPLACE FUNCTION public.wix_apply_import(incoming jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_site uuid := (incoming->>'site_id')::uuid;
  v_kind text := incoming->>'kind';
  v_id uuid := (incoming->>'external_id')::uuid;
  v_time timestamptz := (incoming->>'source_updated_at')::timestamptz;
  previous public.wix_imports%rowtype;
  mapping public.wix_mappings%rowtype;
  season public.seasons%rowtype;
  target_session public.attendance_sessions%rowtype;
  v_target uuid;
  v_type text;
  v_status text := 'review';
  v_message text := '';
  v_days text[];
  v_count integer;
  v_date date;
  v_clock time;
  v_current text;
  v_same_session boolean;
begin
  if v_kind not in ('plan','booking') or v_time is null then raise exception 'Invalid Wix event'; end if;
  -- Serialize each source entity, including concurrent first deliveries.
  perform pg_advisory_xact_lock(hashtextextended(v_site::text||v_kind||v_id::text,0));
  select * into previous from public.wix_imports
    where site_id=v_site and kind=v_kind and external_id=v_id for update;
  if found and (previous.source_updated_at>v_time or (previous.source_updated_at=v_time
    and previous.status in ('imported','canceled','ignored'))) then
    if previous.source_updated_at=v_time and previous.status='imported'
      and previous.target_type='season' and incoming->>'action'='upsert'
      and incoming->>'paid_amount' ~ '^[0-9]+([.][0-9]{1,2})?$' then
      update public.wix_imports
        set payload=payload || jsonb_build_object('paid_amount',incoming->'paid_amount'),updated_at=now()
        where site_id=v_site and kind=v_kind and external_id=v_id;
    end if;
    return jsonb_build_object('status',previous.status,'message','Bereits verarbeitet.');
  end if;
  v_target := previous.target_id;
  v_type := previous.target_type;
  insert into public.wix_imports(site_id,kind,external_id,offer_id,source_updated_at,payload)
    values(v_site,v_kind,v_id,(incoming->>'offer_id')::uuid,v_time,incoming)
    on conflict (site_id,kind,external_id) do update set
      offer_id=excluded.offer_id,source_updated_at=excluded.source_updated_at,payload=excluded.payload,updated_at=now();
  -- The inner block rolls back any partial booking writes, retaining a review item.
  begin
    if incoming->>'action'='cancel' then
      if v_target is null then
        v_status:='canceled';v_message:='In Wix storniert; kein lokaler Eintrag angelegt.';
      elsif v_type='season' then
        v_status:='review';v_message:='Season in Wix storniert. Buchung und verbleibende Termine bitte manuell bearbeiten; bisherige Anwesenheit bleibt erhalten.';
      else
        if v_type='trial' then
          select status into v_current from public.trial_requests where id=v_target;
        else
          select status into v_current from public.drop_in_bookings where id=v_target;
        end if;
        if v_current in ('teilgenommen','konvertiert') then
          raise exception 'Stornierung nach erfasster Teilnahme: bitte manuell prüfen.';
        end if;
        if v_type='trial' then update public.trial_requests set status='abgesagt' where id=v_target;
        else update public.drop_in_bookings set status='abgesagt' where id=v_target; end if;
        v_status:='canceled';v_message:='Einzelbuchung storniert.';
      end if;
    elsif incoming->>'action'='ignore' then
      if v_target is not null then raise exception 'Wix-Status geändert. Bestehende Buchung bitte prüfen.'; end if;
      v_status:='ignored';v_message:='Noch keine bestätigte Buchung; kein Import.';
    else
      select * into mapping from public.wix_mappings
        where site_id=v_site and kind=v_kind and offer_id=(incoming->>'offer_id')::uuid;
      if mapping.id is null or not mapping.active then
        v_status:='pending';v_message:='Angebot noch nicht zugeordnet oder Zuordnung pausiert.';
      elsif mapping.booking_type='covered' then
        if v_target is not null then raise exception 'Bestehende Einzelbuchung bitte vor Änderung der Zuordnung prüfen.'; end if;
        v_status:='ignored';v_message:='Termin wird durch die Season-Buchung abgedeckt.';
      elsif incoming->>'action'='review' then
        v_message:=coalesce(incoming->>'reason','Wix-Buchung bitte prüfen.');
      elsif incoming->>'action'='upsert' then
        if nullif(btrim(incoming->>'full_name'),'') is null then raise exception 'Teilnehmername fehlt.'; end if;
        if previous.mapping_id is not null and previous.mapping_id<>mapping.id then raise exception 'Angebot einer bereits importierten Buchung geändert. Bitte prüfen.'; end if;
        if v_kind='plan' then
          select * into season from public.seasons where id=mapping.season_id;
          if season.id is null or season.status='abgeschlossen' then raise exception 'Season fehlt oder ist abgeschlossen.'; end if;
          select array_agg(c.weekday order by c.weekday),count(distinct c.weekday)
            into v_days,v_count from public.courses c where c.id=any(mapping.course_ids);
          if v_count<>(case mapping.package_type when '1x TRAIN' then 1 when '2x BEAT' then 2 else 3 end)
            or v_count<>cardinality(mapping.course_ids)
            or not v_days<@array['Montag','Mittwoch','Samstag'] then
            raise exception 'Kurszuordnung passt nicht zum Paket. Pro Trainingstag genau einen Kurs auswählen.';
          end if;
          if v_target is null then
            perform pg_advisory_xact_lock(hashtextextended('wix-person:'||season.id::text||lower(btrim(incoming->>'full_name')),0));
            -- Never silently merge a Wix customer into a manually created booking.
            if exists(select 1 from public.season_bookings b where b.season_id=season.id
              and (lower(btrim(b.full_name))=lower(btrim(incoming->>'full_name'))
                or (nullif(regexp_replace(incoming->>'phone','[^0-9]','','g'),'') is not null
                  and regexp_replace(coalesce(b.phone,''),'[^0-9]','','g')=regexp_replace(incoming->>'phone','[^0-9]','','g')))) then
              raise exception 'Mögliche bestehende Season-Buchung gefunden. Bitte zuordnen statt doppelt anlegen.';
            end if;
            insert into public.season_bookings(season_id,full_name,phone,package_type,selected_days,start_date,contact_status)
              values(season.id,incoming->>'full_name',nullif(incoming->>'phone',''),mapping.package_type,v_days,season.start_date,'zugesagt') returning id into v_target;
            insert into public.participants(course_id,season_id,season_booking_id,full_name,phone)
              select c.id,season.id,v_target,incoming->>'full_name',nullif(incoming->>'phone','')
              from public.courses c where c.id=any(mapping.course_ids);
          elsif not exists(select 1 from public.season_bookings b where b.id=v_target and b.season_id=mapping.season_id
            and b.package_type=mapping.package_type and b.selected_days@>v_days and b.selected_days<@v_days) then
            raise exception 'Season-Buchung wurde lokal geändert oder gelöscht. Bitte prüfen.';
          end if;
          v_type:='season';v_status:='imported';v_message:='Season-Buchung mit festen Trainingstagen übernommen.';
        else
          v_date:=((incoming->>'starts_at')::timestamptz at time zone 'Europe/Berlin')::date;
          v_clock:=((incoming->>'starts_at')::timestamptz at time zone 'Europe/Berlin')::time;
          select count(*) into v_count from public.attendance_sessions s join public.courses c on c.id=s.course_id
            where s.course_id=any(mapping.course_ids) and s.session_date=v_date
              and case when c.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' then c.time::time=v_clock else false end;
          if v_count<>1 then raise exception 'Kein eindeutiger geplanter Trainingstermin für Wix-Datum und Uhrzeit. Bitte Termin/Kurse prüfen.'; end if;
          select s.* into target_session from public.attendance_sessions s join public.courses c on c.id=s.course_id
            where s.course_id=any(mapping.course_ids) and s.session_date=v_date
              and case when c.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' then c.time::time=v_clock else false end;
          if v_target is null then
            perform pg_advisory_xact_lock(hashtextextended('wix-person:'||coalesce(target_session.season_id::text,target_session.id::text)||lower(btrim(incoming->>'full_name')),0));
            if exists(select 1 from public.participants p where p.course_id=target_session.course_id
              and p.season_id=target_session.season_id and lower(btrim(p.full_name))=lower(btrim(incoming->>'full_name')))
              or exists(select 1 from public.drop_in_bookings b where b.attendance_session_id=target_session.id and b.status<>'abgesagt'
                and lower(btrim(b.full_name))=lower(btrim(incoming->>'full_name')))
              or exists(select 1 from public.trial_requests t where t.attendance_session_id=target_session.id and t.status<>'abgesagt'
                and lower(btrim(t.full_name))=lower(btrim(incoming->>'full_name'))) then
              raise exception 'Mögliche bestehende Teilnahme gefunden. Bitte prüfen statt doppelt anlegen.';
            end if;
            if mapping.booking_type='trial' then
              insert into public.trial_requests(course_id,attendance_session_id,full_name,email,phone,status)
                values(target_session.course_id,target_session.id,incoming->>'full_name',incoming->>'email',incoming->>'phone','gebucht') returning id into v_target;
            else
              insert into public.drop_in_bookings(course_id,attendance_session_id,full_name,email,phone,status,booking_provider)
                values(target_session.course_id,target_session.id,incoming->>'full_name',incoming->>'email',incoming->>'phone','gebucht',mapping.booking_type) returning id into v_target;
            end if;
          else
            if v_type<>mapping.booking_type then raise exception 'Buchungsart wurde geändert. Bitte prüfen.'; end if;
            if v_type='trial' then
              select status,attendance_session_id=target_session.id into v_current,v_same_session from public.trial_requests where id=v_target;
            else
              select status,attendance_session_id=target_session.id into v_current,v_same_session from public.drop_in_bookings where id=v_target;
            end if;
            if v_current is null then raise exception 'Importierte Buchung wurde lokal gelöscht. Bitte prüfen.'; end if;
            if v_current='konvertiert' or (v_current='teilgenommen' and not v_same_session) then raise exception 'Bereits erfasste Teilnahme wird nicht automatisch umgebucht.'; end if;
            if v_type='trial' then
              update public.trial_requests set course_id=target_session.course_id,attendance_session_id=target_session.id,
                status=case when v_current='teilgenommen' then v_current else 'gebucht' end where id=v_target;
            else
              update public.drop_in_bookings set course_id=target_session.course_id,attendance_session_id=target_session.id,
                status=case when v_current='teilgenommen' then v_current else 'gebucht' end,archived_at=null where id=v_target;
            end if;
          end if;
          v_type:=mapping.booking_type;v_status:='imported';v_message:='Einzelbuchung übernommen.';
        end if;
      else raise exception 'Unbekannte Importaktion.';
      end if;
    end if;
  exception
    when raise_exception then v_status:='review';v_message:=sqlerrm;v_target:=previous.target_id;v_type:=previous.target_type;
    when unique_violation then v_status:='review';v_message:='Doppelte Buchung erkannt. Bitte vorhandene Teilnahme prüfen.';v_target:=previous.target_id;v_type:=previous.target_type;
    when foreign_key_violation or check_violation then v_status:='review';v_message:='Zuordnung oder Buchungsdaten ungültig. Bitte prüfen.';v_target:=previous.target_id;v_type:=previous.target_type;
  end;
  update public.wix_imports set status=v_status,message=v_message,target_id=v_target,target_type=v_type,
    mapping_id=coalesce(previous.mapping_id,mapping.id),updated_at=now()
    where site_id=v_site and kind=v_kind and external_id=v_id;
  return jsonb_build_object('status',v_status,'message',v_message);
end $function$;
create or replace function public.sync_wix_paid_amount()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.target_type='season' and new.target_id is not null
 and new.payload->>'paid_amount' ~ '^[0-9]+([.][0-9]{1,2})?$' then
 update public.season_bookings set paid_amount=(new.payload->>'paid_amount')::numeric where id=new.target_id;
 end if;
 return new;
end $$;

