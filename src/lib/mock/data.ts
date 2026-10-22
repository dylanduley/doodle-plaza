// Sample plazas, daily prompt, and posts (all by Pip)
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
  {
    handle: "pip",
    name: "Pip",
    bio: "Plaza mascot. These are sample doodles to show what the plaza looks like. Real posts from people appear above them.",
    joined: "Oct 2026",
  },
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
  { id: "p1", author: "pip", plaza: "critters", ago: "12m", caption: "a little cat head", body: { type: "drawing", kind: "cat", seed: 4 }, yeahs: 42 },
  { id: "a1", author: "pip", plaza: "daily-prompt", ago: "30m", caption: "Ball bouncing", body: sampleAnimation("bounce", 4, 12), yeahs: 58 },
  { id: "p7", author: "pip", plaza: "daily-prompt", ago: "5h", caption: "a field of flowers", body: { type: "drawing", kind: "garden", seed: 9 }, yeahs: 31 },
  { id: "a2", author: "pip", plaza: "tiny-worlds", ago: "6h", caption: "a boat in the sea", body: sampleAnimation("boat", 2, 8), yeahs: 71 },
  { id: "p14", author: "pip", plaza: "doodle-qa", ago: "2d", caption: "a frog and a fly", body: { type: "drawing", kind: "frog", seed: 1 }, yeahs: 154 },
];

export const replies: Reply[] = [];

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
