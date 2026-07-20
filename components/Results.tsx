"use client";

import { useState } from "react";
import { Persona, GenerateResponse } from "@/lib/types";

export default function Results({
  data,
  onReset,
}: {
  data: GenerateResponse;
  onReset: () => void;
}) {
  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "persona-os-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/70">{data.businessSummary}</p>
        <div className="flex gap-2">
          <button
            onClick={download}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Export JSON
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            New
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {data.personas.map((p) => (
          <PersonaCard key={p.id} persona={p} />
        ))}
      </div>
    </div>
  );
}

function PersonaCard({ persona }: { persona: Persona }) {
  const [tab, setTab] = useState<"profile" | "playbook">("profile");
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="text-3xl">{persona.avatar}</div>
        <div>
          <h3 className="text-lg font-semibold text-white">{persona.name}</h3>
          <p className="text-xs text-white/60">{persona.tagline}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/10 px-3 pt-3 text-sm">
        {(["profile", "playbook"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-3 py-2 capitalize ${
              tab === t
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80"
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
