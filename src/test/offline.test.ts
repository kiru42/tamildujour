// Le service worker (public/sw.js) est exécuté dans un bac à sable avec un
// faux réseau et un faux CacheStorage : on vérifie qu'une fois l'app chargée
// la page et ses ressources sont servies sans réseau.

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

const ORIGIN = "https://tamildujour.test";
const SW_SOURCE = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");

const PAGE = `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="/_next/static/css/app.css">
<link rel="preload" as="font" href="/_next/static/media/mukta.woff2">
<script src="/_next/static/chunks/main.js" async></script>
</head><body>Tamil du jour</body></html>`;

const SITE: Record<string, string> = {
  "/": PAGE,
  "/manifest.webmanifest": "{}",
  "/icons/icon-192.png": "png",
  "/icons/icon-512.png": "png",
  "/icons/icon-maskable-512.png": "png",
  "/icons/apple-touch-icon.png": "png",
  "/_next/static/css/app.css":
    "@font-face{src:url(../media/baloo.woff2)}@font-face{src:url(\"/_next/static/media/mukta.woff2\")}",
  "/_next/static/media/mukta.woff2": "font",
  "/_next/static/media/baloo.woff2": "font",
  "/_next/static/chunks/main.js": "js",
};

type FakeRequest = { url: string; method: string; mode: string };

function toUrl(input: string | FakeRequest | Request) {
  return new URL(typeof input === "string" ? input : input.url, ORIGIN).href;
}

function setup() {
  let online = true;
  const site = { ...SITE };
  const networkCalls: string[] = [];

  async function network(input: string | FakeRequest | Request) {
    const url = new URL(toUrl(input));
    networkCalls.push(url.href);
    if (!online) throw new TypeError("Failed to fetch");
    const body = url.origin === ORIGIN ? site[url.pathname] : undefined;
    return body === undefined
      ? new Response("introuvable", { status: 404 })
      : new Response(body, { status: 200 });
  }

  const stores = new Map<string, Map<string, string>>();
  function openStore(name: string) {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    const cache = {
      async match(input: string | FakeRequest) {
        const body = store.get(toUrl(input));
        return body === undefined ? undefined : new Response(body);
      },
      async put(input: string | FakeRequest, response: Response) {
        store.set(toUrl(input), await response.text());
      },
      async addAll(inputs: string[]) {
        for (const input of inputs) {
          const response = await network(input);
          if (!response.ok) throw new TypeError(`échec : ${input}`);
          await cache.put(input, response);
        }
      },
    };
    return cache;
  }

  const caches = {
    open: async (name: string) => openStore(name),
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    async match(input: string | FakeRequest) {
      for (const name of stores.keys()) {
        const found = await openStore(name).match(input);
        if (found) return found;
      }
      return undefined;
    },
  };

  const listeners: Record<string, (event: unknown) => void> = {};
  const self = {
    location: new URL(ORIGIN),
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners[type] = listener;
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };

  vm.runInNewContext(SW_SOURCE, {
    self,
    caches,
    fetch: network,
    URL,
    Response,
    Promise,
  });

  async function lifecycle(type: "install" | "activate") {
    const pending: Promise<unknown>[] = [];
    listeners[type]({ waitUntil: (promise: Promise<unknown>) => pending.push(promise) });
    await Promise.all(pending);
  }

  async function request(
    pathOrUrl: string,
    { mode = "no-cors", method = "GET" } = {},
  ): Promise<Response | undefined> {
    let responded: Promise<Response> | undefined;
    listeners.fetch({
      request: { url: new URL(pathOrUrl, ORIGIN).href, method, mode },
      respondWith: (response: Promise<Response>) => {
        responded = response;
      },
      waitUntil: () => {},
    });
    return responded;
  }

  return {
    lifecycle,
    request,
    stores,
    site,
    networkCalls,
    goOffline: () => {
      online = false;
    },
  };
}

async function installed() {
  const sw = setup();
  await sw.lifecycle("install");
  await sw.lifecycle("activate");
  return sw;
}

describe("service worker hors ligne", () => {
  it("met en cache, dès l'installation, la page, le manifeste, les icônes et les ressources de la page", async () => {
    const sw = await installed();

    const cached = [...sw.stores.values()].flatMap((store) => [...store.keys()]);
    expect(cached.map((url) => new URL(url).pathname).sort()).toEqual(
      Object.keys(SITE).sort(),
    );
  });

  it("ouvre l'app sans réseau une fois chargée", async () => {
    const sw = await installed();
    sw.goOffline();

    const page = await sw.request("/", { mode: "navigate" });

    expect(await page!.text()).toBe(PAGE);
  });

  it("ouvre l'app sans réseau même depuis une adresse avec paramètres", async () => {
    const sw = await installed();
    sw.goOffline();

    const page = await sw.request("/?source=ecran-accueil", { mode: "navigate" });

    expect(await page!.text()).toBe(PAGE);
  });

  it("sert les scripts, styles et polices sans réseau", async () => {
    const sw = await installed();
    sw.goOffline();

    for (const asset of [
      "/_next/static/chunks/main.js",
      "/_next/static/css/app.css",
      "/_next/static/media/baloo.woff2",
    ]) {
      const response = await sw.request(asset);
      expect(await response!.text()).toBe(SITE[asset]);
    }
  });

  it("sert les ressources versionnées depuis le cache sans appeler le réseau", async () => {
    const sw = await installed();
    sw.networkCalls.length = 0;

    await sw.request("/_next/static/chunks/main.js");

    expect(sw.networkCalls).toEqual([]);
  });

  it("met en cache une nouvelle ressource chargée en ligne", async () => {
    const sw = await installed();
    sw.site["/_next/static/chunks/nouveau.js"] = "nouveau";

    await (await sw.request("/_next/static/chunks/nouveau.js"))!.text();
    sw.goOffline();
    const response = await sw.request("/_next/static/chunks/nouveau.js");

    expect(await response!.text()).toBe("nouveau");
  });

  it("charge la page en ligne en priorité et garde la dernière version", async () => {
    const sw = await installed();
    sw.site["/"] = "nouvelle version";

    const online = await sw.request("/", { mode: "navigate" });
    expect(await online!.text()).toBe("nouvelle version");

    sw.goOffline();
    const offline = await sw.request("/", { mode: "navigate" });
    expect(await offline!.text()).toBe("nouvelle version");
  });

  it("ne touche à aucune requête vers un autre site", async () => {
    const sw = await installed();
    sw.networkCalls.length = 0;

    const response = await sw.request("https://tiers.example/pixel.gif");

    expect(response).toBeUndefined();
    expect(sw.networkCalls).toEqual([]);
  });

  it("laisse passer les requêtes autres que GET", async () => {
    const sw = await installed();

    expect(await sw.request("/", { method: "POST" })).toBeUndefined();
  });

  it("supprime les caches d'une version précédente", async () => {
    const sw = setup();
    sw.stores.set("tamildujour-ancien", new Map([["x", "y"]]));

    await sw.lifecycle("install");
    await sw.lifecycle("activate");

    expect(sw.stores.has("tamildujour-ancien")).toBe(false);
    expect(sw.stores.size).toBe(1);
  });
});
