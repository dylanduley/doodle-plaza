"use client";

import { useSyncExternalStore } from "react";
import { getMyProfile, PROFILE_CHANGED, type Profile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";

type State = { loading: boolean; profile: Profile | null };

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// One shared copy for the whole page, so the header and every Yeah! button
// don't each fetch the profile.
const SERVER_STATE: State = { loading: hasSupabase, profile: null };
let state: State = SERVER_STATE;
const listeners = new Set<() => void>();
let started = false;

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

function load() {
  getMyProfile()
    .then((profile) => set({ loading: false, profile }))
    .catch(() => set({ loading: false, profile: null }));
}

function start() {
  if (started || !hasSupabase) return;
  started = true;
  load();
  // Supabase docs: don't call Supabase inside this callback, so defer it
  createClient().auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(load, 0);
  });
  window.addEventListener(PROFILE_CHANGED, load);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMyProfile(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}
