"use client";

import Link from "next/link";
import { type SubmitEvent, useId, useRef, useState } from "react";
import { DrawingEditor, type EditorApi } from "@/components/editor/DrawingEditor";
import { BitmapImage } from "@/components/ui/BitmapImage";
import { PencilIcon } from "@/components/ui/icons";
import { encodeBitmap } from "@/lib/pixel/codec";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";
import {
  createGuestProfile,
  HANDLE_MAX,
  handleProblem,
  NAME_MAX,
  normalizeHandle,
  type Profile,
  ProfileError,
  suggestHandle,
} from "@/lib/profiles";
import { useMyProfile } from "@/lib/useMyProfile";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";

export function MakeProfile({ next }: { next: string }) {
  const { loading, profile } = useMyProfile();
  const [justJoined, setJustJoined] = useState(false);

  if (loading) {
    return (
      <p className="card flex items-center gap-2 p-5 font-semibold text-muted" role="status">
        <span aria-hidden className="spinner" /> Checking for your profile…
      </p>
    );
  }

  if (profile) return <AlreadyHasProfile profile={profile} justJoined={justJoined} next={next} />;

  return (
    <DrawingEditor
      width={PROFILE_PICTURE_SIZE}
      height={PROFILE_PICTURE_SIZE}
      footer={(api) => <ProfileForm api={api} onJoined={() => setJustJoined(true)} />}
    />
  );
}

function AlreadyHasProfile({ profile, justJoined, next }: { profile: Profile; justJoined: boolean; next: string }) {
  // where they were headed before making a profile (e.g. replying to a post)
  const returnTo = justJoined && next !== "/" ? next : null;

  return (
    <section
      className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left"
      role={justJoined ? "status" : undefined}
    >
      <div className="w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-leaf-light">
        <BitmapImage
          data={profile.avatar}
          width={PROFILE_PICTURE_SIZE}
          height={PROFILE_PICTURE_SIZE}
          label={`${profile.display_name}'s profile picture`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold">
          {justJoined ? `Welcome to the plaza, ${profile.display_name}!` : `You're all set, ${profile.display_name}!`}
        </h2>
        <p className="text-muted">
          You&apos;re <strong className="text-ink">@{profile.handle}</strong> on this browser.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
          {returnTo && (
            <Link href={returnTo} className="btn btn-primary">
              Continue where you left off
            </Link>
          )}
          <Link href="/draw" className={returnTo ? "btn" : "btn btn-primary"}>
            <PencilIcon size={18} /> Start drawing
          </Link>
          <Link href={`/u/${profile.handle}`} className="btn">
            View your profile
          </Link>
          <Link href="/profile/edit" className="btn">
            Edit profile
          </Link>
        </div>
      </div>
    </section>
  );
}

type Status = { state: "idle" } | { state: "saving" } | { state: "error"; message: string } | { state: "saved" };

function ProfileForm({ api, onJoined }: { api: EditorApi; onJoined: () => void }) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement | null>(null);
  const handleRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  // handle follows the name until they edit it
  const [handleEdited, setHandleEdited] = useState(false);
  const [handleTaken, setHandleTaken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [attempted, setAttempted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // tokens are single use, so remount the widget after a failed attempt
  const [captchaKey, setCaptchaKey] = useState(0);
  const captchaError = TURNSTILE_SITE_KEY && !captchaToken ? "Please finish the quick check below." : null;

  const saving = status.state === "saving" || status.state === "saved";
  const pictureError = api.blank ? "Draw your profile picture first!" : null;
  const nameError = name.trim() ? null : "Add a display name.";
  const handleError = handleTaken === handle ? "That handle is taken. Try another one." : handleProblem(handle);

  function changeName(value: string) {
    setName(value);
    if (!handleEdited) setHandle(suggestHandle(value));
  }

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setAttempted(true);
    if (pictureError) return;
    if (nameError) return nameRef.current?.focus();
    if (handleError) return handleRef.current?.focus();
    if (captchaError) return;

    setStatus({ state: "saving" });
    try {
      await createGuestProfile({
        handle,
        displayName: name,
        avatar: encodeBitmap(api.getBitmap()),
        captchaToken: captchaToken ?? undefined,
      });
      setStatus({ state: "saved" });
      onJoined();
      // the form was at the bottom; bring the welcome message into view
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      if (err instanceof ProfileError && err.field === "handle") {
        setHandleTaken(handle);
        setStatus({ state: "idle" });
        handleRef.current?.focus();
        return;
      }
      setStatus({
        state: "error",
        message: err instanceof ProfileError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="card mt-2 flex flex-col gap-4 p-4 sm:p-5">
      <h2 id={`${id}-title`} className="text-lg font-extrabold">
        Who are you on the plaza?
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-bold">
            Display name
          </label>
          <input
            id={`${id}-name`}
            ref={nameRef}
            value={name}
            onChange={(e) => changeName(e.target.value)}
            maxLength={NAME_MAX}
            autoComplete="nickname"
            placeholder="Example"
            disabled={saving}
            aria-invalid={attempted && !!nameError}
            aria-describedby={attempted && nameError ? `${id}-name-error` : undefined}
            className="field"
          />
          {attempted && nameError && (
            <p id={`${id}-name-error`} className="field-error">
              {nameError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-handle`} className="text-sm font-bold">
            Handle
          </label>
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-bold text-muted">
              @
            </span>
            <input
              id={`${id}-handle`}
              ref={handleRef}
              value={handle}
              onChange={(e) => {
                setHandleEdited(true);
                setHandle(normalizeHandle(e.target.value));
              }}
              maxLength={HANDLE_MAX}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="example"
              disabled={saving}
              aria-invalid={(attempted || handleTaken === handle) && !!handleError}
              aria-describedby={`${id}-handle-hint`}
              className="field pl-8"
            />
          </div>
          <p id={`${id}-handle-hint`} className={(attempted || handleTaken === handle) && handleError ? "field-error" : "text-xs font-semibold text-muted"}>
            {(attempted || handleTaken === handle) && handleError
              ? handleError
              : "Letters, numbers, and underscores. You can't change it later."}
          </p>
        </div>
      </div>

      {attempted && pictureError && (
        <p role="alert" className="field-error">
          {pictureError}
        </p>
      )}

      {status.state === "error" && (
        <div role="alert" className="error-box">
          <p>
            <strong>Your profile wasn&apos;t saved.</strong> {status.message} Your drawing is still here.
          </p>
          <button type="submit" className="btn shrink-0">
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Turnstile key={captchaKey} onToken={setCaptchaToken} />
        {attempted && captchaError && (
          <p role="alert" className="field-error">
            {captchaError}
          </p>
        )}
      </div>

      <p className="rounded-xl bg-leaf-light px-4 py-3 text-sm font-semibold text-leaf-deep">
        This is a temporary profile saved to this browser. Full accounts are coming soon. If you clear
        your browser data or switch devices, you&apos;ll start a new profile.
      </p>

      <button type="submit" className="btn btn-primary self-end" disabled={saving} aria-live="polite">
        {saving ? (
          <>
            <span aria-hidden className="spinner" /> Saving…
          </>
        ) : (
          "Join the plaza"
        )}
      </button>
    </form>
  );
}
