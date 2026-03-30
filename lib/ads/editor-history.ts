import type { MarkerType } from "./contracts";

export type MarkerSnapshot = {
  episodeSlug: string;
  markerType: MarkerType;
  startMs: number;
  label: string;
  notes: string | null;
  adAssetIds: string[];
};

export type MoveCommand = {
  kind: "move";
  markerId: string;
  previousStartMs: number;
  newStartMs: number;
};

export type DeleteCommand = {
  kind: "delete";
  markerId: string;
  snapshot: MarkerSnapshot;
};

export type CreateCommand = {
  kind: "create";
  markerId: string;
  snapshot: MarkerSnapshot;
};

export type EditorCommand = MoveCommand | DeleteCommand | CreateCommand;

export type EditorHistoryState = {
  past: EditorCommand[];
  future: EditorCommand[];
};

export const EMPTY_HISTORY: EditorHistoryState = {
  past: [],
  future: [],
};

export function pushCommand(
  state: EditorHistoryState,
  command: EditorCommand,
): EditorHistoryState {
  return {
    past: [...state.past, command],
    future: [],
  };
}

export function popUndo(
  state: EditorHistoryState,
): { next: EditorHistoryState; command: EditorCommand } | null {
  if (state.past.length === 0) return null;
  const command = state.past.at(-1);
  if (!command) return null;
  return {
    next: {
      past: state.past.slice(0, -1),
      future: [...state.future, command],
    },
    command,
  };
}

export function popRedo(
  state: EditorHistoryState,
): { next: EditorHistoryState; command: EditorCommand } | null {
  if (state.future.length === 0) return null;
  const command = state.future.at(-1);
  if (!command) return null;
  return {
    next: {
      past: [...state.past, command],
      future: state.future.slice(0, -1),
    },
    command,
  };
}

export function canUndo(state: EditorHistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: EditorHistoryState): boolean {
  return state.future.length > 0;
}

export function replaceMarkerId(
  state: EditorHistoryState,
  oldId: string,
  newId: string,
): EditorHistoryState {
  const updateCmd = (cmd: EditorCommand): EditorCommand => {
    if (cmd.markerId !== oldId) return cmd;
    return { ...cmd, markerId: newId };
  };
  return {
    past: state.past.map(updateCmd),
    future: state.future.map(updateCmd),
  };
}
