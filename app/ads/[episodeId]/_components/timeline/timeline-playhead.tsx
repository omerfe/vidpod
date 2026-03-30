"use client";

interface TimelinePlayheadProps {
  percentLeft: number;
  visible: boolean;
}

export function TimelinePlayhead({
  percentLeft,
  visible,
}: TimelinePlayheadProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        left: `${percentLeft}%`,
        top: 0,
        height: "calc(0.375rem + 10rem)",
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className="size-3.5 rounded-full border-2 border-destructive bg-destructive shadow-sm" />
          <div className="h-[calc(10rem-2px)] w-0.5 bg-destructive" />
        </div>
      </div>
    </div>
  );
}
