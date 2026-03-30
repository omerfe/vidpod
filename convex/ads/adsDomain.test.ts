import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  assertNoExactStartOverlap,
  normalizeMarkerStartMs,
  validateAssignmentIds,
} from "./adsDomain";

describe("adsDomain", () => {
  it("rejects exact duplicate start times", () => {
    expect(() =>
      assertNoExactStartOverlap({
        candidateStartMs: 2000,
        existingMarkers: [{ id: "a", startMs: 2000 }],
      }),
    ).toThrow(ConvexError);
  });

  it("allows the same start when updating the excluded marker", () => {
    expect(() =>
      assertNoExactStartOverlap({
        candidateStartMs: 2000,
        existingMarkers: [
          { id: "a", startMs: 2000 },
          { id: "b", startMs: 5000 },
        ],
        excludeMarkerId: "a",
      }),
    ).not.toThrow();
  });

  it("normalizes marker start against episode duration", () => {
    expect(normalizeMarkerStartMs(-100, 18_000)).toBe(0);
    expect(normalizeMarkerStartMs(999_999, 18_000)).toBe(17_000);
  });

  it("validates static assignment counts", () => {
    expect(() => validateAssignmentIds("static", ["a", "b"])).toThrow(
      ConvexError,
    );
    expect(validateAssignmentIds("static", ["a"])).toEqual(["a"]);
  });
});
