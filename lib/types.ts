export interface Demographics {
  ageRange: string;
  location: string;
  role: string;
  income: string;
  education: string;
}

export interface Psychographics {
  values: string[];
  fears: string[];
  motivations: string[];
}

export interface ContentPillar {
  theme: string;
  angle: string;
}

export interface WeeklySlot {
  day: string;
  channel: string;
  format: string;
  topic: string;
  cta: string;
}

export interface Playbook {
  contentPillars: ContentPillar[];
  weeklyPlan: WeeklySlot[];
  bestTimes: string[];
  adHooks: string[];
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  priority?: {
    score: number;
    reason: string;
  };
  demographics: Demographics;
  psychographics: Psychographics;
  painPoints: string[];
  goals: string[];
  channels: string[];
  messaging: {
    hook: string;
    tone: string;
    objections: string[];
  };
  playbook: Playbook;
}

export interface GenerateRequest {
  businessName: string;
  industry: string;
  description: string;
  goals: string;
  audienceSize: string;
  dataUpload?: string;
  model: string;
}

export interface GenerateResponse {
  businessSummary: string;
  personas: Persona[];
}

export interface RefineRequest {
  businessSummary: string;
  persona: Persona;
  instruction: string;
  model: string;
}

export interface SimulateRequest {
  businessSummary: string;
  campaign: string;
  personas: { id: string; name: string; tagline: string; painPoints: string[]; goals: string[]; messaging: Persona["messaging"] }[];
  model: string;
}

export interface PersonaReaction {
  personaId: string;
  interest: number;
  likelyToConvert: "high" | "medium" | "low";
  triggeredObjections: string[];
  reaction: string;
  suggestedTweak: string;
}

export interface SimulateResponse {
  reactions: PersonaReaction[];
}

export interface SavedBuild {
  id: string;
  name: string;
  createdAt: number;
  response: GenerateResponse;
}

export const EMPTY_RESPONSE: GenerateResponse = {
  businessSummary: "",
  personas: [],
};
