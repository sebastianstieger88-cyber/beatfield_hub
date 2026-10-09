create or replace function public.sync_wix_paid_amount()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.target_type='season' and new.target_id is not null
 and new.payload->>'paid_amount' ~ '^[0-9]+([.][0-9]{1,2})?$'
 and not (
   (new.payload->>'paid_amount')::numeric=0
   and coalesce((new.payload->'revenue_source'->>'planPrice')::numeric,0)>0
   and coalesce((new.payload#>>'{revenue_source,pricing,prices,0,price,subtotal}')::numeric,0)=0
   and coalesce((new.payload#>>'{revenue_source,pricing,prices,0,price,discount}')::numeric,0)=0
 ) then
 update public.season_bookings set paid_amount=(new.payload->>'paid_amount')::numeric where id=new.target_id;
 end if;
 return new;
end $$;
