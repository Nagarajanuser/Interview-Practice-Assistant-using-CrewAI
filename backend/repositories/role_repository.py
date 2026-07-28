import json
from pathlib import Path
from backend.core.logger import logger

class RoleRepository:
    @staticmethod
    def load_role_config(role_input: str) -> dict:
        possible_paths = [
            Path(__file__).parent.parent / "config" / "roles.json",
            Path(__file__).parent.parent / "ai" / "configs" / "roles.json",
            Path("config/roles.json")
        ]

        roles_file = None
        for path in possible_paths:
            if path.exists():
                roles_file = path
                break

        if roles_file:
            try:
                with open(roles_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                normalized_input = role_input.strip().lower()
                slug_input = normalized_input.replace(" ", "_")

                for r in data.get("roles", []):
                    if (
                        r.get("id", "").lower() == normalized_input
                        or r.get("id", "").lower() == slug_input
                        or r.get("display_name", "").lower() == normalized_input
                    ):
                        return r
            except Exception as err:
                logger.error(f"Failed to read roles.json: {err}")

        # Fallback default role configuration if role is not in roles.json
        return {
            "id": role_input.lower().replace(" ", "_"),
            "display_name": role_input,
            "mandatory_skills": [f"{role_input} Core Principles", "System Architecture & Design", "Best Practices", "Debugging"],
            "optional_skills": ["Performance Optimization", "Security", "Testing"],
            "excluded_topics": ["Irrelevant legacy frameworks"]
        }
