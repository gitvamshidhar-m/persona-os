import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.redirect(`${origin}/?auth=error`);

  const res = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ? request.headers.get("cookie")!.split("; ").map((c) => {
              const [name, ...rest] = c.split("=");
              return { name, value: rest.join("=") };
            })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);
  return res;
}
