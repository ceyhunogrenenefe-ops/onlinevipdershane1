-- Yetki + PostgREST şema yenileme (tablolar 001 ile oluştuktan sonra çalıştırın)
-- Geri alma gerekmez; yalnızca GRANT / POLICY / NOTIFY

grant usage on schema public to anon, authenticated, service_role;

grant all on table assessment_leads to service_role;
grant all on table assessment_events to service_role;
grant all on table lead_activities to service_role;
grant all on table counseling_appointments to service_role;
grant all on table integration_logs to service_role;
grant all on table assessment_tests to service_role;
grant all on table assessment_answers to service_role;
grant all on table assessment_scores to service_role;
grant all on table assessment_questions to service_role;
grant all on table assessment_question_options to service_role;
grant all on table assessment_attempts to service_role;
grant all on table assessment_attempt_answers to service_role;
grant all on table assessment_reports to service_role;

grant usage, select on all sequences in schema public to service_role;

drop policy if exists "service_role_all_leads" on assessment_leads;
create policy "service_role_all_leads" on assessment_leads for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_events" on assessment_events;
create policy "service_role_all_events" on assessment_events for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_activities" on lead_activities;
create policy "service_role_all_activities" on lead_activities for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_appointments" on counseling_appointments;
create policy "service_role_all_appointments" on counseling_appointments for all to service_role using (true) with check (true);
drop policy if exists "service_role_all_logs" on integration_logs;
create policy "service_role_all_logs" on integration_logs for all to service_role using (true) with check (true);

notify pgrst, 'reload schema';
