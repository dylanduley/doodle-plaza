-- Clients can only set the columns the app sends. Ids, authors (default
-- auth.uid()), and created_at come from the database, so nobody can
-- backdate a post.
revoke insert on public.profiles, public.posts, public.replies, public.yeahs, public.reports from authenticated;

grant insert (id, handle, display_name, avatar, bio) on public.profiles to authenticated;
grant insert (plaza, caption, width, height, frames, fps) on public.posts to authenticated;
grant insert (post_id, text, drawing) on public.replies to authenticated;
grant insert (post_id) on public.yeahs to authenticated;
grant insert (post_id, reply_id, reason) on public.reports to authenticated;

-- Per-person limits per hour, so one guest can't flood the plaza.
-- trigger args: the author column, then the max per hour
create function public.enforce_rate_limit()
returns trigger
language plpgsql
-- runs as the owner so it can count rows people can't read (like reports)
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name, tg_argv[0]
  ) into recent using auth.uid();

  if recent >= tg_argv[1]::integer then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.enforce_rate_limit('author_id', '20');
create trigger replies_rate_limit before insert on public.replies
  for each row execute function public.enforce_rate_limit('author_id', '60');
create trigger yeahs_rate_limit before insert on public.yeahs
  for each row execute function public.enforce_rate_limit('user_id', '300');
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '20');
