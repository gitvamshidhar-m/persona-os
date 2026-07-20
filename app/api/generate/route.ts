import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { GenerateRequest, GenerateResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set. Add it to .env.local" },
      { status: 500 }
    );
  }

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model || "openai/gpt-4o-mini";
  if (!body.industry?.trim() || !body.description?.trim()) {
    return NextResponse.json(
      { error: "Industry and description are required." },
      { status: 400 }
    );
  }

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: buildUserPrompt(body) },
    ];

    let parsed: GenerateResponse | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const content = await callOpenRouter(apiKey, model, messages);
      try {
        parsed = parseResponse(content);
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "parse error";
        continue;
      }
      if (!parsed.personas || parsed.personas.length === 0) {
        lastErr = "Model returned no personas.";
        continue;
      }
      if (isComplete(parsed)) break;
      lastErr = "Response was incomplete; retrying.";
    }

    if (!parsed) throw new Error(lastErr || "Model did not return valid JSON.");
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function parseResponse(content: string): GenerateResponse {
  let parsed: GenerateResponse;
  try {
    parsed = JSON.parse(content) as GenerateResponse;
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end >= 0) {
      parsed = JSON.parse(content.slice(start, end + 1)) as GenerateResponse;
    } else {
      throw new Error("Model did not return valid JSON.");
    }
  }
  return parsed;
}

function isComplete(p: GenerateResponse): boolean {
  if (!p.analysis) return false;
  for (const persona of p.personas) {
    if (
      !persona.empathy ||
      !persona.jtbd?.length ||
      !persona.confidence ||
      !persona.marketSizing ||
      !persona.competitive ||
      !persona.validation
    ) {
      return false;
    }
  }
  return true;
}
