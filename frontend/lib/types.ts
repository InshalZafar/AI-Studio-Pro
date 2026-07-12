export type Provider = "openai" | "claude" | "gemini" | "deepseek";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  module: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface ChatDetail extends ChatSummary {
  messages: ChatMessage[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}

export interface SourceCitation {
  document_id: string;
  filename: string;
  chunk_text: string;
  score: number;
}

export interface CSVProjectItem {
  id: string;
  name: string;
  table_names: string | null;
  created_at: string;
}

export interface ChartSpec {
  type: string;
  figure_json: string;
}

export interface RecipeResult {
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  estimated_calories: string | null;
  nutrition: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  } | null;
  alternative_recipes: string[];
}

export interface APIKeyItem {
  id: string;
  provider: Provider;
  is_active: boolean;
  masked_key: string;
  updated_at: string;
}

export const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Gemini" },
  { id: "deepseek", label: "DeepSeek" },
];

export const SPORTS = [
  { id: "cricket", label: "Cricket" },
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "f1", label: "Formula 1" },
  { id: "olympics", label: "Olympics" },
];
