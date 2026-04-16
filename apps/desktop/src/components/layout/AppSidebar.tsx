import * as React from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  ScrollText,
  FileCode2,
  GitCompare,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import type { RouteId } from "../../app/routes";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/cn";
import { useUIStore } from "../../stores/useUIStore";

interface NavItem {
  id: RouteId;
  label: string;
  icon: React.ElementType;
  agentScoped?: boolean;
}

const agentNavItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, agentScoped: true },
  { id: "agents", label: "Permissions", icon: ShieldCheck, agentScoped: true },
  { id: "files", label: "Files", icon: FileCode2, agentScoped: true },
  { id: "change-review", label: "Changes & Backups", icon: GitCompare, agentScoped: true }
];

const globalNavItems: NavItem[] = [
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings }
];

interface AppSidebarProps {
  route: RouteId;
  onRoute: (route: RouteId) => void;
  className?: string;
}

function AppSidebar({ route, onRoute, className }: AppSidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-[width] duration-150 ease-out overflow-hidden shrink-0",
          sidebarCollapsed ? "w-[52px]" : "w-[220px]",
          className
        )}
        aria-label="Primary navigation"
      >
        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1" aria-label="Agent navigation">
          <SidebarSection
            items={agentNavItems}
            route={route}
            onRoute={onRoute}
            collapsed={sidebarCollapsed}
            label="Agent"
          />
          <Separator className="my-2" />
          <SidebarSection
            items={globalNavItems}
            route={route}
            onRoute={onRoute}
            collapsed={sidebarCollapsed}
            label="Global"
          />
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface SidebarSectionProps {
  items: NavItem[];
  route: RouteId;
  onRoute: (route: RouteId) => void;
  collapsed: boolean;
  label: string;
}

function SidebarSection({ items, route, onRoute, collapsed, label }: SidebarSectionProps) {
  return (
    <div>
      {!collapsed && (
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          {label}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = route === item.id;
        const btn = (
          <button
            key={item.id}
            type="button"
            onClick={() => onRoute(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
              collapsed ? "justify-center" : "",
              isActive
                ? "bg-[#eef8f5] text-[#1d7f68] dark:bg-[#162f2a] dark:text-[#3dd6aa]"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }
        return btn;
      })}
    </div>
  );
}

export { AppSidebar };
