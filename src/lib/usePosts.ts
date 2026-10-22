"use client";

import { useEffect, useState } from "react";
import { fetchPosts, type LivePost, PostError } from "@/lib/posts";

type State = { loading: boolean; posts: LivePost[]; error: string | null };

export function usePosts({ plaza, authorId }: { plaza?: string; authorId?: string } = {}) {
  const [state, setState] = useState<State>({ loading: true, posts: [], error: null });

  useEffect(() => {
    let cancelled = false;
    fetchPosts({ plaza, authorId })
      .then((posts) => !cancelled && setState({ loading: false, posts, error: null }))
      .catch(
        (err) =>
          !cancelled &&
          setState({
            loading: false,
            posts: [],
            error: err instanceof PostError ? err.message : "We couldn't load the latest doodles.",
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [plaza, authorId]);

  return state;
}
