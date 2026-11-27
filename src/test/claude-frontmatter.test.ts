// L'en-tête YAML des sous-agents et des skills du projet reste valide : un
// « : » dans une valeur sans guillemets casse la lecture (GitHub, parseurs
// stricts), même si Claude Code la tolère.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const AGENTS_DIR = ".claude/agents";
const SKILLS_DIR = ".claude/skills";

const files = [
  ...readdirSync(AGENTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(AGENTS_DIR, name)),
  ...readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(SKILLS_DIR, entry.name, "SKILL.md"))
    .filter((path) => existsSync(path)),
];

function frontmatter(path: string): string {
  const match = readFileSync(path, "utf8").match(/^---\n([\s\S]*?)\n---\n/);
  expect(match, `${path} : en-tête --- absent`).not.toBeNull();
  return match![1];
}

describe("en-tête des sous-agents et des skills", () => {
  it("trouve des fichiers à vérifier", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s : YAML valide avec name et description", (path) => {
    const data = parse(frontmatter(path)) as Record<string, unknown>;
    expect(typeof data.name, `${path} : name`).toBe("string");
    expect(typeof data.description, `${path} : description`).toBe("string");
  });
});
