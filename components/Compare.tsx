"use client";

import { Persona } from "@/lib/types";

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-white/10 align-top">
      <td className="px-3 py-2 text-xs uppercase tracking-wide text-white/40">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2 text-sm text-white/80">{v}</td>
      ))}
    </tr>
  );
}

export default function Compare({ personas }: { personas: Persona[] }) {
  const join = (arr: string[]) => (arr.length ? arr.join(" · ") : "—");
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2" />
            {personas.map((p) => (
              <th key={p.id} className="px-3 py-2 text-left">
                <div className="text-2xl">{p.avatar}</div>
                <div className="text-sm font-semibold text-white">{p.name}</div>
                <div className="text-xs text-white/50">{p.tagline}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <Row
            label="Priority"
            values={personas.map((p) =>
              p.priority ? `${p.priority.score} — ${p.priority.reason}` : "—"
            )}
          />
          <Row label="Age" values={personas.map((p) => p.demographics.ageRange)} />
          <Row label="Role" values={personas.map((p) => p.demographics.role)} />
          <Row label="Location" values={personas.map((p) => p.demographics.location)} />
          <Row label="Income" values={personas.map((p) => p.demographics.income)} />
          <Row label="Channels" values={personas.map((p) => join(p.channels))} />
          <Row label="Pain points" values={personas.map((p) => join(p.painPoints))} />
          <Row label="Goals" values={personas.map((p) => join(p.goals))} />
          <Row label="Tone" values={personas.map((p) => p.messaging.tone)} />
          <Row label="Hook" values={personas.map((p) => p.messaging.hook)} />
          <Row
            label="Confidence"
            values={personas.map((p) =>
              p.confidence ? `${p.confidence.score} (${p.confidence.basis})` : "—"
            )}
          />
          <Row
            label="Market (TAM/SAM/SOM)"
            values={personas.map((p) =>
              p.marketSizing
                ? `${p.marketSizing.tam} / ${p.marketSizing.sam} / ${p.marketSizing.som}`
                : "—"
            )}
          />
          <Row
            label="Competitors"
            values={personas.map((p) =>
              p.competitive ? p.competitive.competitors.join(", ") : "—"
            )}
          />
          <Row
            label="White space"
            values={personas.map((p) => (p.competitive ? p.competitive.whiteSpace : "—"))}
          />
        </tbody>
      </table>
    </div>
  );
}
