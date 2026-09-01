import { describe, expect, it } from "vitest";

import {
  buildSearchApiUrl,
  buildSearchPageUrl,
  parseSearchLimit,
} from "@/lib/constitution/search-params";

describe("parseSearchLimit", () => {
  it("returns default when limit is omitted", () => {
    expect(parseSearchLimit(null)).toBe(10);
  });

  it("parses valid limits", () => {
    expect(parseSearchLimit("45")).toBe(45);
  });

  it("caps limits at the maximum", () => {
    expect(parseSearchLimit("100")).toBe(50);
  });

  it("falls back to default for invalid limits", () => {
    expect(parseSearchLimit("abc")).toBe(10);
    expect(parseSearchLimit("0")).toBe(10);
  });
});

describe("buildSearchApiUrl", () => {
  it("includes query and limit", () => {
    expect(buildSearchApiUrl("people", 45)).toBe(
      "/api/constitution/search?q=people&limit=45",
    );
  });
});

describe("buildSearchPageUrl", () => {
  it("omits limit when using the default", () => {
    expect(buildSearchPageUrl("people")).toBe("/search?q=people");
  });

  it("includes limit when non-default", () => {
    expect(buildSearchPageUrl("people", 45)).toBe("/search?q=people&limit=45");
  });
});
