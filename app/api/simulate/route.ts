import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { buildSimulatePrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { SimulateRequest, SimulateResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: SimulateRequest;
  try {
    body = (await req.json()) as SimulateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model || "openai/gpt-4o-mini";
  if (!body.campaign?.trim() || !body.personas?.length) {
    return NextResponse.json(
      { error: "Campaign text and personas are required." },
      { status: 400 }
    );
  }

  try {
    const content = await callOpenRouter(apiKey, model, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildSimulatePrompt(body) },
    ]);

    let parsed: SimulateResponse;
    try {
      parsed = JSON.parse(content) as SimulateResponse;
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("Model did not return valid JSON.");
      parsed = JSON.parse(content.slice(start, end + 1)) as SimulateResponse;
    }

    if (!parsed.reactions?.length) throw new Error("Model returned no reactions.");
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
