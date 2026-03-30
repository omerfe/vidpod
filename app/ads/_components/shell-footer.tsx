export function ShellFooter() {
  return (
    <footer className="flex h-10 shrink-0 items-center justify-between border-t px-6 text-xs text-muted-foreground">
      <span>Video first podcasts</span>
      <div className="flex items-center gap-1.5">
        <VidpodMark className="size-4" />
        <span className="font-medium text-foreground">Vidpod</span>
      </div>
    </footer>
  );
}

function VidpodMark({ className }: { className?: string }) {
  return (
    <svg
      width="23"
      height="26"
      viewBox="0 0 23 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M11.389 0.5L22.026 16.4555C22.5052 17.1743 22.2798 18.1481 21.5336 18.5833L11.389 24.5M11.389 0.5L0.751957 16.4555C0.272808 17.1743 0.499259 18.1488 1.24542 18.584C4.92808 20.7318 7.36981 22.1559 11.389 24.5M11.389 0.5V24.5"
        stroke="currentColor"
      />
    </svg>
  );
}
