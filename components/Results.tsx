"use client";

import { useState } from "react";
import { Persona, GenerateResponse, ABResponse, ABResult, ContentResponse } from "@/lib/types";
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
  const [showAB, setShowAB] = useState(false);
  const [sortPrio, setSortPrio] = useState(false);

  const hasPriority = data.personas.some((p) => p.priority);
  const ordered = sortPrio
    ? [...data.personas].sort((a, b) => (b.priority?.score ?? 0) - (a.priority?.score ?? 0))
    : data.personas;

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "persona-os-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pdf = () => window.print();

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="no-print rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          Viewing a shared build (read-only). Make a copy by clicking <span className="font-semibold">New</span>.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/70">{data.businessSummary}</p>
        <div className="flex flex-wrap gap-2 no-print">
          <button onClick={() => setView(view === "cards" ? "compare" : "cards")} className={btn}>
            {view === "cards" ? "Compare" : "Cards"}
          </button>
          <button onClick={() => setShowSim((s) => !s)} className={btn}>
            {showSim ? "Hide sim" : "Simulate"}
          </button>
          <button onClick={() => setShowAB((s) => !s)} className={btn}>
            {showAB ? "Hide A/B" : "A/B Test"}
          </button>
          {hasPriority && (
            <button onClick={() => setSortPrio((s) => !s)} className={btn}>
              {sortPrio ? "Default order" : "Sort by priority"}
            </button>
          )}
          <button onClick={pdf} className={btn}>PDF</button>
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

      {showAB && (
        <ABTest
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

      {data.analysis && (data.analysis.overlaps.length > 0 || data.analysis.notes) && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">Market research analysis</h3>
          {data.analysis.overlaps.map((o, i) => {
            const a = data.personas.find((p) => p.id === o.personas[0])?.name ?? o.personas[0];
            const b = data.personas.find((p) => p.id === o.personas[1])?.name ?? o.personas[1];
            return (
              <div key={i} className="mb-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
                <span className="font-medium text-amber-200">Overlap {o.score}%: {a} ↔ {b}</span>
                <p className="text-white/70">{o.reason}</p>
              </div>
            );
          })}
          {data.analysis.notes && (
            <p className="text-sm text-white/70">{data.analysis.notes}</p>
          )}
        </div>
      )}

      {view === "compare" ? (
        <Compare personas={ordered} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {ordered.map((p) => (
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
  const [tab, setTab] = useState<"profile" | "playbook" | "research">("profile");
  const [showRefine, setShowRefine] = useState(false);
  const [showContent, setShowContent] = useState(false);
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{persona.name}</h3>
              {persona.priority && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    persona.priority.score >= 70
                      ? "bg-emerald-500/20 text-emerald-300"
                      : persona.priority.score >= 40
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/10 text-white/60"
                  }`}
                  title={persona.priority.reason}
                >
                  {persona.priority.score}
                </span>
              )}
            </div>
            <p className="text-xs text-white/60">{persona.tagline}</p>
          </div>
        </div>
        {!readOnly && (
          <>
            <button
              onClick={() => setShowContent((s) => !s)}
              className="no-print rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              Content
            </button>
            <button
              onClick={() => setShowRefine((s) => !s)}
              className="no-print rounded-lg border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              Refine
            </button>
          </>
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

      {showContent && (
        <ContentPanel
          businessSummary={businessSummary}
          persona={persona}
          model={model}
          onClose={() => setShowContent(false)}
        />
      )}

      <div className="no-print flex gap-1 border-b border-white/10 px-3 pt-3 text-sm">
        {(["profile", "playbook", "research"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 capitalize ${
              tab === t ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t === "research" ? "Research" : t === "playbook" ? "Live Playbook" : "Profile"}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className={tab === "profile" ? "block print:block" : "hidden print:block"}>
          <Profile persona={persona} />
        </div>
        <div className={tab === "playbook" ? "block print:block" : "hidden print:block"}>
          <Playbook persona={persona} />
        </div>
        <div className={tab === "research" ? "block print:block" : "hidden print:block"}>
          <Research persona={persona} />
        </div>
      </div>
    </div>
  );
}

function Profile({ persona }: { persona: Persona }) {
  const d = persona.demographics;
  return (
    <div className="space-y-4 text-sm">
      {persona.priority && (
        <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-2">
          <span className="text-xs uppercase tracking-wide text-white/40">Priority </span>
          <span className="font-semibold text-white">{persona.priority.score}/100</span>
          <p className="text-white/70">{persona.priority.reason}</p>
        </div>
      )}
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

function Research({ persona }: { persona: Persona }) {
  const e = persona.empathy;
  const c = persona.confidence;
  const m = persona.marketSizing;
  const comp = persona.competitive;
  return (
    <div className="space-y-4 text-sm">
      {c && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <span className="text-xs uppercase tracking-wide text-white/40">Confidence </span>
          <span className={`font-semibold ${c.basis === "data" ? "text-emerald-300" : "text-amber-300"}`}>
            {c.score}/100 · {c.basis}
          </span>
          <p className="text-white/70">{c.note}</p>
        </div>
      )}

      {persona.jtbd && persona.jtbd.length > 0 && (
        <Group title="Jobs-to-be-Done" items={persona.jtbd} />
      )}

      {e && (
        <div className="grid gap-2 sm:grid-cols-2">
          <EmpathyCell label="Says" items={e.says} />
          <EmpathyCell label="Thinks" items={e.thinks} />
          <EmpathyCell label="Does" items={e.does} />
          <EmpathyCell label="Feels" items={e.feels} />
        </div>
      )}

      {m && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
            <div className="text-xs text-white/40">TAM</div>
            <div className="text-white/90">{m.tam}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
            <div className="text-xs text-white/40">SAM</div>
            <div className="text-white/90">{m.sam}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
            <div className="text-xs text-white/40">SOM</div>
            <div className="text-white/90">{m.som}</div>
          </div>
        </div>
      )}

      {comp && (
        <div>
          <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Competitors</h4>
          <ul className="list-disc pl-4 text-white/70">
            {comp.competitors.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-white/70"><span className="text-white/50">White space: </span>{comp.whiteSpace}</p>
        </div>
      )}

      {persona.validation && (
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <h4 className="mb-1 text-xs uppercase tracking-wide text-white/40">Validation plan</h4>
          <p className="text-white/70"><span className="text-white/50">Recruit: </span>{persona.validation.recruit}</p>
          <p className="text-white/70"><span className="text-white/50">Sample size: </span>{persona.validation.sampleSize}</p>
          <div className="mt-2">
            <span className="text-xs uppercase tracking-wide text-white/40">Discussion guide</span>
            <ul className="list-disc pl-4 text-white/70">
              {persona.validation.discussionGuide.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <span className="text-xs uppercase tracking-wide text-white/40">Survey questions</span>
            <ul className="list-disc pl-4 text-white/70">
              {persona.validation.surveyQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function EmpathyCell({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-2">
      <div className="mb-1 text-xs uppercase tracking-wide text-white/40">{label}</div>
      <ul className="list-disc pl-4 text-white/70">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
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

const CONTENT_FORMATS = ["social post", "ad", "email"];

function ContentPanel({
  businessSummary,
  persona,
  model,
  onClose,
}: {
  businessSummary: string;
  persona: Persona;
  model: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(["social post", "ad"]);
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ContentResponse["assets"]>([]);

  const toggle = (f: string) =>
    setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  const gen = async () => {
    if (!selected.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSummary,
          persona: {
            id: persona.id,
            name: persona.name,
            tagline: persona.tagline,
            channels: persona.channels,
            goals: persona.goals,
            painPoints: persona.painPoints,
            messaging: persona.messaging,
          },
          formats: selected,
          count,
          model,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Content generation failed");
      setAssets((json as ContentResponse).assets);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-print border-b border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {CONTENT_FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={`rounded-full border px-2 py-0.5 text-xs ${
              selected.includes(f)
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-200"
                : "border-white/15 text-white/60"
            }`}
          >
            {f}
          </button>
        ))}
        <label className="ml-2 text-xs text-white/50">
          count
          <input
            type="number"
            min={1}
            max={12}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="ml-1 w-14 rounded border border-white/15 bg-black/30 px-1 py-0.5 text-white"
          />
        </label>
        <button
          onClick={gen}
          disabled={loading || !selected.length}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? "Writing…" : "Generate"}
        </button>
        <button onClick={onClose} className="text-xs text-white/50">
          Close
        </button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <div className="mt-2 space-y-2">
        {assets.map((a, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="mb-1 text-xs text-indigo-300">
              {a.format} · {a.channel}
            </div>
            <p className="whitespace-pre-wrap text-sm text-white/85">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ABTest({
  businessSummary,
  personas,
  model,
}: {
  businessSummary: string;
  personas: { id: string; name: string; tagline: string; painPoints: string[]; goals: string[]; messaging: { hook: string; tone: string; objections: string[] } }[];
  model: string;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ABResult[]>([]);
  const [nameOf, setNameOf] = useState<Record<string, string>>({});

  const run = async () => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);
    setNameOf(Object.fromEntries(personas.map((p) => [p.id, p.name])));
    try {
      const res = await fetch("/api/abtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSummary, messageA: a, messageB: b, personas, model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "A/B test failed");
      setResults((json as ABResponse).results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const color = (w: string) =>
    w === "A" ? "text-emerald-300" : w === "B" ? "text-indigo-300" : "text-white/60";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-2 text-sm font-semibold text-white">A/B message test</h3>
      <p className="mb-2 text-xs text-white/50">Paste two messages. See which wins for each persona.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          className="min-h-[70px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Message A — e.g. 'Dermatologist-approved vegan serum, 20% off.'"
        />
        <textarea
          className="min-h-[70px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="Message B — e.g. 'Join 10k with calm, sensitive-skin routines.'"
        />
      </div>
      <button
        onClick={run}
        disabled={loading || !a.trim() || !b.trim()}
        className="mt-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {loading ? "Testing…" : "Run A/B test"}
      </button>
      {error && <div className="mt-3 text-sm text-red-300">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r) => (
            <div key={r.personaId} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{nameOf[r.personaId] || r.personaId}</span>
                <span className={`text-xs font-semibold ${color(r.winner)}`}>Winner: {r.winner}</span>
              </div>
              <p className="mt-1 text-sm text-white/80">{r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
