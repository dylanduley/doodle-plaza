"use client";

import { useSyncExternalStore } from "react";
import { getLocalPosts, NO_POSTS, subscribeLocalPosts } from "./posts";

export function useLocalPosts() {
  return useSyncExternalStore(subscribeLocalPosts, getLocalPosts, () => NO_POSTS);
}

const noopSubscribe = () => () => {};

// False until hydrated, so we don't say "not found" too early.
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
