"use client";

import {
  BarChart3,
  ChevronDown,
  HelpCircle,
  HomeIcon,
  Import,
  Megaphone,
  MessageCircle,
  Settings,
  TrendingUp,
  Tv2,
  Users,
} from "lucide-react";
import { Area, AreaChart } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

const NAV_ITEMS = [
  { label: "Dashboard", icon: HomeIcon, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Ads", icon: Megaphone, active: true },
  { label: "Channels", icon: Tv2, active: false },
  { label: "Import", icon: Import, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

const FOOTER_LINKS = [
  { label: "Invite your team", icon: Users },
  { label: "Give feedback", icon: MessageCircle },
  { label: "Help & support", icon: HelpCircle },
] as const;

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="border-r">
      <SidebarHeader className="p-4 gap-4">
        <Button className="w-full" size="lg">
          Create an episode
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="bg-background"
          // className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <Avatar>
            <AvatarImage src="/placeholder-podcast.jpg" alt="Podcast" />
            <AvatarFallback className="text-[10px]">DC</AvatarFallback>
          </Avatar>
          <span className="truncate">The Diary Of A CEO</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 lg:px-8">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 lg:gap-8">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={item.active}
                    tooltip={item.label}
                    className="gap-4"
                  >
                    <item.icon className="size-4 lg:size-5" />
                    <span className="lg:text-2xl">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto" />

        <SidebarGroup className="px-4">
          <WeeklyPlaysWidget />
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-1 px-4 pb-4">
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 rounded-full border border-muted-foreground/40 flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-muted-foreground/60" />
            </div>
            <span>Demo mode</span>
          </div>
          <Switch size="sm" />
        </div>
        {FOOTER_LINKS.map((link) => (
          <button
            key={link.label}
            type="button"
            className="flex items-center gap-2 rounded-md px-0 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <link.icon className="size-4" />
            <span>{link.label}</span>
          </button>
        ))}
      </SidebarFooter>
    </Sidebar>
  );
}

function WeeklyPlaysWidget() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Weekly plays</span>
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <TrendingUp className="size-3" />
          17%
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight">738,849</p>
      <div className="mt-3 h-10">
        <MiniChart />
      </div>
      <div className="mt-2 flex gap-1">
        <div className="size-1.5 rounded-full bg-foreground" />
        <div className="size-1.5 rounded-full bg-muted" />
        <div className="size-1.5 rounded-full bg-muted" />
      </div>
    </div>
  );
}

const CHART_DATA = [
  { week: 1, plays: 30 },
  { week: 2, plays: 45 },
  { week: 3, plays: 35 },
  { week: 4, plays: 50 },
  { week: 5, plays: 40 },
  { week: 6, plays: 55 },
  { week: 7, plays: 65 },
  { week: 8, plays: 60 },
  { week: 9, plays: 70 },
  { week: 10, plays: 65 },
  { week: 11, plays: 75 },
  { week: 12, plays: 80 },
];

const chartConfig = {
  plays: {
    label: "Plays",
    color: "oklch(0.7 0.15 155)",
  },
} satisfies ChartConfig;

function MiniChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-10 w-full"
      initialDimension={{ width: 200, height: 40 }}
    >
      <AreaChart
        data={CHART_DATA}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="miniChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-plays)"
              stopOpacity={0.3}
            />
            <stop
              offset="100%"
              stopColor="var(--color-plays)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="plays"
          stroke="var(--color-plays)"
          strokeWidth={2}
          fill="url(#miniChartFill)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
