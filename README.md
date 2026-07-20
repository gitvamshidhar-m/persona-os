# Persona OS

An AI-powered **persona builder for any industry**. Describe a business and get realistic buyer personas plus a ready-to-run marketing playbook for each one — content pillars, a weekly posting plan, best times, and ad hooks. Optionally paste real customer data (reviews, surveys, tickets) to ground the personas in reality.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- OpenRouter API (OpenAI-compatible) for the LLM brain

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Add your key:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and set `OPENROUTER_API_KEY` (get one at https://openrouter.ai/keys).
3. Run:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## How it works
- `app/page.tsx` — UI: input form + results
- `components/InputForm.tsx` — business description, industry, goals, audience scope, optional data upload, model picker
- `components/Results.tsx` — persona profile + live playbook tabs, JSON export
- `app/api/generate/route.ts` — calls OpenRouter and parses JSON
- `lib/prompt.ts` — the strategist system prompt + JSON schema
- `lib/openrouter.ts` — OpenRouter chat client
- `lib/types.ts` — data model

## Model
The form lets you set any OpenRouter model id. Free options include:
- `meta-llama/llama-3.1-8b-instruct:free`
- `google/gemma-2-9b-it:free`
- `openai/gpt-4o-mini` (paid, higher quality)
