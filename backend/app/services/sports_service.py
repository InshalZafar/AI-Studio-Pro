SUPPORTED_SPORTS = ["cricket", "football", "basketball", "tennis", "f1", "olympics"]

SPORT_DISPLAY_NAMES = {
    "cricket": "Cricket",
    "football": "Football (Soccer)",
    "basketball": "Basketball",
    "tennis": "Tennis",
    "f1": "Formula 1",
    "olympics": "Olympics",
}


def build_sports_prompt(sport: str, question: str, history: list[dict[str, str]] | None = None) -> list[dict[str, str]]:
    sport_name = SPORT_DISPLAY_NAMES.get(sport, sport.title())
    system = (
        f"You are a knowledgeable sports analyst specializing in {sport_name}. "
        "Answer questions about rules, history, players, teams, tournaments, and statistics. "
        "Note: you do not have access to live/real-time scores or data beyond your training — "
        "if asked for live scores or very recent results, say so clearly rather than guessing."
    )
    messages = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": question})
    return messages
