import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  type EditorHistoryState,
  EMPTY_HISTORY,
  type MarkerSnapshot,
  popRedo,
  popUndo,
  pushCommand,
  replaceMarkerId,
} from "./editor-history";

const snapshot: MarkerSnapshot = {
  episodeSlug: "ep-1",
  markerType: "static",
  startMs: 5_000,
  label: "Test marker",
  notes: null,
  adAssetIds: ["ad-1"],
};

describe("pushCommand", () => {
  it("appends a command to past and clears future", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 1_000,
      newStartMs: 2_000,
    });

    expect(state.past).toHaveLength(1);
    expect(state.past[0]?.kind).toBe("move");
    expect(state.future).toHaveLength(0);
  });

  it("clears future when a new command is pushed after undo", () => {
    let state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 1_000,
      newStartMs: 2_000,
    });
    const undone = popUndo(state);
    if (!undone) {
      throw new Error("No undone state");
    }
    state = undone.next;
    expect(state.future).toHaveLength(1);

    state = pushCommand(state, {
      kind: "delete",
      markerId: "m2",
      snapshot,
    });
    expect(state.past).toHaveLength(1);
    expect(state.past[0]?.kind).toBe("delete");
    expect(state.future).toHaveLength(0);
  });
});

describe("popUndo", () => {
  it("returns null on empty history", () => {
    expect(popUndo(EMPTY_HISTORY)).toBeNull();
  });

  it("moves the last past command into future", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 1_000,
      newStartMs: 3_000,
    });

    const result = popUndo(state);
    if (!result) {
      throw new Error("No undone state");
    }
    expect(result.command.kind).toBe("move");
    expect(result.next.past).toHaveLength(0);
    expect(result.next.future).toHaveLength(1);
  });

  it("preserves earlier commands in past", () => {
    let state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 0,
      newStartMs: 1_000,
    });
    state = pushCommand(state, {
      kind: "delete",
      markerId: "m2",
      snapshot,
    });
    if (!state) {
      throw new Error("No state");
    }

    const result = popUndo(state);
    if (!result) {
      throw new Error("No undone state");
    }
    expect(result.command.kind).toBe("delete");
    expect(result.next.past).toHaveLength(1);
    expect(result.next.past[0]?.kind).toBe("move");
  });
});

describe("popRedo", () => {
  it("returns null when future is empty", () => {
    expect(popRedo(EMPTY_HISTORY)).toBeNull();
  });

  it("moves the last future command back into past", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 0,
      newStartMs: 5_000,
    });
    const undone = popUndo(state);
    if (!undone) {
      throw new Error("No undone state");
    }
    const redone = popRedo(undone.next);
    if (!redone) {
      throw new Error("No redone state");
    }
    expect(redone.command.kind).toBe("move");
    expect(redone.next.past).toHaveLength(1);
    expect(redone.next.future).toHaveLength(0);
  });
});

describe("canUndo / canRedo", () => {
  it("returns false for empty history", () => {
    expect(canUndo(EMPTY_HISTORY)).toBe(false);
    expect(canRedo(EMPTY_HISTORY)).toBe(false);
  });

  it("reports undo available after push", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 0,
      newStartMs: 1_000,
    });
    expect(canUndo(state)).toBe(true);
    expect(canRedo(state)).toBe(false);
  });

  it("reports redo available after undo", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "m1",
      previousStartMs: 0,
      newStartMs: 1_000,
    });
    const undone = popUndo(state)?.next;
    if (!undone) {
      throw new Error("No undone state");
    }
    expect(canUndo(undone)).toBe(false);
    expect(canRedo(undone)).toBe(true);
  });
});

describe("replaceMarkerId", () => {
  it("updates matching IDs in both past and future", () => {
    let state = pushCommand(EMPTY_HISTORY, {
      kind: "delete",
      markerId: "old-id",
      snapshot,
    });
    state = pushCommand(state, {
      kind: "move",
      markerId: "other-id",
      previousStartMs: 0,
      newStartMs: 1_000,
    });
    const undone = popUndo(state)?.next;
    if (!undone) {
      throw new Error("No undone state");
    }

    const updated = replaceMarkerId(undone, "old-id", "new-id");

    expect(updated.past[0]?.markerId).toBe("new-id");
    expect(updated.future[0]?.markerId).toBe("other-id");
  });

  it("does not modify commands with different IDs", () => {
    const state = pushCommand(EMPTY_HISTORY, {
      kind: "move",
      markerId: "unrelated",
      previousStartMs: 0,
      newStartMs: 1_000,
    });

    const updated = replaceMarkerId(state, "old-id", "new-id");
    expect(updated.past[0]?.markerId).toBe("unrelated");
  });
});

describe("full undo/redo cycle", () => {
  it("supports multiple undo then redo in correct order", () => {
    let state: EditorHistoryState = EMPTY_HISTORY;

    state = pushCommand(state, {
      kind: "create",
      markerId: "c1",
      snapshot: { ...snapshot, startMs: 1_000 },
    });
    state = pushCommand(state, {
      kind: "move",
      markerId: "c1",
      previousStartMs: 1_000,
      newStartMs: 2_000,
    });
    state = pushCommand(state, {
      kind: "delete",
      markerId: "c1",
      snapshot: { ...snapshot, startMs: 2_000 },
    });

    expect(state.past).toHaveLength(3);

    const u1 = popUndo(state);
    if (!u1) {
      throw new Error("No undone state");
    }
    expect(u1.command.kind).toBe("delete");
    const u2 = popUndo(u1.next);
    if (!u2) {
      throw new Error("No undone state");
    }
    expect(u2.command.kind).toBe("move");
    const u3 = popUndo(u2.next);
    if (!u3) {
      throw new Error("No undone state");
    }
    expect(u3.command.kind).toBe("create");

    expect(canUndo(u3.next)).toBe(false);
    expect(u3.next.future).toHaveLength(3);

    const r1 = popRedo(u3.next);
    if (!r1) {
      throw new Error("No undone state");
    }
    expect(r1.command.kind).toBe("create");
    const r2 = popRedo(r1.next);
    if (!r2) {
      throw new Error("No undone state");
    }
    expect(r2.command.kind).toBe("move");
    const r3 = popRedo(r2.next);
    if (!r3) {
      throw new Error("No undone state");
    }
    expect(r3.command.kind).toBe("delete");

    expect(canRedo(r3.next)).toBe(false);
    expect(r3.next.past).toHaveLength(3);
  });
});
