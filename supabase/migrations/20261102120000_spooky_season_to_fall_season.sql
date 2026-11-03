-- Replace the Spooky Season plaza with Fall Season.
-- Existing spooky-season posts move to fall-season.

alter table public.posts drop constraint if exists posts_plaza_check;

update public.posts set plaza = 'fall-season' where plaza = 'spooky-season';

alter table public.posts add constraint posts_plaza_check
  check (plaza in ('daily-prompt', 'critters', 'fall-season', 'tiny-worlds', 'doodle-qa'));
