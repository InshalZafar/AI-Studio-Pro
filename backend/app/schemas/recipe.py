from pydantic import BaseModel


class RecipeRequest(BaseModel):
    meal_type: str  # Breakfast | Lunch | Dinner | Snack
    cuisine: str | None = None
    ingredients: list[str] = []
    cooking_time: str | None = None  # e.g. "under 30 mins"
    difficulty: str | None = None  # Easy | Medium | Hard
    provider: str = "openai"
    model: str | None = None


class NutritionSummary(BaseModel):
    calories: str | None = None
    protein: str | None = None
    carbs: str | None = None
    fat: str | None = None


class RecipeResponse(BaseModel):
    title: str
    description: str | None = None
    ingredients: list[str]
    steps: list[str]
    estimated_calories: str | None = None
    nutrition: NutritionSummary | None = None
    alternative_recipes: list[str] = []
