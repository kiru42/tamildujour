// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StreakBanner } from "./streak-banner";

afterEach(cleanup);

describe("<StreakBanner />", () => {
  it("affiche la série avec la flamme", () => {
    render(<StreakBanner streak={{ days: 3, missedYesterday: false }} />);

    const badge = screen.getByLabelText("Série : 3 jours");
    expect(badge.textContent).toContain("🔥");
    expect(badge.textContent).toContain("3");
  });

  it("accorde « jour » au singulier pour 0 et 1", () => {
    render(<StreakBanner streak={{ days: 1, missedYesterday: false }} />);
    expect(screen.getByLabelText("Série : 1 jour")).toBeDefined();
    cleanup();

    render(<StreakBanner streak={{ days: 0, missedYesterday: false }} />);
    expect(screen.getByLabelText("Série : 0 jour")).toBeDefined();
  });

  it("affiche « Ne rate pas deux fois » le lendemain d'un jour manqué", () => {
    render(<StreakBanner streak={{ days: 4, missedYesterday: true }} />);

    expect(screen.getByText("Ne rate pas deux fois")).toBeDefined();
  });

  it("n'affiche pas le message sans jour manqué", () => {
    render(<StreakBanner streak={{ days: 4, missedYesterday: false }} />);

    expect(screen.queryByText("Ne rate pas deux fois")).toBeNull();
  });

  it("se place en haut de l'écran, dans l'en-tête", () => {
    render(<StreakBanner streak={{ days: 2, missedYesterday: false }} />);

    expect(screen.getByRole("banner").textContent).toContain("🔥");
  });

  it("n'affiche rien tant que la série n'est pas chargée", () => {
    const { container } = render(<StreakBanner streak={null} />);

    expect(container.textContent).not.toContain("🔥");
  });
});
