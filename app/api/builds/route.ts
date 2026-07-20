import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { GenerateResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await admin
    .from("builds")
    .select("id, name, created_at, data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ builds: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name: string; data: GenerateResponse };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.name || !body.data) {
    return NextResponse.json({ error: "name and data required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("builds")
    .insert({ user_id: user.id, name: body.name, data: body.data })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Auth not configured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin.from("builds").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
