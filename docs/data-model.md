# Data model (Supabase)

Shared data for posts, replies, and yeahs, with **guest profiles** instead of full accounts for now (see decision 25). Plazas stay hard-coded in the app (`src/lib/mock/data.ts`) because there are only a few and they rarely change.

## Tables

### `profiles`

One row per guest, created when they finish "Make your profile".

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | Same as the Supabase auth user id (anonymous sign-in) |
| `handle` | text, unique | Lowercase, 3–20 chars, letters/numbers/underscore. Can't be changed. |
| `display_name` | text | Up to 30 chars |
| `avatar` | text | 120×120 drawing, encoded with `encodeBitmap` |
| `bio` | text, optional | Up to 160 chars |
| `created_at` | timestamptz | |

### `posts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `author_id` | uuid → `profiles.id` | |
| `plaza` | text | Plaza slug, e.g. `critters` |
| `caption` | text, optional | Up to 80 chars |
| `width`, `height` | smallint | 320×120 (still) or 320×180 (animation) |
| `frames` | text[] | Encoded frames. A still drawing has exactly 1. Max 100. |
| `fps` | smallint, optional | Animations only: 2, 4, 8, 12, or 24 |
| `created_at` | timestamptz | |

### `replies`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `post_id` | uuid → `posts.id` | Deleted along with the post |
| `author_id` | uuid → `profiles.id` | |
| `text` | text, optional | Up to 280 chars |
| `drawing` | text, optional | Encoded 320×120 drawing |
| `created_at` | timestamptz | |

Exactly one of `text` or `drawing` must be set.

### `yeahs`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid → `profiles.id` | |
| `post_id` | uuid → `posts.id` | Deleted along with the post |
| `created_at` | timestamptz | |

Primary key is (`user_id`, `post_id`), so each person can Yeah! a post once. Yeahs are for posts only, not replies.

### `reports`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `reporter_id` | uuid → `profiles.id` | |
| `post_id` / `reply_id` | uuid, one of them | What's being reported |
| `reason` | text | Short reason |
| `created_at` | timestamptz | |

Insert-only. Reports are reviewed in the Supabase dashboard.

## Access rules (row-level security)

| Table | Read | Create | Change / delete |
|---|---|---|---|
| profiles | Everyone | Only your own row (`id = auth.uid()`) | Only your own |
| posts | Everyone | Only as yourself | Delete your own |
| replies | Everyone | Only as yourself | Delete your own |
| yeahs | Everyone | Only as yourself | Remove your own |
| reports | Nobody (dashboard only) | Any profile | Nobody |

Security rules check **who** is writing, not **what** they write, so the tables also enforce limits with check constraints: handle format, text lengths, allowed plazas and canvas sizes, frame count (≤ 100), and a maximum total size per post (3 million characters, far above any real drawing). That way nobody can skip the UI and store something huge.

## Extra protection (second migration)

- **Inserts are limited to the columns the app sends.** Ids, authors, and `created_at` are always set by the database, so nobody can backdate or future-date a post to pin it to the top of a feed, or fake a "joined" date.
- **Hourly limits per person:** 20 posts, 60 replies, 300 yeahs, 20 reports. Going over returns a friendly "take a short break" message.
- **Guest sign-up** is protected by Cloudflare Turnstile (CAPTCHA) and Supabase's own rate limit on anonymous sign-ins.
- **In the browser,** drawings from the database are checked before they're drawn (size and colors), since they come from other people.

## Choices and trade-offs

- **No yeahs on replies (for now).** Keeps it to one yeahs table. The reply Yeah! buttons in the UI go away until there's a reason to bring them back.
- **Animation frames stored in the post row.** A 100-frame animation is a few hundred KB of text. Fine at this scale and the simplest option. If it grows, frames can move to Supabase Storage with only the post loading code changing.
- **Handles can't change.** Avoids broken profile links. Display names can change.
- **Guest identity is per browser.** Clearing browser data or switching devices starts a new profile, until real accounts let a guest attach an email to the same identity.

## Migration

The schema lives in `supabase/migrations/`. Run it once in the Supabase SQL Editor (or with the Supabase CLI). Adding a plaza means updating the allowed list in the `posts_plaza_check` constraint with a new migration.
