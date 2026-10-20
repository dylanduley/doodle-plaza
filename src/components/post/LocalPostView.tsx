"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/ui/Blocks";
import { TrashIcon } from "@/components/editor/icons";
import { PencilIcon, ReplyIcon } from "@/components/ui/icons";
import { AuthorName, DeviceBadge, PlazaChip, PostBodyView } from "@/components/ui/Post";
import { YeahButton } from "@/components/ui/YeahButton";
import { getPlaza } from "@/lib/mock/data";
import { deleteLocalPost, GUEST_HANDLE, toPost } from "@/lib/local/posts";
import { useIsClient, useLocalPosts } from "@/lib/local/useLocalPosts";

export function LocalPostView({ id, justPosted }: { id: string; justPosted: boolean }) {
  const isClient = useIsClient();
  const stored = useLocalPosts().find((p) => p.id === id);
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Storage is browser-only. Don't flash "not found" before it's read.
  if (!isClient) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card h-72 animate-pulse" aria-busy="true" aria-label="Loading doodle" />
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title="Doodle not found">
          <p>
            This doodle isn&apos;t saved in this browser. Until accounts launch, doodles only live
            on the device they were posted from.
          </p>
          <Link href="/draw" className="btn btn-primary mt-4">
            <PencilIcon size={18} /> Draw a new one
          </Link>
        </EmptyState>
      </div>
    );
  }

  const post = toPost(stored);
  const plazaName = getPlaza(post.plaza)?.name ?? "the plaza";
  const label = post.caption ? `Your drawing: ${post.caption}` : "Your drawing";

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
            <AuthorName handle={GUEST_HANDLE} />
            <PlazaChip slug={post.plaza} />
            <DeviceBadge />
            <span className="ml-auto text-sm text-muted">
              {post.ago === "just now" ? "just now" : `${post.ago} ago`}
            </span>
          </header>
          <PostBodyView body={post.body} label={label} />
          {post.caption && <h1 className="text-xl font-extrabold">{post.caption}</h1>}

          <div className="flex flex-wrap items-center gap-2">
            <YeahButton count={post.yeahs} />
            <span className="pill-link pointer-events-none">
              <ReplyIcon size={17} /> 0 replies
            </span>

            <div className="ml-auto flex items-center gap-2">
              {confirmingDelete ? (
                <>
                  <span className="text-sm font-bold">Delete this doodle? This can&apos;t be undone.</span>
                  <button
                    type="button"
                    className="btn btn-dark px-4! py-1.5! text-sm"
                    onClick={() => {
                      deleteLocalPost(post.id);
                      router.push(`/u/${GUEST_HANDLE}?deleted=1`);
                    }}
                  >
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
          </div>
        </div>
        <p className="border-t-2 border-leaf-light bg-leaf-light/50 px-5 py-4 text-sm font-semibold sm:px-6">
          Replies and Yeahs from other people arrive with accounts. For now this doodle lives in this
          browser.
        </p>
      </article>
    </div>
  );
}
