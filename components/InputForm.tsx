"use client";

import { useState } from "react";

export interface FormState {
  businessName: string;
  industry: string;
  description: string;
  goals: string;
  audienceSize: string;
  dataUpload: string;
  model: string;
}

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export default function InputForm({
  onSubmit,
  loading,
  initial,
}: {
  onSubmit: (data: FormState) => void;
  loading: boolean;
  initial?: Partial<FormState>;
}) {
  const [form, setForm] = useState<FormState>({
    businessName: "",
    industry: "",
    description: "",
    goals: "",
    audienceSize: "broad",
    dataUpload: "",
    model: DEFAULT_MODEL,
    ...initial,
  });

  const onCsv = async (file: File) => {
    const text = await file.text();
    setForm((f) => ({
      ...f,
      dataUpload: f.dataUpload ? `${f.dataUpload}\n\n${text}` : text,
    }));
  };

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name (optional)">
          <input
            className={inputCls}
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            placeholder="e.g. Bloom Skincare"
          />
        </Field>
        <Field label="Industry *">
          <input
            className={inputCls}
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="e.g. D2C beauty / SaaS / fitness"
            required
          />
        </Field>
      </div>

      <Field label="What does the business do? *">
        <textarea
          className={`${inputCls} min-h-[90px]`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the product, who it helps, and what makes it different."
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marketing goals">
          <input
            className={inputCls}
            value={form.goals}
            onChange={(e) => set("goals", e.target.value)}
            placeholder="e.g. get first 100 customers, launch, retention"
          />
        </Field>
        <Field label="Audience scope">
          <select
            className={inputCls}
            value={form.audienceSize}
            onChange={(e) => set("audienceSize", e.target.value)}
          >
            <option value="broad">Broad market</option>
            <option value="niche">Niche / focused</option>
            <option value="enterprise">B2B / enterprise</option>
            <option value="local">Local / geographic</option>
          </select>
        </Field>
      </div>

      <Field label="Ground it in real data (optional)">
        <textarea
          className={`${inputCls} min-h-[80px] font-mono text-xs`}
          value={form.dataUpload}
          onChange={(e) => set("dataUpload", e.target.value)}
          placeholder="Paste customer reviews, survey answers, support tickets, or a website blurb. The AI uses this to make personas real."
        />
        <label className="mt-2 inline-block cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCsv(f);
            }}
          />
        </label>
      </Field>

      <Field label="Model (OpenRouter)">
        <input
          className={`${inputCls} font-mono text-xs`}
          value={form.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="openai/gpt-4o-mini"
        />
        <p className="mt-1 text-xs text-white/40">
          Any OpenRouter model id. Free models:{" "}
          <span className="text-white/60">meta-llama/llama-3.1-8b-instruct:free</span>,{" "}
          <span className="text-white/60">google/gemma-2-9b-it:free</span>
        </p>
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
      >
        {loading ? "Building personas…" : "Generate personas & playbooks"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}
