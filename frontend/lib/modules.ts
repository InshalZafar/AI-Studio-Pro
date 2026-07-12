import { MessageSquare, FileText, Table2, ChefHat, Trophy, KeyRound, LucideIcon } from "lucide-react";

export interface ModuleDef {
  id: string;
  index: string; // "01", "02"... — these are real channel numbers on the studio's board
  name: string;
  tagline: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const MODULES: ModuleDef[] = [
  {
    id: "general",
    index: "01",
    name: "General AI",
    tagline: "Open conversation",
    description: "A streaming, markdown-aware chat interface across any connected provider.",
    href: "/dashboard/general",
    icon: MessageSquare,
  },
  {
    id: "documents",
    index: "02",
    name: "Document AI",
    tagline: "Ask your files",
    description: "Upload PDFs, DOCX, TXT or Markdown and ask grounded questions with citations.",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    id: "csv",
    index: "03",
    name: "CSV Analytics AI",
    tagline: "Talk to your data",
    description: "Upload CSVs, ask questions in plain English, get SQL, tables, and charts.",
    href: "/dashboard/csv",
    icon: Table2,
  },
  {
    id: "recipes",
    index: "04",
    name: "Recipe Generator",
    tagline: "Cook from what you have",
    description: "Generate recipes, steps, and nutrition summaries from your ingredients.",
    href: "/dashboard/recipes",
    icon: ChefHat,
  },
  {
    id: "sports",
    index: "05",
    name: "Sports AI",
    tagline: "Rules, history, stats",
    description: "Cricket, football, basketball, tennis, F1, and Olympics — rules to records.",
    href: "/dashboard/sports",
    icon: Trophy,
  },
];

export const SETTINGS_MODULE: ModuleDef = {
  id: "settings",
  index: "06",
  name: "Settings",
  tagline: "API keys",
  description: "Connect your own OpenAI, Claude, Gemini, or DeepSeek API key.",
  href: "/dashboard/settings",
  icon: KeyRound,
};
