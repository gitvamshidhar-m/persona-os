import { GenerateResponse } from "./types";

const DEFAULT_AVATARS = [
  "🧑",
  "👩",
  "🧔",
  "👨",
  "🧓",
  "👱",
  "🧕",
  "👨‍💻",
  "👩‍💼",
  "🧑‍🎓",
];

export function cleanAvatar(raw?: string | null, index = 0): string {
  if (raw && /^\p{Extended_Pictographic}/u.test(raw.trim())) {
    return raw.trim();
  }
  let h = 0;
  if (raw) for (const ch of raw) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DEFAULT_AVATARS[(h + index) % DEFAULT_AVATARS.length];
}

export function sanitizeAvatars(resp: GenerateResponse): GenerateResponse {
  return {
    ...resp,
    personas: resp.personas.map((p, i) => ({ ...p, avatar: cleanAvatar(p.avatar, i) })),
  };
}
