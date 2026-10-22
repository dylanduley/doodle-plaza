"use client";

import { useEffect, useState } from "react";
import { getMyProfile, PROFILE_CHANGED, type Profile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";

const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function useMyProfile() {
  const [state, setState] = useState<{ loading: boolean; profile: Profile | null }>(() => ({
    loading: hasSupabase,
    profile: null,
  }));

  useEffect(() => {
    if (!hasSupabase) return;
    let cancelled = false;
    const load = () => {
      getMyProfile()
        .then((profile) => !cancelled && setState({ loading: false, profile }))
        .catch(() => !cancelled && setState({ loading: false, profile: null }));
    };
    load();

    // Supabase docs: don't call Supabase inside this callback, so defer it
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(load, 0);
    });
    window.addEventListener(PROFILE_CHANGED, load);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_CHANGED, load);
    };
  }, []);

  return state;
}
