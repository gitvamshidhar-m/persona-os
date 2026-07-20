export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[]
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://persona-os.local",
      "X-Title": "Persona OS",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function streamOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  onToken: (token: string) => void,
  maxTokens = 3000
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://persona-os.local",
      "X-Title": "Persona OS",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("No response stream from OpenRouter");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content ?? "";
        if (token) {
          full += token;
          onToken(token);
        }
      } catch {
        /* keepalive / partial line — ignore */
      }
    }
  }
  return full;
}
