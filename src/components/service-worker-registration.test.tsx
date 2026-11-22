// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceWorkerRegistration } from "./service-worker-registration";

function stubServiceWorker() {
  const register = vi.fn(async () => ({}));
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  return register;
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("<ServiceWorkerRegistration />", () => {
  it("enregistre le service worker en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const register = stubServiceWorker();

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  });

  it("ne l'enregistre pas en développement", () => {
    vi.stubEnv("NODE_ENV", "development");
    const register = stubServiceWorker();

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });

  it("ne plante pas sur un navigateur sans service worker", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
