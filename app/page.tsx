"use client";

import { useEffect, useState } from "react";
import InputForm, { FormState } from "@/components/InputForm";
import Results from "@/components/Results";
import { GenerateResponse, EMPTY_RESPONSE, Persona, SavedBuild } from "@/lib/types";
import { decodeShare, encodeShare } from "@/lib/share";
import { deleteBuild, listBuilds, saveBuild } from "@/lib/storage";
import { TEMPLATES } from "@/lib/templates";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse>(EMPTY_RESPONSE);
  const [readOnly, setReadOnly] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedBuild[]>([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#v=")) {
      const dec = decodeShare(hash.slice(3));
      if (dec && dec.personas?.length) {
        setResult(dec);
        setReadOnly(true);
      }
    }
  }, []);

  const handleSubmit = async (data: FormState) => {
    setModel(data.model);
    setLoading(true);
    setError(null);
    setReadOnly(false);
    setSaved(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setResult(json as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = (persona: Persona) => {
    setResult((prev) => ({
      ...prev,
      personas: prev.personas.map((p) => (p.id === persona.id ? persona : p)),
    }));
  };

  const handleSave = () => {
    const name = (result.businessSummary || "Build").slice(0, 40);
    saveBuild(name, result);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
  };

  const reset = () => {
    setResult(EMPTY_RESPONSE);
    setReadOnly(false);
    setShared(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const openHistory = () => {
    setHistory(listBuilds());
    setShowHistory(true);
  };

  const loadBuild = (b: SavedBuild) => {
    setResult(b.response);
    setReadOnly(false);
    setShowHistory(false);
  };

  const removeBuild = (id: string) => {
    deleteBuild(id);
    setHistory(listBuilds());
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
      <header className="no-print mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Persona <span className="text-indigo-400">OS</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Describe any business. Get buyer personas + live marketing playbooks — for any industry.
          </p>
        </div>
        <button onClick={openHistory} className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
          History
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {showHistory && (
        <div className="no-print mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Saved builds</h3>
            <button onClick={() => setShowHistory(false)} className="text-xs text-white/50">Close</button>
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

      {saved && (
        <p className="no-print mt-4 text-center text-sm text-emerald-300">Saved to history.</p>
      )}
    </main>
  );
}
