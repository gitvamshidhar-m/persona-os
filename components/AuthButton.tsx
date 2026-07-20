"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) =>
      setEmail(data.user ? data.user.email ?? "logged in" : null)
    );
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user ? session.user.email ?? "logged in" : null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const logout = async () => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    await sb.auth.signOut();
    setEmail(null);
  };

  if (!getSupabaseBrowser()) return null;

  if (email) {
    return (
      <button onClick={logout} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
        {email} · Logout
      </button>
    );
  }
  return (
    <button onClick={login} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
      Login with GitHub
    </button>
  );
}
