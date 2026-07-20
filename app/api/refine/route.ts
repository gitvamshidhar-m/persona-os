import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { buildRefinePrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { Persona, RefineRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not set." },
      { status: 500 }
    );
  }

  let body: RefineRequest;
  try {
    body = (await req.json()) as RefineRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = body.model || "openai/gpt-4o-mini";
  if (!body.instruction?.trim() || !body.persona) {
    return NextResponse.json(
      { error: "Instruction and persona are required." },
      { status: 400 }
    );
  }

  try {
    const content = await callOpenRouter(apiKey, model, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildRefinePrompt(body) },
    ]);

    let parsed: Persona;
    try {
      parsed = JSON.parse(content) as Persona;
    } catch {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("Model did not return valid JSON.");
      parsed = JSON.parse(content.slice(start, end + 1)) as Persona;
    }

    parsed.id = body.persona.id;
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
