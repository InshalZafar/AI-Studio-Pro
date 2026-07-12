"use client";

import { useState, FormEvent } from "react";
import { ChefHat, Plus, X, Clock, Flame, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ProviderSelect } from "@/components/modules/provider-select";
import { NoKeyBanner } from "@/components/modules/no-key-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EqBars } from "@/components/ui/eq-bars";
import { useApiKeys } from "@/hooks/use-api-keys";
import { api, APIError } from "@/lib/api";
import type { RecipeResult, Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function RecipePage() {
  const { hasKey, loading: keysLoading } = useApiKeys();
  const [mealType, setMealType] = useState("Dinner");
  const [cuisine, setCuisine] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [provider, setProvider] = useState<Provider>("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addIngredient() {
    const val = ingredientInput.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients((prev) => [...prev, val]);
      setIngredientInput("");
    }
  }

  function removeIngredient(ing: string) {
    setIngredients((prev) => prev.filter((i) => i !== ing));
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<RecipeResult>("/api/recipe/generate", {
        meal_type: mealType,
        cuisine: cuisine || null,
        ingredients,
        cooking_time: cookingTime || null,
        difficulty,
        provider,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof APIError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const showBanner = !keysLoading && !hasKey(provider);

  return (
    <>
      <Topbar title="Recipe Generator" subtitle="Cook from what you have" />
      <div className="flex-1 flex min-h-0 overflow-y-auto">
        <div className="w-96 shrink-0 border-r border-canvas-border p-6 space-y-5 overflow-y-auto">
          {showBanner && <NoKeyBanner provider={provider} />}

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-2 block">Meal type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_TYPES.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMealType(m)}
                    className={cn(
                      "text-xs py-2 rounded-md border transition-colors",
                      mealType === m
                        ? "bg-signal/10 border-signal text-signal font-medium"
                        : "border-canvas-border text-ink-muted hover:bg-canvas-surface"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Cuisine</label>
              <Input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Italian, Pakistani, Thai" />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Available ingredients</label>
              <div className="flex gap-1.5">
                <Input
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                  placeholder="e.g. chicken, rice, tomatoes"
                />
                <Button type="button" variant="secondary" onClick={addIngredient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1 text-xs bg-canvas-surface border border-canvas-border rounded-full px-2.5 py-1"
                    >
                      {ing}
                      <button type="button" onClick={() => removeIngredient(ing)}>
                        <X className="h-3 w-3 text-ink-faint hover:text-bad" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Cooking time</label>
              <Input value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder="e.g. under 30 mins" />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-2 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "text-xs py-2 rounded-md border transition-colors",
                      difficulty === d
                        ? "bg-signal/10 border-signal text-signal font-medium"
                        : "border-canvas-border text-ink-muted hover:bg-canvas-surface"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Provider</label>
              <ProviderSelect value={provider} onChange={setProvider} />
            </div>

            {error && <p className="text-xs text-bad">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              <Sparkles className="h-4 w-4" /> Generate recipe
            </Button>
          </form>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {!result && !loading && (
            <EmptyState
              icon={ChefHat}
              title="No recipe yet"
              description="Fill in the form and generate a recipe tailored to what you have."
            />
          )}
          {loading && (
            <div className="flex items-center justify-center h-full">
              <EqBars className="text-signal h-6" />
            </div>
          )}
          {result && !loading && (
            <div className="max-w-2xl animate-fade-up space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold mb-1">{result.title}</h2>
                {result.description && <p className="text-ink-muted text-sm">{result.description}</p>}
                <div className="flex items-center gap-4 mt-3">
                  {result.estimated_calories && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber">
                      <Flame className="h-3.5 w-3.5" /> {result.estimated_calories}
                    </span>
                  )}
                  {cookingTime && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                      <Clock className="h-3.5 w-3.5" /> {cookingTime}
                    </span>
                  )}
                </div>
              </div>

              <Card className="p-5">
                <h3 className="font-display font-semibold text-sm mb-3">Ingredients</h3>
                <ul className="space-y-1.5 text-sm text-ink-muted list-disc pl-5">
                  {result.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5">
                <h3 className="font-display font-semibold text-sm mb-3">Steps</h3>
                <ol className="space-y-2.5 text-sm">
                  {result.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="h-5 w-5 rounded-full bg-signal/10 text-signal text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-ink-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              {result.nutrition && (
                <Card className="p-5">
                  <h3 className="font-display font-semibold text-sm mb-3">Nutrition summary</h3>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {Object.entries(result.nutrition).map(([key, val]) =>
                      val ? (
                        <div key={key}>
                          <p className="text-xs text-ink-faint uppercase">{key}</p>
                          <p className="text-sm font-medium mt-0.5">{val}</p>
                        </div>
                      ) : null
                    )}
                  </div>
                </Card>
              )}

              {result.alternative_recipes.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-display font-semibold text-sm mb-3">Alternative recipes</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.alternative_recipes.map((alt, i) => (
                      <span key={i} className="text-xs bg-canvas-surface border border-canvas-border rounded-full px-3 py-1.5">
                        {alt}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
