// Fake data until there's a backend.
import { type AnimationKind, generateAnimation } from "@/lib/pixel/animations";
import { encodeBitmap } from "@/lib/pixel/codec";
import { ANIMATION_HEIGHT, ANIMATION_WIDTH } from "@/lib/pixel/constants";
import type { DoodleKind } from "@/lib/pixel/doodles";

export type User = {
  handle: string;
  name: string;
  bio: string;
  joined: string;
};

export type Plaza = {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
};

export type PostBody =
  | { type: "drawing"; kind: DoodleKind; seed: number }
  | { type: "bitmap"; data: string; width: number; height: number }
  | { type: "animation"; frames: string[]; width: number; height: number; fps: number };

// Posts are always drawings, replies can be text or a drawing
export type ReplyBody = PostBody | { type: "text"; text: string };

export type Post = {
  id: string;
  author: string;
  // only set on real posts
  authorName?: string;
  replyCount?: number;
  plaza: string;
  // TODO: store real timestamps
  ago: string;
  caption?: string;
  body: PostBody;
  yeahs: number;
};

export type Reply = {
  id: string;
  postId: string;
  author: string;
  authorName?: string;
  ago: string;
  body: ReplyBody;
  yeahs: number;
};

export const DAILY_PROMPT = {
  title: "Your favorite snack",
  hint: "Sweet, sour, salty, or spicy",
};

export const users: User[] = [
  { handle: "dylan", name: "Dylan", bio: "Built this plaza. Mostly draws frogs.", joined: "Oct 2026" },
  { handle: "mossy", name: "Mossy", bio: "Tiny landscapes, big feelings.", joined: "Oct 2026" },
  { handle: "lunabee", name: "Luna", bio: "Space nerd. Will draw Saturn on request.", joined: "Oct 2026" },
  { handle: "kiko", name: "Kiko", bio: "Cats, cats, and occasionally a cat.", joined: "Oct 2026" },
  { handle: "sprocket", name: "Sprocket", bio: "Learning to animate one frame at a time.", joined: "Oct 2026" },
  { handle: "nightowl", name: "Night Owl", bio: "Posting after midnight since forever.", joined: "Oct 2026" },
  { handle: "tomatoes", name: "Tom", bio: "Gardener. The flowers are real, the drawing skills are not.", joined: "Oct 2026" },
];

export const plazas: Plaza[] = [
  {
    slug: "daily-prompt",
    name: "Daily Prompt",
    emoji: "✏️",
    tagline: "Draw something every day",
    description: "A new prompt every morning. No pressure to be good, just have fun.",
  },
  {
    slug: "critters",
    name: "Critters",
    emoji: "🐸",
    tagline: "Favorite animals or pets",
    description: "Draw any animal you like best.",
  },
  {
    slug: "spooky-season",
    name: "Spooky Season",
    emoji: "🎃",
    tagline: "Special plaza for October",
    description: "Pumpkins, ghosts, bats, and other spooky stuff.",
  },
  {
    slug: "tiny-worlds",
    name: "Tiny Worlds",
    emoji: "⛰️",
    tagline: "Landscapes & Environments",
    description: "Cities, oceans, mountains, and outer space.",
  },
  {
    slug: "doodle-qa",
    name: "Doodle Q&A",
    emoji: "❓",
    tagline: "Ask any art questions",
    description: "Questions, tips, and works in progress. Draw your question, and get answers in the replies.",
  },
];

function sampleAnimation(kind: AnimationKind, seed: number, fps: number): PostBody {
  return {
    type: "animation",
    frames: generateAnimation(kind, seed).map(encodeBitmap),
    width: ANIMATION_WIDTH,
    height: ANIMATION_HEIGHT,
    fps,
  };
}

export const posts: Post[] = [
  { id: "p1", author: "kiko", plaza: "critters", ago: "12m", caption: "a little cat head", body: { type: "drawing", kind: "cat", seed: 4 }, yeahs: 42 },
  { id: "a1", author: "sprocket", plaza: "daily-prompt", ago: "30m", caption: "Ball bouncing", body: sampleAnimation("bounce", 4, 12), yeahs: 58 },
  { id: "p2", author: "nightowl", plaza: "tiny-worlds", ago: "48m", caption: "3am skyline", body: { type: "drawing", kind: "city", seed: 11 }, yeahs: 87 },
  { id: "p3", author: "sprocket", plaza: "doodle-qa", ago: "1h", caption: "does anyone else draw with the eraser first? like carving it out?", body: { type: "drawing", kind: "space", seed: 15 }, yeahs: 13 },
  { id: "p4", author: "dylan", plaza: "critters", ago: "2h", caption: "ribbit (he caught nothing)", body: { type: "drawing", kind: "frog", seed: 7 }, yeahs: 120 },
  { id: "p5", author: "lunabee", plaza: "tiny-worlds", ago: "3h", caption: "saturn but make it stripes", body: { type: "drawing", kind: "space", seed: 3 }, yeahs: 64 },
  { id: "p6", author: "mossy", plaza: "spooky-season", ago: "4h", caption: "boo crew", body: { type: "drawing", kind: "ghost", seed: 5 }, yeahs: 98 },
  { id: "p7", author: "tomatoes", plaza: "daily-prompt", ago: "5h", caption: "a field of flowers", body: { type: "drawing", kind: "garden", seed: 9 }, yeahs: 31 },
  { id: "a2", author: "mossy", plaza: "tiny-worlds", ago: "6h", caption: "a boat in the sea", body: sampleAnimation("boat", 2, 8), yeahs: 71 },
  { id: "p8", author: "mossy", plaza: "tiny-worlds", ago: "7h", caption: "weekend hike, from memory", body: { type: "drawing", kind: "mountains", seed: 2 }, yeahs: 55 },
  { id: "p9", author: "kiko", plaza: "doodle-qa", ago: "9h", caption: "day 3 of trying to draw a horse. day 3 of drawing a cat instead. tips??", body: { type: "drawing", kind: "cat", seed: 18 }, yeahs: 76 },
  { id: "p10", author: "nightowl", plaza: "daily-prompt", ago: "11h", caption: "prompt: a rainy day", body: { type: "drawing", kind: "rain", seed: 6 }, yeahs: 48 },
  { id: "p11", author: "sprocket", plaza: "tiny-worlds", ago: "1d", caption: "sailing practice", body: { type: "drawing", kind: "sea", seed: 8 }, yeahs: 39 },
  { id: "p12", author: "lunabee", plaza: "spooky-season", ago: "1d", caption: "the ghost is friendly I promise", body: { type: "drawing", kind: "ghost", seed: 12 }, yeahs: 22 },
  { id: "p13", author: "tomatoes", plaza: "critters", ago: "2d", body: { type: "drawing", kind: "frog", seed: 21 }, yeahs: 17 },
  { id: "p14", author: "dylan", plaza: "doodle-qa", ago: "2d", caption: "a frog and a fly", body: { type: "drawing", kind: "frog", seed: 1 }, yeahs: 154 },
];

export const replies: Reply[] = [
  { id: "r1", postId: "p4", author: "kiko", ago: "1h", body: { type: "text", text: "he'll get one next time 🪰" }, yeahs: 9 },
  { id: "r2", postId: "p4", author: "mossy", ago: "1h", body: { type: "drawing", kind: "frog", seed: 33 }, yeahs: 14 },
  { id: "r3", postId: "p4", author: "sprocket", ago: "40m", body: { type: "text", text: "the cheeks!!" }, yeahs: 3 },
  { id: "r4", postId: "p2", author: "lunabee", ago: "30m", body: { type: "text", text: "the red windows are such a good touch" }, yeahs: 5 },
  { id: "r5", postId: "p6", author: "nightowl", ago: "2h", body: { type: "drawing", kind: "ghost", seed: 40 }, yeahs: 11 },
  { id: "r6", postId: "p3", author: "dylan", ago: "50m", body: { type: "text", text: "Yes! Fill the canvas with ink, then erase the shape. Feels like scratch art." }, yeahs: 8 },
  { id: "r7", postId: "p14", author: "kiko", ago: "2d", body: { type: "drawing", kind: "cat", seed: 50 }, yeahs: 20 },
  { id: "r8", postId: "p14", author: "tomatoes", ago: "2d", body: { type: "text", text: "hi!! love this place already" }, yeahs: 6 },
];

export const getUser = (handle: string) => users.find((u) => u.handle === handle);
export const getPlaza = (slug: string) => plazas.find((p) => p.slug === slug);
export const getPost = (id: string) => posts.find((p) => p.id === id);

export const postsInPlaza = (slug: string) => posts.filter((p) => p.plaza === slug);
export const postsByUser = (handle: string) => posts.filter((p) => p.author === handle);
export const repliesTo = (postId: string) => replies.filter((r) => r.postId === postId);
export const replyCount = (postId: string) => repliesTo(postId).length;

export const popularDrawings = (limit = 5) =>
  posts
    .filter((p) => p.body.type === "drawing")
    .toSorted((a, b) => b.yeahs - a.yeahs)
    .slice(0, limit);

export const yeahsReceived = (handle: string) =>
  postsByUser(handle).reduce((sum, p) => sum + p.yeahs, 0);
