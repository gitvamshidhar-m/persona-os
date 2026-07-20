import {
  GenerateRequest,
  RefineRequest,
  SimulateRequest,
  ContentRequest,
  ABRequest,
} from "./types";

export const SYSTEM_PROMPT = `You are a world-class digital marketing strategist and consumer psychologist.
Given a business, you produce realistic, nuanced buyer personas and a ready-to-run marketing playbook for each one.
You NEVER invent fake statistics. You reason from the industry, the business description, and any provided data.
You ALWAYS respond with a single valid JSON object, no markdown, no commentary.`;

export function buildUserPrompt(req: GenerateRequest): string {
  const dataSection = req.dataUpload?.trim()
    ? `\n\nREAL DATA PROVIDED BY THE USER (use it to ground personas, surface real objections, channels and language):\n""'\n${req.dataUpload.trim()}\n"""`
    : "\n\nNo raw data provided — infer from the industry and description.";

  return `Create marketing personas and playbooks for this business.

BUSINESS NAME: ${req.businessName || "Not specified"}
INDUSTRY: ${req.industry}
DESCRIPTION: ${req.description}
MARKETING GOALS: ${req.goals || "growth and awareness"}
TARGET AUDIENCE SIZE: ${req.audienceSize || "broad"}

${dataSection}

Return JSON matching this exact schema:

{
  "businessSummary": string,
  "personas": [
    {
      "id": string,
      "name": string,
      "tagline": string,
      "avatar": string,
      "priority": { "score": number, "reason": string },
      "empathy": { "says": string[], "thinks": string[], "does": string[], "feels": string[] },
      "jtbd": string[],
      "confidence": { "score": number, "basis": "data" | "inferred", "note": string },
      "marketSizing": { "tam": string, "sam": string, "som": string },
      "competitive": { "competitors": string[], "whiteSpace": string },
      "validation": { "discussionGuide": string[], "surveyQuestions": string[], "recruit": string, "sampleSize": string },
      "demographics": { "ageRange": string, "location": string, "role": string, "income": string, "education": string },
      "psychographics": { "values": string[], "fears": string[], "motivations": string[] },
      "painPoints": string[],
      "goals": string[],
      "channels": string[],
      "messaging": { "hook": string, "tone": string, "objections": string[] },
      "playbook": {
        "contentPillars": [ { "theme": string, "angle": string } ],
        "weeklyPlan": [ { "day": string, "channel": string, "format": string, "topic": string, "cta": string } ],
        "bestTimes": string[],
        "adHooks": string[]
      }
    }
  ],
  "analysis": {
    "overlaps": [ { "personas": [string, string], "score": number, "reason": string } ],
    "notes": string
  }
}

Requirements:
- Produce 3 to 4 distinct personas that cover the realistic spread of the market.
- Make each persona specific to the industry, not generic.
- The weeklyPlan must be concrete (real channels, real formats, real topics, real CTAs).
- Set "priority.score" by weighing expected customer value against how reachable/addressable they are for the stated goals (higher = target first).
- Keep personas genuinely distinct. If two personas overlap heavily, differentiate them clearly.
- Set "confidence.basis" to "data" ONLY when the user supplied real data that supports this persona; otherwise "inferred". Never fake precision in marketSizing — use reasoned ranges.
- If data was provided, reflect its language and real objections.`;
}

export function buildRefinePrompt(req: RefineRequest): string {
  return `Refine ONE existing buyer persona based on the user's instruction.

BUSINESS SUMMARY: ${req.businessSummary}

EXISTING PERSONA (JSON):
${JSON.stringify(req.persona, null, 2)}

INSTRUCTION FROM USER: ${req.instruction}

Return the FULL updated persona as a single JSON object using the exact same schema as the existing persona
(keep the same "id", preserve fields the instruction does not change). Make the change coherent with the business.
No markdown, no commentary — just the JSON object.`;
}

export function buildSimulatePrompt(req: SimulateRequest): string {
  const personas = req.personas
    .map(
      (p) =>
        `- id: ${p.id} | name: ${p.name} (${p.tagline}) | pains: ${p.painPoints.join(
          ", "
        )} | goals: ${p.goals.join(", ")} | objections: ${p.messaging.objections.join(", ")}`
    )
    .join("\n");

  return `Simulate how each buyer persona would react to a marketing campaign.

BUSINESS SUMMARY: ${req.businessSummary}

CAMPAIGN / COPY BEING TESTED:
""'
${req.campaign}
"""

PERSONAS:
${personas}

Return JSON with this exact schema:
{
  "reactions": [
    {
      "personaId": string,
      "interest": number,
      "likelyToConvert": "high" | "medium" | "low",
      "triggeredObjections": string[],
      "reaction": string,
      "suggestedTweak": string
    }
  ]
}

Be realistic and specific to each persona. No markdown, just the JSON.`;
}

export function buildContentPrompt(req: ContentRequest): string {
  const p = req.persona;
  return `Write ready-to-publish marketing content for ONE buyer persona.

BUSINESS SUMMARY: ${req.businessSummary}
PERSONA: ${p.name} (${p.tagline})
GOALS: ${p.goals.join(", ")}
PAINS: ${p.painPoints.join(", ")}
TONE: ${p.messaging.tone}
HOOK: ${p.messaging.hook}

FORMATS REQUESTED: ${req.formats.join(", ")} (e.g. social post, ad, email)
COUNT: ${req.count} assets total, distributed across the requested formats and the persona's channels (${p.channels.join(
    ", "
  )}).

Return JSON with this exact schema:
{
  "assets": [
    { "channel": string, "format": string, "text": string }
  ]
}

Rules:
- Each asset must match the persona's tone and speak to their goals/pains.
- Make copy concrete and platform-appropriate (length, style).
- No placeholders like [link]. Write final copy.
No markdown, just the JSON.`;
}

export function buildABPrompt(req: ABRequest): string {
  const personas = req.personas
    .map(
      (p) =>
        `- id: ${p.id} | ${p.name} (${p.tagline}) | pains: ${p.painPoints.join(
          ", "
        )} | goals: ${p.goals.join(", ")}`
    )
    .join("\n");

  return `For each buyer persona, decide which of two marketing messages would perform better, and why.

BUSINESS SUMMARY: ${req.businessSummary}

MESSAGE A:
""'
${req.messageA}
"""

MESSAGE B:
""'
${req.messageB}
"""

PERSONAS:
${personas}

Return JSON:
{
  "results": [
    { "personaId": string, "winner": "A" | "B" | "tie", "reason": string }
  ]
}

Be specific to each persona's pains and goals. No markdown, just the JSON.`;
}
