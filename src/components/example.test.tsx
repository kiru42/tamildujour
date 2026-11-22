// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Example } from "./example";

afterEach(cleanup);

describe("<Example />", () => {
  it("affiche le libellé reçu", () => {
    render(<Example example={{ label: "vide" }} />);

    expect(screen.getByText("vide")).toBeDefined();
  });
});
