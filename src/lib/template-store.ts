// Server-side template storage (in-memory)
// Templates persist as long as the server process is alive.
// In dev mode (next dev), they survive hot reloads thanks to globalThis.

import type { AdTemplate } from "./types";

// Use globalThis to persist across hot reloads in dev
const globalStore = globalThis as unknown as {
  __kultTemplates?: AdTemplate[];
};

if (!globalStore.__kultTemplates) {
  globalStore.__kultTemplates = [];
}

export function getTemplates(): AdTemplate[] {
  return globalStore.__kultTemplates!;
}

export function getTemplatesByFormat(format: "square" | "story"): AdTemplate[] {
  return globalStore.__kultTemplates!.filter((t) => t.format === format);
}

export function getRandomTemplate(format: "square" | "story"): AdTemplate | null {
  const matching = getTemplatesByFormat(format);
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

export function addTemplate(template: AdTemplate): void {
  globalStore.__kultTemplates!.push(template);
}

export function removeTemplate(id: string): void {
  globalStore.__kultTemplates = globalStore.__kultTemplates!.filter(
    (t) => t.id !== id
  );
}

export function updateTemplate(id: string, partial: Partial<AdTemplate>): void {
  globalStore.__kultTemplates = globalStore.__kultTemplates!.map((t) =>
    t.id === id ? { ...t, ...partial } : t
  );
}
