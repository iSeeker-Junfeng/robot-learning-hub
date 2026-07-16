import { mkdir, writeFile } from "node:fs/promises";
import { chapterGuides, chapterLessons, chapterResources, resourceCatalog, tracks } from "../app/data.js";

const chapters = tracks.flatMap((track) => track.chapters.map((chapter) => {
  const guide = chapterGuides[chapter.id];
  const lesson = chapterLessons[chapter.id];
  const resources = (chapterResources[chapter.id] || []).map((id) => ({ id, ...resourceCatalog[id] }));
  return {
    id: chapter.id,
    track: { id: track.id, name: track.name, eyebrow: track.eyebrow },
    title: chapter.title,
    description: chapter.desc,
    level: chapter.level,
    estimated_time: chapter.time,
    goal: lesson.goal,
    materials: guide.materials.map((title, index) => ({ title, detail: lesson.details[index] })),
    pitfalls: lesson.pitfalls,
    project: guide.project,
    acceptance: guide.acceptance,
    quiz: lesson.quiz,
    resources,
  };
}));

await mkdir(new URL("../content/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../content/knowledge.json", import.meta.url),
  `${JSON.stringify({ version: 1, chapters }, null, 2)}\n`,
  "utf8",
);
console.log(`Exported ${chapters.length} chapters to content/knowledge.json`);
