"use client";

import { useState } from "react";
import { PersonaReaction, SimulateResponse } from "@/lib/types";

export default function Simulate({
  businessSummary,
  personas,
  model,
}: {
  businessSummary: string;
  personas: { id: string; name: string; tagline: string; painPoints: string[]; goals: string[]; messaging: { hook: string; tone: string; objections: string[] } }[];
  model: string;
}) {
  const [campaign, setCampaign] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<PersonaReaction[]>([]);
  const [nameOf, setNameOf] = useState<Record<string, string>>({});

  const run = async () => {
    if (!campaign.trim()) return;
    setLoading(true);
    setError(null);
    setNameOf(Object.fromEntries(personas.map((p) => [p.id, p.name])));
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSummary, campaign, personas, model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Simulation failed");
      setReactions((json as SimulateResponse).reactions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-2 text-sm font-semibold text-white">Simulate a campaign</h3>
      <p className="mb-2 text-xs text-white/50">
        Paste ad copy or a campaign idea. See how each persona reacts before you spend.
      </p>
      <textarea
        className="min-h-[90px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        placeholder="e.g. 'Free shipping this weekend + 20% off your first serum. Sensitive skin? Our vegan formula is dermatologist-approved.'"
      />
      <button
        onClick={run}
        disabled={loading || !campaign.trim()}
        className="mt-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {loading ? "Simulating…" : "Run simulation"}
      </button>

      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}

      {reactions.length > 0 && (
        <div className="mt-4 space-y-3">
          {reactions.map((r) => (
            <div key={r.personaId} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{nameOf[r.personaId] || r.personaId}</span>
                <span className="text-xs text-white/60">
                  interest {r.interest}/100 · convert: {r.likelyToConvert}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80">{r.reaction}</p>
              {r.triggeredObjections.length > 0 && (
                <p className="mt-1 text-xs text-amber-300">
                  Triggered: {r.triggeredObjections.join(", ")}
                </p>
              )}
              <p className="mt-1 text-xs text-emerald-300">Tweak: {r.suggestedTweak}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
