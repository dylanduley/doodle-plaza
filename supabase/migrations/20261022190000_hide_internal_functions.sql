-- These only run as triggers, never through the API. Remove API access so
-- the Security Advisor stops flagging them. Triggers still fire as before.
revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

-- Created by Supabase's "Enable automatic RLS" setting (an event trigger).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
