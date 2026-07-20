"use client";

import { useEffect, useState } from "react";
import InputForm, { FormState } from "@/components/InputForm";
import Results from "@/components/Results";
import AuthButton from "@/components/AuthButton";
import Toast from "@/components/Toast";
import SkeletonResults from "@/components/SkeletonResults";
import { GenerateResponse, EMPTY_RESPONSE, Persona, SavedBuild } from "@/lib/types";
import { decodeShare, encodeShare } from "@/lib/share";
import { deleteBuild, listBuilds, saveBuild } from "@/lib/storage";
import { sanitizeAvatars } from "@/lib/avatar";
import { TEMPLATES } from "@/lib/templates";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse>(EMPTY_RESPONSE);
  const [readOnly, setReadOnly] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liveText, setLiveText] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedBuild[]>([]);
  const [supabase] = useState(() => getSupabaseBrowser());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#v=")) {
      const dec = decodeShare(hash.slice(3));
      if (dec && dec.personas?.length) {
        setResult(sanitizeAvatars(dec));
        setReadOnly(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) =>
      setUserEmail(data.user ? data.user.email ?? "logged in" : null)
    );
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserEmail(s?.user ? s.user.email ?? "logged in" : null)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (data: FormState) => {
    setModel(data.model);
    setLoading(true);
    setError(null);
    setReadOnly(false);
    setLiveText("");

    const runOnce = async (): Promise<GenerateResponse | null> => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(j.error || "Generation failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.token) {
              full += obj.token;
              setLiveText(full);
            } else if (obj.done) {
              full = obj.full || full;
            } else if (obj.error) {
              throw new Error(obj.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message) throw e;
          }
        }
      }
      return parseGenerated(full);
    };

    let result: GenerateResponse | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 3 && !result; attempt++) {
      try {
        result = await runOnce();
      } catch (e) {
        lastErr = e instanceof Error ? e.message : "Error";
      }
    }
    if (result) setResult(result);
    else setError(lastErr || "Generation failed");
    setLoading(false);
  };

  const handleRefine = (persona: Persona) => {
    setResult((prev) => ({
      ...prev,
      personas: prev.personas.map((p) => (p.id === persona.id ? persona : p)),
    }));
  };

  const handleSave = async () => {
    const name = (result.businessSummary || "Build").slice(0, 40);
    if (supabase && userEmail) {
      try {
        const res = await fetch("/api/builds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, data: result }),
        });
        if (res.ok) {
          setToast("Saved to your cloud builds");
          return;
        }
      } catch {
        /* fall back to local */
      }
    }
    saveBuild(name, result);
    setToast("Saved to this device");
  };

  const handleShare = async () => {
    const encoded = encodeShare(result);
    const url = `${window.location.origin}/#v=${encoded}`;
    window.history.replaceState(null, "", `#v=${encoded}`);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked; URL is still in the address bar */
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    setToast("Share link copied to clipboard");
  };

  const reset = () => {
    setResult(EMPTY_RESPONSE);
    setReadOnly(false);
    setShared(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const refreshHistory = async (): Promise<SavedBuild[]> => {
    if (supabase && userEmail) {
      try {
        const res = await fetch("/api/builds");
        if (res.ok) {
          const json = await res.json();
          return (json.builds as Array<{ id: string; name: string; created_at: string; data: GenerateResponse }>).map(
            (b) => ({ id: b.id, name: b.name, createdAt: new Date(b.created_at).getTime(), response: b.data })
          );
        }
      } catch {
        /* fall back to local */
      }
    }
    return listBuilds();
  };

  const openHistory = async () => {
    setHistory(await refreshHistory());
    setShowHistory(true);
  };

  const loadBuild = (b: SavedBuild) => {
    setResult(sanitizeAvatars(b.response));
    setReadOnly(false);
    setShowHistory(false);
  };

  const removeBuild = async (id: string) => {
    if (supabase && userEmail) {
      try {
        await fetch(`/api/builds?id=${id}`, { method: "DELETE" });
      } catch {
        /* ignore */
      }
    } else {
      deleteBuild(id);
    }
    setHistory(await refreshHistory());
  };

  const hasResult = result.personas.length > 0;

  const [preset, setPreset] = useState<Partial<FormState> | undefined>();

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setPreset({
      industry: t.industry,
      description: t.description,
      goals: t.goals,
      audienceSize: t.audienceSize,
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">
            <span className="bg-gradient-to-r from-indigo-600 via-slate-700 to-sky-600 bg-clip-text text-transparent">
              Persona
            </span>{" "}
            <span className="text-indigo-600">OS</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Describe any business. Get buyer personas + live marketing playbooks — for any industry.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AuthButton />
          <button onClick={openHistory} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
            <span aria-hidden>🕘</span> History
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {showHistory && (
        <div className="no-print mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Saved builds
              {supabase && userEmail && (
                <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  Cloud
                </span>
              )}
              {!(supabase && userEmail) && (
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
                  Local
                </span>
              )}
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={openHistory} className="text-xs text-white/50 hover:text-white/80">Refresh</button>
              <button onClick={() => setShowHistory(false)} className="text-xs text-white/50">Close</button>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-white/50">No saved builds yet. Generate personas and click Save.</p>
          ) : (
            <ul className="space-y-1.5">
              {history.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <button onClick={() => loadBuild(b)} className="text-left">
                    <span className="text-sm text-white">{b.name}</span>
                    <span className="ml-2 text-xs text-white/40">
                      {new Date(b.createdAt).toLocaleString()} · {b.response.personas.length} personas
                    </span>
                  </button>
                  <button onClick={() => removeBuild(b.id)} className="text-xs text-red-300 hover:text-red-200">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hasResult ? (
        <div className="space-y-4">
          {loading ? (
            liveText ? (
              <LivePanel />
            ) : (
              <SkeletonResults />
            )
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="self-center text-xs text-white/40">Templates:</span>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => applyTemplate(t)}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <InputForm key={preset?.industry ?? "blank"} onSubmit={handleSubmit} loading={loading} initial={preset} />
            </>
          )}
        </div>
      ) : (
        <Results
          data={result}
          onReset={reset}
          onRefine={handleRefine}
          readOnly={readOnly}
          onSave={handleSave}
          onShare={handleShare}
          shared={shared}
          model={model}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </main>
  );
}

function LivePanel() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        Crafting your personas…
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Researching the market, building playbooks, and writing copy. This takes a few seconds.
      </p>
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 animate-skeleton rounded bg-slate-200"
            style={{ width: `${90 - i * 12}%`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function parseGenerated(content: string): GenerateResponse | null {
  let parsed: GenerateResponse;
  try {
    parsed = JSON.parse(content) as GenerateResponse;
  } catch {
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s < 0 || e < 0) return null;
    try {
      parsed = JSON.parse(content.slice(s, e + 1)) as GenerateResponse;
    } catch {
      return null;
    }
  }
  if (!parsed.personas || parsed.personas.length === 0) return null;
  return sanitizeAvatars(parsed);
}
