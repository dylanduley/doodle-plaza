"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { DrawingEditor, type EditorApi } from "@/components/editor/DrawingEditor";
import { ProfileNeededNotice } from "@/components/profile/ProfileNeededNotice";
import { plazas } from "@/lib/mock/data";
import { ANIMATION_HEIGHT, ANIMATION_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/pixel/constants";
import { CAPTION_MAX, createPost, PostError } from "@/lib/posts";
import { useMyProfile } from "@/lib/useMyProfile";

type Props = {
  animated?: boolean;
  defaultPlaza?: string;
  /** For testing the error state. */
  simulateError?: boolean;
};

export function PostComposer({ animated = false, ...props }: Props) {
  return (
    <>
      <ProfileNeededNotice next={animated ? "/draw/animate" : "/draw"} />
      <DrawingEditor
        animated={animated}
        width={animated ? ANIMATION_WIDTH : CANVAS_WIDTH}
        height={animated ? ANIMATION_HEIGHT : CANVAS_HEIGHT}
        footer={(api) => <ComposerForm api={api} {...props} />}
      />
    </>
  );
}

type Status =
  | { state: "idle" }
  | { state: "posting" }
  | { state: "error"; message: string }
  | { state: "posted" };

function ComposerForm({ api, defaultPlaza = "", simulateError = false }: Props & { api: EditorApi }) {
  const router = useRouter();
  const id = useId();
  const { profile } = useMyProfile();
  const plazaRef = useRef<HTMLSelectElement | null>(null);
  const failNextAttempt = useRef(simulateError);

  const [caption, setCaption] = useState("");
  const [plaza, setPlaza] = useState(defaultPlaza);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  // Validation messages appear after the first Post attempt, not while drawing.
  const [attempted, setAttempted] = useState(false);

  const canvasError = api.blank
    ? api.animated
      ? "Your animation is empty. Draw on at least one frame first!"
      : "Your canvas is empty. Draw something first!"
    : null;
  const plazaError = plaza ? null : "Choose a plaza to post in.";
  const posting = status.state === "posting" || status.state === "posted";
  const charsLeft = CAPTION_MAX - caption.length;

  useEffect(() => {
    if (api.blank || status.state === "posted") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older Safari only shows the prompt when returnValue is set.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [api.blank, status.state]);

  async function submit(e?: SubmitEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (posting) return;
    setAttempted(true);
    if (canvasError) return;
    if (plazaError) {
      plazaRef.current?.focus();
      return;
    }

    setStatus({ state: "posting" });
    try {
      const simulateNetworkError = failNextAttempt.current;
      failNextAttempt.current = false;
      const post = await createPost(
        { frames: api.getFrames(), fps: api.fps, caption, plaza },
        { simulateNetworkError },
      );
      setStatus({ state: "posted" });
      router.push(`/p/${post.id}?posted=1`);
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof PostError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${id}-title`}
      className="card mt-2 flex flex-col gap-4 p-4 sm:p-5"
    >
      <h2 id={`${id}-title`} className="text-lg font-extrabold">
        {api.animated ? "Share your animation" : "Share it with the plaza"}
      </h2>

      <div className="grid gap-4 sm:grid-cols-[1fr_15rem]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-caption`} className="text-sm font-bold">
            Caption <span className="font-semibold text-muted">(optional)</span>
          </label>
          <input
            id={`${id}-caption`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={CAPTION_MAX}
            placeholder="Say something about your doodle"
            aria-describedby={`${id}-count`}
            disabled={posting}
            className="field"
          />
          <p
            id={`${id}-count`}
            className={`text-right text-xs font-semibold ${charsLeft <= 10 ? "text-accent" : "text-muted"}`}
          >
            {charsLeft} characters left
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-plaza`} className="text-sm font-bold">
            Plaza
          </label>
          <select
            id={`${id}-plaza`}
            ref={plazaRef}
            value={plaza}
            onChange={(e) => setPlaza(e.target.value)}
            required
            disabled={posting}
            aria-invalid={attempted && !!plazaError}
            aria-describedby={attempted && plazaError ? `${id}-plaza-error` : undefined}
            className="field"
          >
            <option value="" disabled>
              Choose a plaza…
            </option>
            {plazas.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
          {attempted && plazaError && (
            <p id={`${id}-plaza-error`} className="field-error">
              {plazaError}
            </p>
          )}
        </div>
      </div>

      {attempted && canvasError && (
        <p role="alert" className="field-error">
          {canvasError}
        </p>
      )}

      {status.state === "error" && (
        <div role="alert" className="error-box">
          <p>
            <strong>Your doodle wasn&apos;t posted.</strong> {status.message} Your drawing is still
            here.
          </p>
          <button type="submit" className="btn shrink-0">
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">
          {profile ? (
            <>
              Posting as <strong className="text-ink">@{profile.handle}</strong>
            </>
          ) : (
            "You need a profile to post."
          )}
        </p>
        <button type="submit" className="btn btn-primary sm:ml-auto" disabled={posting} aria-live="polite">
          {posting ? (
            <>
              <span aria-hidden className="spinner" /> Posting…
            </>
          ) : (
            "Post to the plaza"
          )}
        </button>
      </div>
    </form>
  );
}
