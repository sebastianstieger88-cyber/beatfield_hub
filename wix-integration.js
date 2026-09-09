const PACKAGES = [
  ['train-mo','1x TRAIN',['Montag']],['train-mi','1x TRAIN',['Mittwoch']],['train-sa','1x TRAIN',['Samstag']],
  ['beat-mo-mi','2x BEAT',['Montag','Mittwoch']],['beat-mo-sa','2x BEAT',['Montag','Samstag']],
  ['beat-mi-sa','2x BEAT',['Mittwoch','Samstag']],['repeat','3x REPEAT',['Montag','Mittwoch','Samstag']],
];
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={season:'Season-Paket',dropin:'DROP-IN',trial:'Probetraining',egym:'eGYM',hansefit:'Hansefit',covered:'Durch Season abgedeckt'};
const statuses={pending:'Zuordnung fehlt',imported:'Übernommen',canceled:'Storniert',ignored:'Ohne neuen Eintrag',review:'Bitte prüfen'};

export function createWixIntegration({getState,notify,refreshApp}) {
  const panel=document.querySelector('#wixPanel');
  const form=document.querySelector('#wixMappingForm');
  let siteId='', mappings=[], imports=[], userId=null, busy=false, loaded=false, signature='';
  const showStatus=message=>{panel.querySelector('[data-wix-status]').textContent=message;};
  async function api(body) {
    const state=getState();
    const {data,error}=await state.supabase.auth.getSession();
    if(error || !data.session) throw new Error('Bitte erneut anmelden.');
    const response=await fetch('/api/wix-import',{
      method:body?'POST':'GET',headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(55000),
    });
    const result=await response.json();
    if(!response.ok) throw new Error(result.error || 'Wix-Verbindung konnte nicht geprüft werden.');
    return result;
  }
  function updateOptions() {
    const state=getState();
    const value=form.elements.seasonId.value;
    form.elements.seasonId.innerHTML='<option value="">Season auswählen</option>'+state.seasons.filter(s=>s.status!=='abgeschlossen')
      .map(s=>`<option value="${escape(s.id)}">${escape(s.name)} · ${escape(s.start_date)} bis ${escape(s.end_date)}</option>`).join('');
    if(state.seasons.some(s=>s.id===value))form.elements.seasonId.value=value;
    const isPlan=form.elements.kind.value==='plan';
    form.querySelector('[data-wix-season]').classList.toggle('hidden',!isPlan);
    form.querySelector('[data-wix-package]').classList.toggle('hidden',!isPlan);
    form.querySelector('[data-wix-type]').classList.toggle('hidden',isPlan);
    form.elements.seasonId.required=isPlan;
    const preset=PACKAGES.find(p=>p[0]===form.elements.packagePreset.value);
    const chosen=new Set([...form.querySelectorAll('[name="courseId"]:checked')].map(i=>i.value));
    const courses=state.courses.filter(c=>!isPlan || preset[2].includes(c.weekday));
    form.querySelector('[data-wix-courses]').innerHTML=courses.map(c=>`<label class="checkbox-line"><input type="checkbox" name="courseId" value="${escape(c.id)}" ${chosen.has(c.id) || (isPlan && courses.filter(x=>x.weekday===c.weekday).length===1)?'checked':''}><span>${escape(c.name)} · ${escape(c.weekday)} ${escape(c.time)}</span></label>`).join('') || '<p>Bitte zuerst Kurse anlegen.</p>';
  }
  function paint() {
    panel.querySelector('[data-wix-mappings]').innerHTML=mappings.length?mappings.map(m=>{
      const season=getState().seasons.find(s=>s.id===m.season_id);
      return `<article class="stat-card"><h3>${escape(m.label)}</h3><p>${escape(labels[m.booking_type])}${season?' · '+escape(season.name):''}</p><p class="stat-meta">${escape(m.course_ids.map(id=>getState().courses.find(c=>c.id===id)?.name || 'Kurs fehlt').join(', '))}</p><p class="stat-meta">Wix-ID: ${escape(m.offer_id)}</p><button type="button" class="ghost" data-wix-toggle="${escape(m.id)}">${m.active?'Zuordnung pausieren':'Zuordnung aktivieren'}</button></article>`;
    }).join(''):'<p class="stat-meta">Noch keine Angebote zugeordnet. Lege pro Season die sieben Preispläne an.</p>';
    panel.querySelector('[data-wix-imports]').innerHTML=imports.length?imports.map(row=>`<article class="stat-card"><h3>${escape(statuses[row.status])} · ${escape(row.kind==='plan'?'Preisplankauf':'Terminbuchung')}</h3><p>${escape(row.message)}</p><p class="stat-meta">Angebots-ID: ${escape(row.offer_id)}</p><p class="stat-meta">Buchungs-ID: ${escape(row.external_id)}</p><p class="stat-meta">${escape(new Date(row.updated_at).toLocaleString('de-DE'))}</p><button type="button" class="ghost" data-wix-retry="${escape(row.external_id)}" data-kind="${escape(row.kind)}">Erneut aus Wix prüfen</button></article>`).join(''):'<p class="stat-meta">Noch keine Wix-Buchungen empfangen.</p>';
  }
  async function load() {
    if(busy)return;
    busy=true;
    const owner=getState().session?.user?.id;
    showStatus('Wix-Verbindung wird geprüft …');
    try {
      const setup=await api();
      if(owner!==getState().session?.user?.id)return;
      siteId=setup.siteId;
      const db=getState().supabase;
      const results=await Promise.all([
        db.from('wix_mappings').select('*').eq('site_id',siteId).order('created_at',{ascending:false}),
        db.from('wix_imports').select('kind,external_id,offer_id,status,message,updated_at').eq('site_id',siteId).order('updated_at',{ascending:false}).limit(100),
      ]);
      if(owner!==getState().session?.user?.id)return;
      if(results.some(r=>r.error)) throw new Error('Wix-Datenbank fehlt oder ist nicht zugänglich. Bitte supabase-wix.sql ausführen.');
      mappings=results[0].data;imports=results[1].data;
      paint();loaded=true;
      const attention=imports.filter(r=>['pending','review'].includes(r.status)).length;
      showStatus(`Server konfiguriert · ${attention} der letzten ${imports.length} Importe brauchen deine Aufmerksamkeit. Der Live-Abgleich muss in Wix aktiviert sein.`);
    } catch(error){showStatus(error.message);} finally {busy=false;}
  }
  async function perform(action) {
    if(busy)return;
    busy=true;
    panel.querySelectorAll('button').forEach(b=>b.disabled=true);
    try {await action();} catch(error){notify(error.message,true);} finally {
      busy=false;panel.querySelectorAll('button').forEach(b=>b.disabled=false);
    }
    await load();
  }
  form.elements.packagePreset.innerHTML=PACKAGES.map(([key,pkg,days])=>`<option value="${key}">${pkg} · ${days.join(' + ')}</option>`).join('');
  form.elements.kind.addEventListener('change',updateOptions);
  form.elements.packagePreset.addEventListener('change',updateOptions);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    void perform(async()=>{
      if(!siteId)throw new Error('Bitte zuerst die Wix-Verbindung konfigurieren und aktualisieren.');
      const data=new FormData(form),kind=data.get('kind'),preset=PACKAGES.find(p=>p[0]===data.get('packagePreset'));
      const courseIds=data.getAll('courseId');
      const days=courseIds.map(id=>getState().courses.find(c=>c.id===id)?.weekday);
      if(!courseIds.length || (kind==='plan' && (new Set(days).size!==preset[2].length || days.length!==preset[2].length || !days.every(d=>preset[2].includes(d)))))throw new Error('Bitte pro Paket-Trainingstag genau einen passenden Kurs auswählen.');
      const {error}=await getState().supabase.from('wix_mappings').insert({site_id:siteId,kind,offer_id:String(data.get('offerId')).trim(),label:String(data.get('label')).trim(),booking_type:kind==='plan'?'season':data.get('bookingType'),season_id:kind==='plan'?data.get('seasonId'):null,package_type:kind==='plan'?preset[1]:null,course_ids:courseIds});
      if(error)throw new Error(error.code==='23505'?'Dieses Wix-Angebot ist bereits zugeordnet.':'Zuordnung konnte nicht gespeichert werden. IDs, Season und Kurse prüfen.');
      form.elements.offerId.value='';form.elements.label.value='';notify('Zuordnung gespeichert. Wartende Importe können jetzt erneut geprüft werden.');
    });
  });
  panel.querySelector('[data-wix-refresh]').addEventListener('click',()=>void load());
  panel.querySelector('#wixManualImport').addEventListener('submit',event=>{
    event.preventDefault();const data=new FormData(event.currentTarget);
    void perform(async()=>{const result=await api({kind:data.get('kind'),id:String(data.get('externalId')).trim()});notify(result.message);await refreshApp();});
  });
  panel.addEventListener('click',event=>{
    const retry=event.target.closest('[data-wix-retry]'),toggle=event.target.closest('[data-wix-toggle]');
    if(retry)void perform(async()=>{const result=await api({kind:retry.dataset.kind,id:retry.dataset.wixRetry});notify(result.message);await refreshApp();});
    if(toggle)void perform(async()=>{const mapping=mappings.find(m=>m.id===toggle.dataset.wixToggle);const {error}=await getState().supabase.from('wix_mappings').update({active:!mapping.active}).eq('id',mapping.id);if(error)throw new Error('Zuordnung konnte nicht geändert werden.');});
  });
  return {render(){
    const state=getState(),current=state.session?.user?.id;
    if(userId!==current){userId=current;loaded=false;siteId='';mappings=[];imports=[];signature='';paint();}
    if(state.profile?.role!=='admin' || state.activeSection!=='#wixPanel')return;
    const next=JSON.stringify([state.courses,state.seasons]);
    if(next!==signature){signature=next;updateOptions();}
    if(!loaded && !busy){loaded=true;void load();}
  }};
}
