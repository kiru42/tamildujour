"use client";

// Enregistre le service worker (public/sw.js) qui rend l'app utilisable hors
// ligne. Seulement en production : en développement, il masquerait les
// modifications du code.

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Sans service worker, l'app marche quand même en ligne.
      });
  }, []);

  return null;
}
