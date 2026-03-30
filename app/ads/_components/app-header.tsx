"use client";

import { Bell, ChevronDown, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b px-6">
      <Button variant="ghost" size="icon-sm">
        <Settings className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <Bell className="size-4" />
      </Button>
      <button
        type="button"
        className="ml-2 flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-accent transition-colors"
      >
        <Avatar size="sm">
          <AvatarImage src="/placeholder-user.jpg" alt="Emma Warren" />
          <AvatarFallback className="text-[10px]">EW</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">Emma Warren</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
    </header>
  );
}
