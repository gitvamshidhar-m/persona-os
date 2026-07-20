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

export interface Empathy {
  says: string[];
  thinks: string[];
  does: string[];
  feels: string[];
}

export interface Confidence {
  score: number;
  basis: "data" | "inferred";
  note: string;
}

export interface MarketSizing {
  tam: string;
  sam: string;
  som: string;
}

export interface Competitive {
  competitors: string[];
  whiteSpace: string;
}

export interface Validation {
  discussionGuide: string[];
  surveyQuestions: string[];
  recruit: string;
  sampleSize: string;
}

export interface Overlap {
  personas: [string, string];
  score: number;
  reason: string;
}

export interface Analysis {
  overlaps: Overlap[];
  notes: string;
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
  empathy?: Empathy;
  jtbd?: string[];
  confidence?: Confidence;
  marketSizing?: MarketSizing;
  competitive?: Competitive;
  validation?: Validation;
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
  analysis?: Analysis;
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

export interface CloudBuild {
  id: string;
  name: string;
  createdAt: number;
  data: GenerateResponse;
}

export interface ContentAsset {
  channel: string;
  format: string;
  text: string;
}

export interface ContentRequest {
  businessSummary: string;
  persona: {
    id: string;
    name: string;
    tagline: string;
    channels: string[];
    goals: string[];
    painPoints: string[];
    messaging: Persona["messaging"];
  };
  formats: string[];
  count: number;
  model: string;
}

export interface ContentResponse {
  assets: ContentAsset[];
}

export interface ABResult {
  personaId: string;
  winner: "A" | "B" | "tie";
  reason: string;
}

export interface ABRequest {
  businessSummary: string;
  messageA: string;
  messageB: string;
  personas: { id: string; name: string; tagline: string; painPoints: string[]; goals: string[]; messaging: Persona["messaging"] }[];
  model: string;
}

export interface ABResponse {
  results: ABResult[];
}

export const EMPTY_RESPONSE: GenerateResponse = {
  businessSummary: "",
  personas: [],
};
