// Sample plazas, seasonal theme, and posts
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

// The gold card on the home and plaza pages points at this plaza. Change it when the season changes.
export const SEASON_THEME = {
  plaza: "fall-season",
  title: "It's November!",
  hint: "Falling leaves, pumpkins, cozy sweaters, warm drinks. Draw anything autumn.",
};

export const users: User[] = [
  {
    handle: "doodleplaza",
    name: "Doodle Plaza",
    bio: "These are sample doodles to show what the plaza looks like. Real posts from people appear above them.",
    joined: "Oct 2026",
  },
];

export const plazas: Plaza[] = [
  {
    slug: "free-draw",
    name: "Free Draw",
    emoji: "🎨",
    tagline: "Anything goes",
    description: "Doodles, sketches, and animations of anything you like. No theme needed.",
  },
  {
    slug: "critters",
    name: "Critters",
    emoji: "🐸",
    tagline: "Favorite animals or pets",
    description: "Draw any animal you like best.",
  },
  {
    slug: "fall-season",
    name: "Fall Season",
    emoji: "🍂",
    tagline: "Special plaza for autumn",
    description: "Falling leaves, pumpkins, cozy sweaters, and anything autumn.",
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
  { id: "p1", author: "doodleplaza", plaza: "critters", ago: "12m", caption: "a little cat head", body: { type: "drawing", kind: "cat", seed: 4 }, yeahs: 42 },
  { id: "a1", author: "doodleplaza", plaza: "free-draw", ago: "30m", caption: "Ball bouncing", body: sampleAnimation("bounce", 4, 12), yeahs: 58 },
  { id: "p7", author: "doodleplaza", plaza: "free-draw", ago: "5h", caption: "a field of flowers", body: { type: "drawing", kind: "garden", seed: 9 }, yeahs: 31 },
  { id: "a2", author: "doodleplaza", plaza: "tiny-worlds", ago: "6h", caption: "a boat in the sea", body: sampleAnimation("boat", 2, 8), yeahs: 71 },
  { id: "p14", author: "doodleplaza", plaza: "doodle-qa", ago: "2d", caption: "a frog and a fly", body: { type: "drawing", kind: "frog", seed: 1 }, yeahs: 154 },
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
