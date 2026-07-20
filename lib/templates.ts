export interface Template {
  key: string;
  label: string;
  industry: string;
  description: string;
  goals: string;
  audienceSize: string;
}

export const TEMPLATES: Template[] = [
  {
    key: "skincare",
    label: "D2C Skincare",
    industry: "D2C beauty / skincare",
    description:
      "Affordable vegan serums for sensitive skin, sold online. Differentiated by clean ingredients and dermatologist backing.",
    goals: "Acquire first 1,000 customers and build an email list",
    audienceSize: "niche",
  },
  {
    key: "saas",
    label: "B2B SaaS",
    industry: "B2B SaaS / project management",
    description:
      "AI task manager for small remote teams. Saves managers time and reduces meeting overload.",
    goals: "Build a seed waitlist and drive free→paid conversion",
    audienceSize: "enterprise",
  },
  {
    key: "fitness",
    label: "Fitness App",
    industry: "Mobile fitness / coaching",
    description:
      "At-home workout app with adaptive plans and a community. Targets busy people who hate the gym.",
    goals: "Grow app installs and reduce churn in first 30 days",
    audienceSize: "broad",
  },
  {
    key: "coffee",
    label: "Local Cafe",
    industry: "Local coffee shop / F&B",
    description:
      "Neighborhood specialty coffee bar with locally roasted beans and a loyal regular crowd.",
    goals: "Increase weekday foot traffic and launch a subscription",
    audienceSize: "local",
  },
  {
    key: "edtech",
    label: "EdTech",
    industry: "Online education",
    description:
      "Micro-learning platform teaching in-demand tech skills in 10-minute lessons for career switchers.",
    goals: "Boost course completion and referrals",
    audienceSize: "broad",
  },
  {
    key: "ecom",
    label: "E-commerce",
    industry: "General e-commerce",
    description:
      "Online store selling eco-friendly home goods. Positioned on sustainability and design.",
    goals: "Improve ROAS and repeat purchase rate",
    audienceSize: "broad",
  },
];
