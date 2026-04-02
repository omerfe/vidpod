"use client";

import { Bell, ChevronDown, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="flex h-26 shrink-0 items-center justify-between border-b px-6 lg:px-16">
      <div className="flex items-center gap-2">
        <VidpodLogo className="size-6" />
        <span className="text-2xl font-bold">Vidpod</span>
      </div>
      <div className="flex items-center gap-4 lg:gap-8">
        <Button variant="ghost" size="icon-sm">
          <Settings className="size-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4 text-muted-foreground" />
          <div className="absolute top-0 right-0 size-2 bg-red-500 rounded-full" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-background"
          size="xl"
        >
          <Avatar>
            <AvatarImage src="/placeholder-user.jpg" alt="Emma Warren" />
            <AvatarFallback className="text-[10px]">EW</AvatarFallback>
          </Avatar>
          <span className="font-bold text-base">Emma Warren</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}

function VidpodLogo({ className }: { className?: string }) {
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
