// Le repo est public : aucun secret, aucun fichier .env versionné.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

function trackedFiles(): string[] {
  return git("ls-files", "-z").split("\0").filter(Boolean);
}

// Formes connues de jetons et de clés privées.
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/, // AWS
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, // GitHub
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/, // Anthropic, OpenAI
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, // Slack
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // JWT
  /\bvercel_[A-Za-z0-9]{20,}\b/i,
];

describe("aucun secret dans le repo", () => {
  it("aucun fichier .env n'est versionné, sauf .env.example", () => {
    const envFiles = trackedFiles().filter((file) =>
      /(^|\/)\.env(\..+)?$/.test(file),
    );

    expect(envFiles).toEqual([".env.example"]);
  });

  it.each([".env", ".env.local", ".env.production.local"])(
    "%s est ignoré par git",
    (file) => {
      expect(git("check-ignore", "--no-index", file).trim()).toBe(file);
    },
  );

  it(".env.example ne contient aucune valeur", () => {
    const assignments = readFileSync(".env.example", "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));

    for (const line of assignments) {
      expect(line).toMatch(/^[A-Z][A-Z0-9_]*=$/);
    }
  });

  it("aucun fichier versionné ne contient de jeton ou de clé privée", () => {
    const leaks = trackedFiles()
      .filter((file) => !/\.(png|ico|woff2?)$/.test(file))
      .flatMap((file) => {
        const text = readFileSync(file, "utf8");
        return SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map(
          (pattern) => `${file} : ${pattern}`,
        );
      });

    expect(leaks).toEqual([]);
  });
});
