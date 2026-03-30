"use client";

export function PlayerPanelSlot() {
  return (
    <div
      data-slot="player-panel"
      className="flex-1 min-h-[40svh] rounded-xl border bg-card p-6 flex items-center justify-center text-sm text-muted-foreground"
    >
      Video player panel
    </div>
  );
}
