"use client";

import { useState } from "react";
import InputForm, { FormState } from "@/components/InputForm";
import Results from "@/components/Results";
import { GenerateResponse, EMPTY_RESPONSE } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse>(EMPTY_RESPONSE);

  const handleSubmit = async (data: FormState) => {
    setLoading(true);
    setError(null);
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

  const reset = () => {
    setResult(EMPTY_RESPONSE);
    setError(null);
  };

  const hasResult = result.personas.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Persona <span className="text-indigo-400">OS</span>
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Describe any business. Get buyer personas + live marketing playbooks — for any industry.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!hasResult ? (
        <InputForm onSubmit={handleSubmit} loading={loading} />
      ) : (
        <Results data={result} onReset={reset} />
      )}
    </main>
  );
}
