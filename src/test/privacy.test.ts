// Aucun traceur, aucun appel vers un service tiers : le code livré (src et
// public, hors tests) ne contient aucune adresse externe et aucune
// dépendance d'analytics.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SHIPPED_DIRS = ["src", "public"];
const TEXT_FILE = /\.(ts|tsx|js|mjs|json|css|webmanifest|svg|html)$/;
const TEST_FILE = /\.test\.(ts|tsx)$|^src\/test\//;

// Seules adresses tolérées : des espaces de noms XML, jamais chargés.
const ALLOWED_URLS = [/^http:\/\/www\.w3\.org\//];

const TRACKERS = [
  /analytics/i,
  /speed-insights/i,
  /^@next\/third-parties$/,
  /gtag|google-tag|react-ga/i,
  /posthog|mixpanel|segment|amplitude|plausible|matomo|hotjar|umami/i,
  /^@sentry\//,
  /datadog|newrelic|logrocket|fullstory/i,
];

function shippedFiles(): string[] {
  return SHIPPED_DIRS.flatMap((dir) =>
    readdirSync(path.join(ROOT, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(ROOT, path.join(entry.parentPath, entry.name)))
      .filter((file) => TEXT_FILE.test(file) && !TEST_FILE.test(file)),
  );
}

describe("aucun traceur ni service tiers", () => {
  it("le code livré ne contient aucune adresse externe", () => {
    const external = shippedFiles().flatMap((file) =>
      [...readFileSync(path.join(ROOT, file), "utf8").matchAll(/https?:\/\/[^\s"'`)<>]+/g)]
        .map(([url]) => url)
        .filter((url) => !ALLOWED_URLS.some((allowed) => allowed.test(url)))
        .map((url) => `${file} : ${url}`),
    );

    expect(external).toEqual([]);
  });

  it("aucune dépendance de mesure d'audience ni de suivi", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const dependencies = Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
    });

    expect(
      dependencies.filter((name) => TRACKERS.some((tracker) => tracker.test(name))),
    ).toEqual([]);
  });

  it("le scan voit bien les fichiers livrés", () => {
    const files = shippedFiles();

    expect(files).toContain("src/app/layout.tsx");
    expect(files).toContain("public/sw.js");
    expect(files).toContain("public/manifest.webmanifest");
  });
});
