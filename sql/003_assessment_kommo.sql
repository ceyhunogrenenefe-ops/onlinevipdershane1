-- Kommo lead id (cron yeniden deneme için)
alter table assessment_leads add column if not exists kommo_lead_id bigint;
create index if not exists assessment_leads_kommo_idx on assessment_leads (kommo_lead_id);
notify pgrst, 'reload schema';
