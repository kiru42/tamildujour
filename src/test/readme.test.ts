// Le README explique le projet, comment lancer l'app et comment ajouter des
// mots ; ses commandes et son exemple de mot restent justes.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseWords } from "@/data/words.repository";

const readme = readFileSync("README.md", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

function section(title: string): string {
  const start = readme.indexOf(`## ${title}`);
  expect(start, `section « ${title} »`).toBeGreaterThanOrEqual(0);
  const next = readme.indexOf("\n## ", start + 1);
  return readme.slice(start, next === -1 ? undefined : next);
}

describe("README", () => {
  it("présente le projet", () => {
    expect(readme).toMatch(/^# Tamil du jour/);
    expect(readme).toMatch(/mot tamoul par jour/i);
  });

  it("explique comment lancer l'app, avec des commandes qui existent", () => {
    const launch = section("Lancer l'app");

    expect(launch).toContain("pnpm install");
    const scripts = [...launch.matchAll(/pnpm (?!install|dlx)([\w:]+)/g)].map(
      ([, script]) => script,
    );
    expect(scripts).toEqual(expect.arrayContaining(["dev", "test"]));
    for (const script of scripts) {
      expect(pkg.scripts, `script « ${script} »`).toHaveProperty(script);
    }
  });

  it("explique comment ajouter des mots, avec un exemple valide", () => {
    const words = section("Ajouter des mots");
    expect(words).toContain("src/data/words.json");

    const example = words.match(/```json\n([\s\S]*?)```/)?.[1];
    expect(example).toBeDefined();
    expect(() => parseWords([JSON.parse(example!)])).not.toThrow();
  });

});
