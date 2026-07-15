from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from .config import settings


def _tokens(text: str) -> set[str]:
    normalized = re.sub(r"\s+", "", text.lower())
    latin = set(re.findall(r"[a-z0-9_+-]{2,}", normalized))
    chinese = {normalized[index:index + 2] for index in range(max(0, len(normalized) - 1)) if "\u4e00" <= normalized[index] <= "\u9fff"}
    return latin | chinese


class KnowledgeBase:
    def __init__(self, path: str | Path | None = None):
        selected = Path(path or settings.knowledge_path)
        if not selected.is_absolute():
            selected = (Path(__file__).resolve().parents[2] / selected).resolve()
        payload = json.loads(selected.read_text(encoding="utf-8"))
        self.chapters = payload["chapters"]
        self.by_id = {chapter["id"]: chapter for chapter in self.chapters}

    def search(self, question: str, chapter_id: str | None, limit: int = 4) -> list[dict]:
        query = _tokens(question)
        results = []
        for chapter in self.chapters:
            searchable = " ".join([
                chapter["title"], chapter["description"], chapter["goal"],
                *(item["title"] + " " + item["detail"] for item in chapter["materials"]),
                *chapter["pitfalls"], *chapter["quiz"],
            ])
            score = len(query & _tokens(searchable))
            if chapter["id"] == chapter_id:
                score += 100
            if score:
                results.append((score, chapter))
        results.sort(key=lambda item: item[0], reverse=True)
        return [chapter for _, chapter in results[:limit]]

    @staticmethod
    def to_prompt(chapters: list[dict]) -> str:
        blocks = []
        for chapter in chapters:
            materials = "\n".join(f"- {item['title']}：{item['detail']}" for item in chapter["materials"])
            resources = "\n".join(f"- {item['title']}（{item['url']}）：{item['note']}" for item in chapter["resources"])
            blocks.append(
                f"## {chapter['track']['name']} / {chapter['title']}\n"
                f"学习目标：{chapter['goal']}\n核心内容：\n{materials}\n"
                f"常见误区：{'；'.join(chapter['pitfalls'])}\n精选资料：\n{resources}"
            )
        return "\n\n".join(blocks)

    @staticmethod
    def sources(chapters: list[dict]) -> list[dict]:
        sources = []
        for chapter in chapters:
            sources.append({"id": chapter["id"], "title": chapter["title"], "track": chapter["track"]["name"], "kind": "chapter"})
            for resource in chapter["resources"][:2]:
                sources.append({
                    "id": resource["id"], "title": resource["title"], "track": chapter["track"]["name"],
                    "kind": "resource", "url": resource["url"],
                })
        return sources


@lru_cache(maxsize=1)
def get_knowledge_base() -> KnowledgeBase:
    return KnowledgeBase()
