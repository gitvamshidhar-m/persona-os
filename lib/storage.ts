"use client";

import { GenerateResponse, SavedBuild } from "./types";

const KEY = "persona-os:history";

function read(): SavedBuild[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: SavedBuild[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
}

export function listBuilds(): SavedBuild[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveBuild(name: string, response: GenerateResponse): SavedBuild {
  const list = read();
  const build: SavedBuild = {
    id: Math.random().toString(36).slice(2),
    name: name || "Untitled build",
    createdAt: Date.now(),
    response,
  };
  write([build, ...list]);
  return build;
}

export function getBuild(id: string): SavedBuild | undefined {
  return read().find((b) => b.id === id);
}

export function deleteBuild(id: string) {
  write(read().filter((b) => b.id !== id));
}

export function clearBuilds() {
  write([]);
}
