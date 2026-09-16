import { getCollection } from "astro:content";
import { modules } from "../data/modules";

export interface ChapterData {
  id: string;
  title: string;
  chapter: number;
  module: string;
  order: number;
  summary: string;
  minutes: number;
  prereqs: string[];
  tags: string[];
}

export interface GroupedChapter {
  module: (typeof modules)[number];
  items: ChapterData[];
}

export async function allChapters(): Promise<ChapterData[]> {
  const entries = await getCollection("chapters");
  return entries
    .map((e) => ({ id: e.id, ...e.data }))
    .sort((a, b) => a.order - b.order);
}

/** Chapters grouped by the module order defined in data/modules.ts. */
export function chaptersByModule(chapters: ChapterData[]): GroupedChapter[] {
  return modules
    .map((m) => ({ module: m, items: chapters.filter((c) => c.module === m.key) }))
    .filter((g) => g.items.length > 0);
}

export function findPrevNext(chapters: ChapterData[], id: string) {
  const idx = chapters.findIndex((c) => c.id === id);
  if (idx === -1) return { prev: undefined, next: undefined };
  return {
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  };
}