"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useId, useMemo, useRef, useState } from "react";
import { DrawingEditor, type EditorApi } from "@/components/editor/DrawingEditor";
import { EmptyState } from "@/components/ui/Blocks";
import { SignInIcon } from "@/components/ui/icons";
import { decodeBitmap, encodeBitmap } from "@/lib/pixel/codec";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";
import { BIO_MAX, NAME_MAX, type Profile, ProfileError, updateMyProfile } from "@/lib/profiles";
import { useMyProfile } from "@/lib/useMyProfile";

export function EditProfile() {
  const { loading, profile } = useMyProfile();

  if (loading) {
    return (
      <p className="card flex items-center gap-2 p-5 font-semibold text-muted" role="status">
        <span aria-hidden className="spinner" /> Loading your profile…
      </p>
    );
  }

  if (!profile) {
    return (
      <EmptyState title="No profile on this browser">
        <p>Make a profile first, then you can edit it here.</p>
        <Link href="/signin" className="btn btn-primary mt-4">
          <SignInIcon size={18} /> Make your profile
        </Link>
      </EmptyState>
    );
  }

  return <ProfileEditor key={profile.id} profile={profile} />;
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const initial = useMemo(() => {
    try {
      return decodeBitmap(profile.avatar);
    } catch {
      return undefined; // Unreadable picture: start blank rather than crash.
    }
  }, [profile.avatar]);

  return (
    <DrawingEditor
      width={PROFILE_PICTURE_SIZE}
      height={PROFILE_PICTURE_SIZE}
      initial={initial}
      footer={(api) => <EditForm api={api} profile={profile} />}
    />
  );
}

type Status = { state: "idle" } | { state: "saving" } | { state: "error"; message: string } | { state: "saved" };

function EditForm({ api, profile }: { api: EditorApi; profile: Profile }) {
  const router = useRouter();
  const id = useId();
  const nameRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [attempted, setAttempted] = useState(false);

  const saving = status.state === "saving" || status.state === "saved";
  const pictureError = api.blank ? "Your profile picture can't be empty. Draw something!" : null;
  const nameError = name.trim() ? null : "Add a display name.";
  const bioLeft = BIO_MAX - bio.length;

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setAttempted(true);
    if (pictureError) return;
    if (nameError) return nameRef.current?.focus();

    setStatus({ state: "saving" });
    try {
      await updateMyProfile({ displayName: name, bio, avatar: encodeBitmap(api.getBitmap()) });
      setStatus({ state: "saved" });
      router.push(`/u/${profile.handle}?updated=1`);
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof ProfileError ? err.message : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby={`${id}-title`} className="card mt-2 flex flex-col gap-4 p-4 sm:p-5">
      <h2 id={`${id}-title`} className="text-lg font-extrabold">
        Your details
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
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            autoComplete="nickname"
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
          <input
            id={`${id}-handle`}
            value={`@${profile.handle}`}
            readOnly
            aria-describedby={`${id}-handle-hint`}
            className="field bg-leaf-light/40 text-muted"
          />
          <p id={`${id}-handle-hint`} className="text-xs font-semibold text-muted">
            Handles can&apos;t be changed.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-bio`} className="text-sm font-bold">
          Bio <span className="font-semibold text-muted">(optional)</span>
        </label>
        <textarea
          id={`${id}-bio`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={2}
          placeholder="What do you like to draw?"
          disabled={saving}
          aria-describedby={`${id}-bio-count`}
          className="field resize-none"
        />
        <p
          id={`${id}-bio-count`}
          className={`text-right text-xs font-semibold ${bioLeft <= 10 ? "text-accent" : "text-muted"}`}
        >
          {bioLeft} characters left
        </p>
      </div>

      {attempted && pictureError && (
        <p role="alert" className="field-error">
          {pictureError}
        </p>
      )}

      {status.state === "error" && (
        <div role="alert" className="error-box">
          <p>
            <strong>Your changes weren&apos;t saved.</strong> {status.message}
          </p>
          <button type="submit" className="btn shrink-0">
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link href={`/u/${profile.handle}`} className="btn">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary" disabled={saving} aria-live="polite">
          {saving ? (
            <>
              <span aria-hidden className="spinner" /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </form>
  );
}
