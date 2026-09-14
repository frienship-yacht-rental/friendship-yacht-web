import { describe, expect, it } from "vitest";

import { getBrowserApi } from "./browser";

describe("getBrowserApi", () => {
  it("memoises the client", () => {
    expect(getBrowserApi()).toBe(getBrowserApi());
  });

  it("exposes the HTTP verb helpers", () => {
    const api = getBrowserApi();
    expect(typeof api.get).toBe("function");
    expect(typeof api.post).toBe("function");
    expect(typeof api.delete).toBe("function");
  });
});
