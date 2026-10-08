-- Allow explicit absence corrections for eGYM, Hansefit and drop-in bookings.
alter table public.drop_in_bookings drop constraint drop_in_bookings_status_check;
alter table public.drop_in_bookings add constraint drop_in_bookings_status_check
  check (status in ('gebucht','teilgenommen','abgesagt','abwesend'));
