import json
import re
from app.schemas.recipe import RecipeRequest


def build_recipe_prompt(req: RecipeRequest) -> list[dict[str, str]]:
    system = (
        "You are a professional chef and nutritionist. Generate a recipe as a JSON object "
        "with exactly these keys:\n"
        '  "title": string,\n'
        '  "description": short string,\n'
        '  "ingredients": array of strings (with quantities),\n'
        '  "steps": array of strings (ordered steps),\n'
        '  "estimated_calories": string (e.g. "450 kcal per serving"),\n'
        '  "nutrition": object with keys "calories", "protein", "carbs", "fat" (strings),\n'
        '  "alternative_recipes": array of 2-3 short alternative recipe name suggestions.\n'
        "Return ONLY the JSON object, no markdown fences, no extra commentary."
    )
    user_parts = [f"Meal type: {req.meal_type}"]
    if req.cuisine:
        user_parts.append(f"Cuisine: {req.cuisine}")
    if req.ingredients:
        user_parts.append(f"Available ingredients: {', '.join(req.ingredients)}")
    if req.cooking_time:
        user_parts.append(f"Cooking time: {req.cooking_time}")
    if req.difficulty:
        user_parts.append(f"Difficulty: {req.difficulty}")
    user = "\n".join(user_parts)
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def parse_recipe_response(raw: str) -> dict:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    cleaned = re.sub(r"^```\s*|\s*```$", "", cleaned, flags=re.MULTILINE).strip()
    return json.loads(cleaned)
