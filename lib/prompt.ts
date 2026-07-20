import { GenerateRequest } from "./types";

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
  "businessSummary": string,           // 2-3 sentence strategic summary
  "personas": [
    {
      "id": string,                    // slug, e.g. "busy-founder"
      "name": string,                  // memorable persona name
      "tagline": string,               // one-line identity
      "avatar": string,                // an emoji representing them
      "demographics": {
        "ageRange": string,
        "location": string,
        "role": string,
        "income": string,
        "education": string
      },
      "psychographics": {
        "values": string[],
        "fears": string[],
        "motivations": string[]
      },
      "painPoints": string[],          // 3-5 specific pains
      "goals": string[],               // 3-5 things they want
      "channels": string[],            // where they actually spend time
      "messaging": {
        "hook": string,                // attention-grabbing opener
        "tone": string,                // how to sound
        "objections": string[]         // likely objections to overcome
      },
      "playbook": {
        "contentPillars": [ { "theme": string, "angle": string } ],  // 3-4
        "weeklyPlan": [                                                // 5-7 slots
          { "day": string, "channel": string, "format": string, "topic": string, "cta": string }
        ],
        "bestTimes": string[],          // best posting times
        "adHooks": string[]             // 3-4 ad headlines
      }
    }
  ]
}

Requirements:
- Produce 3 to 4 distinct personas that cover the realistic spread of the market.
- Make each persona specific to the industry, not generic.
- The weeklyPlan must be concrete (real channels, real formats, real topics, real CTAs).
- If data was provided, reflect its language and real objections.`;
}
