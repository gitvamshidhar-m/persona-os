import { NextRequest } from "next/server";
import { streamOpenRouter } from "@/lib/openrouter";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import { GenerateRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: "OPENROUTER_API_KEY is not set. Add it to .env.local" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return new Response(`data: ${JSON.stringify({ error: "Invalid JSON body" })}\n\n`, {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const model = body.model || "openai/gpt-4o-mini";
  if (!body.industry?.trim() || !body.description?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ error: "Industry and description are required." })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: buildUserPrompt(body) },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const full = await streamOpenRouter(apiKey, model, messages, (token) =>
          send({ token })
        );
        send({ done: true, full });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
