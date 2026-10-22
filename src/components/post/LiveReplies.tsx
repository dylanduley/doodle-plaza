"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type SubmitEvent, useEffect, useId, useState } from "react";
import { DrawingEditor, type EditorApi } from "@/components/editor/DrawingEditor";
import { TrashIcon } from "@/components/editor/icons";
import { PencilIcon, SignInIcon } from "@/components/ui/icons";
import { ReplyCard } from "@/components/ui/Post";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/pixel/constants";
import { createReply, deleteReply, fetchReplies, type LiveReply, REPLY_MAX, ReplyError } from "@/lib/replies";
import { useMyProfile } from "@/lib/useMyProfile";

export function LiveReplies({ postId, onCountChange }: { postId: string; onCountChange: (count: number) => void }) {
  const { profile } = useMyProfile();
  const pathname = usePathname();
  const [replies, setReplies] = useState<LiveReply[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchReplies(postId)
      .then((r) => !cancelled && setReplies(r))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  function update(next: LiveReply[]) {
    setReplies(next);
    onCountChange(next.length);
  }

  return (
    <>
      {loadError && (
        <p role="alert" className="error-box mx-5 mb-4">
          We couldn&apos;t load the replies. Try refreshing the page.
        </p>
      )}

      {replies && replies.length > 0 && (
        <section aria-label="Replies" className="bg-cream">
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              actions={
                profile?.id === reply.authorId ? (
                  <DeleteReply onDeleted={() => update(replies.filter((r) => r.id !== reply.id))} id={reply.id} />
                ) : undefined
              }
            />
          ))}
        </section>
      )}

      <div className="border-t-2 border-leaf-light bg-leaf-light/50 px-5 py-5 sm:px-6">
        {profile ? (
          <ReplyForm postId={postId} onSent={(reply) => update([...(replies ?? []), reply])} />
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <p className="font-semibold">
              {replies?.length ? "" : "No replies yet. "}Replies can be typed or drawn.
            </p>
            <Link href={`/signin?next=${encodeURIComponent(pathname)}`} className="btn sm:ml-auto">
              <SignInIcon size={18} /> Make a profile to reply
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function DeleteReply({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    try {
      await deleteReply(id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ReplyError ? err.message : "Something went wrong.");
    }
  }

  if (error) {
    return (
      <p role="alert" className="field-error">
        {error}
      </p>
    );
  }

  return confirming ? (
    <>
      <span className="text-sm font-bold">Delete your reply?</span>
      <button type="button" className="btn btn-dark px-3! py-1! text-sm" onClick={remove}>
        Delete
      </button>
      <button type="button" className="btn px-3! py-1! text-sm" onClick={() => setConfirming(false)} autoFocus>
        Keep it
      </button>
    </>
  ) : (
    <button type="button" className="pill-link text-xs" onClick={() => setConfirming(true)}>
      <TrashIcon size={15} /> Delete
    </button>
  );
}

type Mode = "type" | "draw";

function ReplyForm({ postId, onSent }: { postId: string; onSent: (reply: LiveReply) => void }) {
  const [mode, setMode] = useState<Mode>("type");
  // Bumped after sending a drawing, so the editor starts fresh.
  const [canvasKey, setCanvasKey] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-extrabold">Reply</h2>
        <div className="tray bg-white/70!" role="group" aria-label="Reply type">
          <button type="button" className="pill-link" aria-pressed={mode === "type"} onClick={() => setMode("type")}>
            Type
          </button>
          <button type="button" className="pill-link" aria-pressed={mode === "draw"} onClick={() => setMode("draw")}>
            <PencilIcon size={15} /> Draw
          </button>
        </div>
      </div>

      {mode === "type" ? (
        <TextReply postId={postId} onSent={onSent} />
      ) : (
        <DrawingEditor
          key={canvasKey}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          footer={(api) => (
            <DrawingReply
              api={api}
              postId={postId}
              onSent={(reply) => {
                onSent(reply);
                setCanvasKey((k) => k + 1);
              }}
            />
          )}
        />
      )}
    </div>
  );
}

function TextReply({ postId, onSent }: { postId: string; onSent: (reply: LiveReply) => void }) {
  const id = useId();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = REPLY_MAX - text.length;

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    if (!text.trim()) return setError("Write something first.");
    setSending(true);
    setError(null);
    try {
      onSent(await createReply(postId, { text }));
      setText("");
    } catch (err) {
      setError(err instanceof ReplyError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor={`${id}-text`} className="sr-only">
        Your reply
      </label>
      <textarea
        id={`${id}-text`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={REPLY_MAX}
        rows={2}
        placeholder="Say something nice"
        disabled={sending}
        aria-invalid={!!error}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
        className="field resize-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <p id={`${id}-count`} className={`text-xs font-semibold ${left <= 20 ? "text-accent" : "text-muted"}`}>
          {left} characters left
        </p>
        {error && (
          <p id={`${id}-error`} role="alert" className="field-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary ml-auto" disabled={sending}>
          {sending ? (
            <>
              <span aria-hidden className="spinner" /> Sending…
            </>
          ) : (
            "Send reply"
          )}
        </button>
      </div>
    </form>
  );
}

function DrawingReply({
  api,
  postId,
  onSent,
}: {
  api: EditorApi;
  postId: string;
  onSent: (reply: LiveReply) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (sending) return;
    if (api.blank) return setError("Your canvas is empty. Draw something first!");
    setSending(true);
    setError(null);
    try {
      onSent(await createReply(postId, { drawing: api.getBitmap() }));
    } catch (err) {
      setError(err instanceof ReplyError ? err.message : "Something went wrong. Please try again.");
      setSending(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-primary ml-auto" onClick={send} disabled={sending}>
        {sending ? (
          <>
            <span aria-hidden className="spinner" /> Sending…
          </>
        ) : (
          "Send drawing"
        )}
      </button>
    </div>
  );
}
