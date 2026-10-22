"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostsFeed } from "@/components/post/PostsFeed";
import { BitmapImage } from "@/components/ui/BitmapImage";
import { EmptyState, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon, PencilIcon } from "@/components/ui/icons";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";
import { fetchProfileByHandle, type Profile } from "@/lib/profiles";
import { useMyProfile } from "@/lib/useMyProfile";

type State = { state: "loading" } | { state: "missing" } | { state: "ready"; profile: Profile };

const joinedFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

export function LiveProfile({
  handle,
  justDeleted,
  justUpdated,
}: {
  handle: string;
  justDeleted: boolean;
  justUpdated: boolean;
}) {
  const [loaded, setLoaded] = useState<State>({ state: "loading" });
  const { profile: me } = useMyProfile();

  useEffect(() => {
    let cancelled = false;
    fetchProfileByHandle(handle)
      .then((profile) => !cancelled && setLoaded(profile ? { state: "ready", profile } : { state: "missing" }))
      .catch(() => !cancelled && setLoaded({ state: "missing" }));
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (loaded.state === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="film h-56 animate-pulse" aria-busy="true" aria-label="Loading profile" />
      </div>
    );
  }

  if (loaded.state === "missing") {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title="Nobody here by that name">
          <p>There&apos;s no one called @{handle} on the plaza.</p>
          <Link href="/" className="btn btn-primary mt-4">
            Back to the plaza
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { profile } = loaded;
  const isMe = me?.id === profile.id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="film">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white sm:w-28">
            <BitmapImage
              data={profile.avatar}
              width={PROFILE_PICTURE_SIZE}
              height={PROFILE_PICTURE_SIZE}
              label={`${profile.display_name}'s profile picture`}
            />
          </div>
          <div className="min-w-0">
            <h1 className="logo-text text-4xl sm:text-5xl">{profile.display_name}</h1>
            <p className="mt-1 font-bold text-white">
              @{profile.handle} · joined {joinedFormat.format(new Date(profile.created_at))}
            </p>
          </div>
          {isMe && (
            <Link href="/profile/edit" className="btn sm:ml-auto">
              <PencilIcon size={18} /> Edit profile
            </Link>
          )}
        </div>
        {profile.bio && <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-ink">{profile.bio}</p>}
      </section>

      {(justDeleted || justUpdated) && isMe && (
        <p role="status" className="success-box">
          {justDeleted ? "Doodle deleted." : "Profile updated."}
        </p>
      )}

      <section aria-labelledby="profile-posts-heading" className="flex flex-col gap-4">
        <SectionBar
          id="profile-posts-heading"
          icon={<ClockIcon size={20} />}
          title={isMe ? "Your doodles" : "Posts"}
          action={
            isMe ? (
              <Link href="/draw" className="rounded-full bg-black/15 px-3 py-1 text-sm font-bold hover:bg-black/25">
                New doodle
              </Link>
            ) : undefined
          }
        />
        <PostsFeed
          authorId={profile.id}
          empty={
            <EmptyState title={isMe ? "No doodles yet" : "Nothing here yet"}>
              {isMe ? (
                <>
                  <p>Draw something and post it to a plaza. It&apos;ll show up here.</p>
                  <Link href="/draw" className="btn btn-primary mt-4">
                    <PencilIcon size={18} /> Start drawing
                  </Link>
                </>
              ) : (
                <p>{profile.display_name} hasn&apos;t posted any doodles yet.</p>
              )}
            </EmptyState>
          }
        />
      </section>
    </div>
  );
}
