-- Replace the Daily Prompt plaza with Free Draw, a general plaza for anything.
-- Existing daily-prompt posts move to free-draw.

alter table public.posts drop constraint if exists posts_plaza_check;

update public.posts set plaza = 'free-draw' where plaza = 'daily-prompt';

alter table public.posts add constraint posts_plaza_check
  check (plaza in ('free-draw', 'critters', 'fall-season', 'tiny-worlds', 'doodle-qa'));
