"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrashIcon } from "@/components/editor/icons";
import { EmptyState } from "@/components/ui/Blocks";
import { PencilIcon, ReplyIcon, SignInIcon } from "@/components/ui/icons";
import { AuthorName, PlazaChip, PostBodyView } from "@/components/ui/Post";
import { YeahButton } from "@/components/ui/YeahButton";
import { getPlaza } from "@/lib/mock/data";
import { deletePost, fetchPost, type LivePost, PostError } from "@/lib/posts";
import { useMyProfile } from "@/lib/useMyProfile";

type State = { state: "loading" } | { state: "missing" } | { state: "error"; message: string } | { state: "ready"; post: LivePost };

export function LivePostView({ id, justPosted }: { id: string; justPosted: boolean }) {
  const [loaded, setLoaded] = useState<State>({ state: "loading" });
  const { profile } = useMyProfile();
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPost(id)
      .then((post) => !cancelled && setLoaded(post ? { state: "ready", post } : { state: "missing" }))
      .catch(
        (err) =>
          !cancelled &&
          setLoaded({ state: "error", message: err instanceof PostError ? err.message : "Something went wrong." }),
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loaded.state === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card h-72 animate-pulse" aria-busy="true" aria-label="Loading doodle" />
      </div>
    );
  }

  if (loaded.state !== "ready") {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title={loaded.state === "missing" ? "Doodle not found" : "Couldn't load this doodle"}>
          <p>{loaded.state === "missing" ? "It may have been deleted." : `${loaded.message} Try refreshing.`}</p>
          <Link href="/" className="btn btn-primary mt-4">
            Back to the plaza
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { post } = loaded;
  const isMine = profile?.id === post.authorId;
  const name = post.authorName ?? post.author;
  const kind = post.body.type === "animation" ? "Animation" : "Drawing";
  const label = post.caption ? `${kind} by ${name}: ${post.caption}` : `${kind} by ${name}`;
  const plazaName = getPlaza(post.plaza)?.name ?? "the plaza";

  async function remove() {
    setDeleteError(null);
    try {
      await deletePost(post.id);
      router.push(`/u/${post.author}?deleted=1`);
    } catch (err) {
      setDeleteError(err instanceof PostError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {justPosted && (
        <p role="status" className="success-box">
          <span aria-hidden>🎉</span> Posted to {plazaName}!
          <Link href={`/plazas/${post.plaza}`} className="ml-auto underline">
            See it in the plaza
          </Link>
        </p>
      )}

      <article className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <AuthorName handle={post.author} name={name} />
            <PlazaChip slug={post.plaza} />
            <span className="ml-auto text-sm text-muted">{post.ago === "just now" ? "just now" : `${post.ago} ago`}</span>
          </header>
          <PostBodyView body={post.body} label={label} />
          {post.caption && <h1 className="text-xl font-extrabold">{post.caption}</h1>}

          <div className="flex flex-wrap items-center gap-2">
            <YeahButton count={post.yeahs} />
            <span className="pill-link pointer-events-none">
              <ReplyIcon size={17} /> 0 replies
            </span>

            {isMine && (
              <div className="ml-auto flex items-center gap-2">
                {confirmingDelete ? (
                  <>
                    <span className="text-sm font-bold">Delete this doodle? This can&apos;t be undone.</span>
                    <button type="button" className="btn btn-dark px-4! py-1.5! text-sm" onClick={remove}>
                      Delete
                    </button>
                    <button
                      type="button"
                      className="btn px-4! py-1.5! text-sm"
                      onClick={() => setConfirmingDelete(false)}
                      autoFocus
                    >
                      Keep it
                    </button>
                  </>
                ) : (
                  <button type="button" className="pill-link" onClick={() => setConfirmingDelete(true)}>
                    <TrashIcon size={17} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
          {deleteError && (
            <p role="alert" className="field-error">
              {deleteError}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 border-t-2 border-leaf-light bg-leaf-light/50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <p className="font-semibold">No replies yet. Replies are coming soon.</p>
          {profile ? (
            <Link href="/draw" className="btn sm:ml-auto">
              <PencilIcon size={18} /> Draw something
            </Link>
          ) : (
            <Link href={`/signin?next=/p/${post.id}`} className="btn sm:ml-auto">
              <SignInIcon size={18} /> Make your profile
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
