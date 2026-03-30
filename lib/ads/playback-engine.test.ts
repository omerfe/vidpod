import { describe, expect, it } from "vitest";
import {
  clampTimeMs,
  fractionToMs,
  isInteractiveElement,
  msToSeconds,
  progressFraction,
  secondsToMs,
  skipBackwardMs,
  skipForwardMs,
  SKIP_STEP_MS,
} from "./playback-engine";

describe("clampTimeMs", () => {
  it("returns 0 for negative values", () => {
    expect(clampTimeMs(-500, 60_000)).toBe(0);
  });

  it("returns duration for values exceeding duration", () => {
    expect(clampTimeMs(100_000, 60_000)).toBe(60_000);
  });

  it("passes through values within range", () => {
    expect(clampTimeMs(30_000, 60_000)).toBe(30_000);
  });

  it("returns 0 for duration 0", () => {
    expect(clampTimeMs(5_000, 0)).toBe(0);
  });
});

describe("skipForwardMs", () => {
  it("advances by default step", () => {
    expect(skipForwardMs(5_000, 60_000)).toBe(5_000 + SKIP_STEP_MS);
  });

  it("clamps at duration", () => {
    expect(skipForwardMs(55_000, 60_000)).toBe(60_000);
  });

  it("accepts custom step", () => {
    expect(skipForwardMs(0, 60_000, 5_000)).toBe(5_000);
  });
});

describe("skipBackwardMs", () => {
  it("retreats by default step", () => {
    expect(skipBackwardMs(20_000, 60_000)).toBe(20_000 - SKIP_STEP_MS);
  });

  it("clamps at 0", () => {
    expect(skipBackwardMs(3_000, 60_000)).toBe(0);
  });

  it("accepts custom step", () => {
    expect(skipBackwardMs(10_000, 60_000, 3_000)).toBe(7_000);
  });
});

describe("msToSeconds / secondsToMs", () => {
  it("converts ms to seconds", () => {
    expect(msToSeconds(1_500)).toBe(1.5);
  });

  it("converts seconds to ms with rounding", () => {
    expect(secondsToMs(1.5)).toBe(1_500);
    expect(secondsToMs(1.5004)).toBe(1_500);
    expect(secondsToMs(1.5006)).toBe(1_501);
  });
});

describe("progressFraction", () => {
  it("returns 0 for zero duration", () => {
    expect(progressFraction(5_000, 0)).toBe(0);
  });

  it("returns correct fraction", () => {
    expect(progressFraction(30_000, 60_000)).toBe(0.5);
  });

  it("clamps between 0 and 1", () => {
    expect(progressFraction(-1, 60_000)).toBe(0);
    expect(progressFraction(90_000, 60_000)).toBe(1);
  });
});

describe("fractionToMs", () => {
  it("converts fraction to ms", () => {
    expect(fractionToMs(0.5, 60_000)).toBe(30_000);
  });

  it("clamps at 0", () => {
    expect(fractionToMs(-0.1, 60_000)).toBe(0);
  });

  it("clamps at duration", () => {
    expect(fractionToMs(1.5, 60_000)).toBe(60_000);
  });
});

describe("isInteractiveElement", () => {
  it("returns true for input elements", () => {
    const input = document.createElement("input");
    expect(isInteractiveElement(input)).toBe(true);
  });

  it("returns true for textarea elements", () => {
    const textarea = document.createElement("textarea");
    expect(isInteractiveElement(textarea)).toBe(true);
  });

  it("returns true for select elements", () => {
    const select = document.createElement("select");
    expect(isInteractiveElement(select)).toBe(true);
  });

  it("returns true for button elements", () => {
    const button = document.createElement("button");
    expect(isInteractiveElement(button)).toBe(true);
  });

  it("returns true for contenteditable elements", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(isInteractiveElement(div)).toBe(true);
  });

  it("returns true for searchbox role", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "searchbox");
    expect(isInteractiveElement(div)).toBe(true);
  });

  it("returns false for plain divs", () => {
    const div = document.createElement("div");
    expect(isInteractiveElement(div)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isInteractiveElement(null)).toBe(false);
  });
});
