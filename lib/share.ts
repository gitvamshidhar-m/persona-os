"use client";

import { GenerateResponse } from "./types";

export function encodeShare(response: GenerateResponse): string {
  const json = JSON.stringify(response);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeShare(encoded: string): GenerateResponse | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as GenerateResponse;
  } catch {
    return null;
  }
}
