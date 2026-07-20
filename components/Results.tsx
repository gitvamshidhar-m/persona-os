"use client";

import { useState } from "react";
import { Persona, GenerateResponse } from "@/lib/types";
import Compare from "./Compare";
import Simulate from "./Simulate";

interface ResultsProps {
  data: GenerateResponse;
  onReset: () => void;
  onRefine: (persona: Persona) => void;
  readOnly: boolean;
  onSave: () => void;
  onShare: () => void;
  shared: boolean;
  model: string;
}

export default function Results({
  data,
  onReset,
  onRefine,
  readOnly,
  onSave,
  onShare,
  shared,
  model,
}: ResultsProps) {
  const [view, setView] = useState<"cards" | "compare">("cards");
  const [showSim, setShowSim] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "persona-os-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          Viewing a shared build (read-only). Make a copy by clicking <span className="font-semibold">New</span>.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/70">{data.businessSummary}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setView(view === "cards" ? "compare" : "cards")} className={btn}>
            {view === "cards" ? "Compare" : "Cards"}
          </button>
          <button onClick={() => setShowSim((s) => !s)} className={btn}>
            {showSim ? "Hide sim" : "Simulate"}
          </button>
          <button onClick={download} className={btn}>Export JSON</button>
          {!readOnly && <button onClick={onSave} className={btn}>Save</button>}
          <button onClick={onShare} className={btn}>{shared ? "Link copied" : "Share link"}</button>
          <button onClick={onReset} className={btn}>New</button>
        </div>
      </div>

      {showSim && (
        <Simulate
          businessSummary={data.businessSummary}
          personas={data.personas.map((p) => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline,
            painPoints: p.painPoints,
            goals: p.goals,
            messaging: p.messaging,
          }))}
          model={model}
        />
      )}

      {view === "compare" ? (
        <Compare personas={data.personas} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.personas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              businessSummary={data.businessSummary}
              model={model}
              readOnly={readOnly}
              onRefine={onRefine}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const btn =
  "rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10";

function PersonaCard({
  persona,
  businessSummary,
  model,
  readOnly,
  onRefine,
}: {
  persona: Persona;
  businessSummary: string;
  model: string;
  readOnly: boolean;
  onRefine: (p: Persona) => void;
}) {
  const [tab, setTab] = useState<"profile" | "playbook">("profile");
  const [showRefine, setShowRefine] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doRefine = async () => {
    if (!instruction.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSummary, persona, instruction, model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refine failed");
      onRefine(json as Persona);
      setShowRefine(false);
      setInstruction("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{persona.avatar}</div>
          <div>
            <h3 className="text-lg font-semibold text-white">{persona.name}</h3>
            <p className="text-xs text-white/60">{persona.tagline}</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowRefine((s) => !s)}
            className="rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Refine
          </button>
        )}
      </div>

      {showRefine && (
        <div className="border-b border-white/10 bg-black/20 p-3">
          <textarea
            className="min-h-[60px] w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white outline-none focus:border-indigo-400"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Make this persona more price-sensitive and active on TikTok"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={doRefine}
              disabled={busy || !instruction.trim()}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
            >
              {busy ? "Refining…" : "Apply"}
            </button>
            <button onClick={() => setShowRefine(false)} className="text-xs text-white/50">
              Cancel
            </button>
          </div>
          {err && <p className="mt-1 text-xs text-red-300">{err}</p>}
        </div>
      )}

      <div className="flex gap-1 border-b border-white/10 px-3 pt-3 text-sm">
        {(["profile", "playbook"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 capitalize ${
              tab === t ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t === "playbook" ? "Live Playbook" : "Profile"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "profile" ? <Profile persona={persona} /> : <Playbook persona={persona} />}
      </div>
    </div>
  );
}

function Profile({ persona }: { persona: Persona }) {
  const d = persona.demographics;
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat k="Age" v={d.ageRange} />
        <Stat k="Role" v={d.role} />
        <Stat k="Location" v={d.location} />
        <Stat k="Income" v={d.income} />
        <Stat k="Education" v={d.education} />
      </div>

      <Group title="Pain points" items={persona.painPoints} />
      <Group title="Goals" items={persona.goals} />

      <div>
        <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Channels</h4>
        <div className="flex flex-wrap gap-1.5">
          {persona.channels.map((c) => (
            <span key={c} className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-white/80"><span className="text-white/50">Hook: </span>{persona.messaging.hook}</p>
        <p className="mt-1 text-white/60"><span className="text-white/50">Tone: </span>{persona.messaging.tone}</p>
        <div className="mt-2">
          <span className="text-xs uppercase tracking-wide text-white/40">Objections</span>
          <ul className="mt-1 list-disc pl-4 text-white/70">
            {persona.messaging.objections.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Playbook({ persona }: { persona: Persona }) {
  const pb = persona.playbook;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Content pillars</h4>
        {pb.contentPillars.map((p, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-2">
            <span className="font-medium text-white">{p.theme}</span>
            <span className="text-white/60"> — {p.angle}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Weekly plan</h4>
        <div className="space-y-1.5">
          {pb.weeklyPlan.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/20 p-2">
              <span className="mt-0.5 shrink-0 rounded bg-indigo-500/30 px-1.5 text-xs text-indigo-200">{w.day}</span>
              <div>
                <p className="text-white/90">
                  <span className="text-indigo-300">{w.channel}</span> · {w.format}
                </p>
                <p className="text-white/70">{w.topic}</p>
                <p className="text-xs text-emerald-300">CTA: {w.cta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Best times</h4>
          <ul className="list-disc pl-4 text-white/70">
            {pb.bestTimes.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Ad hooks</h4>
          <ul className="list-disc pl-4 text-white/70">
            {pb.adHooks.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <div className="text-white/40">{k}</div>
      <div className="text-white/90">{v}</div>
    </div>
  );
}

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">{title}</h4>
      <ul className="list-disc pl-4 text-white/70">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
