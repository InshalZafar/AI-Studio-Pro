import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.recipe import RecipeHistory
from app.schemas.recipe import RecipeRequest, RecipeResponse
from app.utils.deps import get_current_user
from app.services.settings_service import get_active_key
from app.services.recipe_service import build_recipe_prompt, parse_recipe_response
from app.ai.factory import get_provider

router = APIRouter(prefix="/api/recipe", tags=["Recipe AI"])


@router.get("/history", response_model=list[RecipeResponse])
def get_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(RecipeHistory)
        .filter(RecipeHistory.user_id == user.id)
        .order_by(RecipeHistory.created_at.desc())
        .limit(50)
        .all()
    )
    results = []
    for r in rows:
        try:
            results.append(RecipeResponse(**json.loads(r.result_json)))
        except Exception:  # noqa: BLE001
            continue
    return results


@router.post("/generate", response_model=RecipeResponse)
async def generate_recipe(
    payload: RecipeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    api_key = get_active_key(db, user.id, payload.provider)
    provider = get_provider(payload.provider, api_key, payload.model)

    messages = build_recipe_prompt(payload)
    raw = await provider.chat(messages)

    try:
        parsed = parse_recipe_response(raw)
        recipe = RecipeResponse(**parsed)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"AI provider returned an unparseable recipe response: {e}",
        )

    history_row = RecipeHistory(
        user_id=user.id,
        meal_type=payload.meal_type,
        cuisine=payload.cuisine,
        ingredients=", ".join(payload.ingredients) if payload.ingredients else None,
        cooking_time=payload.cooking_time,
        difficulty=payload.difficulty,
        result_json=recipe.model_dump_json(),
    )
    db.add(history_row)
    db.commit()

    return recipe
