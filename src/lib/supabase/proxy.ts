import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Refreshes the session cookie. No login redirect, browsing is open to everyone.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No keys yet (fresh clone), so skip.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Keep getClaims() right after creating the client or guests can get signed out.
  await supabase.auth.getClaims();

  // Return this response so the new cookies reach the browser.
  return response;
}
