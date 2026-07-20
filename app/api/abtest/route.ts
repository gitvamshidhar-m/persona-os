import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { buildABPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { ABRequest, ABResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not set." }, { status: 500 });
  }

  let body: ABRequest;
  try {
    body = (await req.json()) as ABRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model || "openai/gpt-4o-mini";
  if (!body.messageA?.trim() || !body.messageB?.trim() || !body.personas?.length) {
    return NextResponse.json({ error: "Two messages and personas are required." }, { status: 400 });
  }

  try {
    const content = await callOpenRouter(apiKey, model, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildABPrompt(body) },
    ]);

    let parsed: ABResponse;
    try {
      parsed = JSON.parse(content) as ABResponse;
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("Model did not return valid JSON.");
      parsed = JSON.parse(content.slice(start, end + 1)) as ABResponse;
    }
    if (!parsed.results?.length) throw new Error("Model returned no results.");
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
