// Guest profiles. See docs/data-model.md
import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar: string;
  bio: string | null;
  created_at: string;
};

export const NAME_MAX = 30;
export const BIO_MAX = 160;

// window event so the header updates
export const PROFILE_CHANGED = "doodle-plaza:profile-changed";
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
const HANDLE_PATTERN = /^[a-z0-9_]+$/;

// Routes and words that would be confusing as handles.
const RESERVED_HANDLES = new Set(["you", "me", "admin", "doodleplaza", "pip", "settings", "signin"]);

export class ProfileError extends Error {
  readonly field: "handle" | "form";
  constructor(message: string, field: "handle" | "form" = "form") {
    super(message);
    this.name = "ProfileError";
    this.field = field;
  }
}

export function normalizeHandle(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

export function suggestHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, HANDLE_MAX);
}

// same rules as the DB check
export function handleProblem(handle: string): string | null {
  if (handle.length < HANDLE_MIN) return `Handles need at least ${HANDLE_MIN} characters.`;
  if (handle.length > HANDLE_MAX) return `Handles can be up to ${HANDLE_MAX} characters.`;
  if (!HANDLE_PATTERN.test(handle)) return "Use only letters, numbers, and underscores.";
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved. Try another one.";
  return null;
}

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new ProfileError("We couldn't load your profile. Please refresh the page.");
  return data as Profile | null;
}

export async function fetchProfileByHandle(handle: string): Promise<Profile | null> {
  const { data, error } = await createClient().from("profiles").select("*").eq("handle", handle).maybeSingle();
  if (error) throw new ProfileError("We couldn't load this profile.");
  return data as Profile | null;
}

export async function createGuestProfile(input: {
  handle: string;
  displayName: string;
  avatar: string;
}): Promise<Profile> {
  const supabase = createClient();

  // reuse the guest user if an earlier attempt made one (e.g. handle was taken)
  let {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      console.error(error);
      throw new ProfileError("We couldn't start your profile. Check your connection and try again.");
    }
    user = data.user;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id, handle: input.handle, display_name: input.displayName.trim(), avatar: input.avatar })
    .select()
    .single();

  if (error) {
    // 23505 = unique violation: someone already has this handle.
    if (error.code === "23505") throw new ProfileError("That handle is taken. Try another one.", "handle");
    throw new ProfileError("We couldn't save your profile. Please try again.");
  }
  window.dispatchEvent(new Event(PROFILE_CHANGED));
  return data as Profile;
}

export async function updateMyProfile(input: { displayName: string; bio: string; avatar: string }): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ProfileError("Your profile couldn't be found on this browser.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: input.displayName.trim(), bio: input.bio.trim() || null, avatar: input.avatar })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw new ProfileError("We couldn't save your changes. Please try again.");
  window.dispatchEvent(new Event(PROFILE_CHANGED));
  return data as Profile;
}
