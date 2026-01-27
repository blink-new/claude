"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Briefcase,
  Users2,
  Kanban,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// =============================================================================
// TYPES
// =============================================================================

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { name: "Candidates", href: "/dashboard/candidates", icon: Users2 },
  { name: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  
  // Mobile slide-in state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse state
  const [collapsed, setCollapsed] = useState(false);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ===================================================================
          MOBILE BACKDROP
          =================================================================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===================================================================
          SIDEBAR
          - w-64 expanded, w-16 collapsed
          - Fixed on mobile, relative on desktop
          - group/sidebar enables hover detection anywhere on sidebar
          =================================================================== */}
      <aside
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-200 lg:relative lg:translate-x-0",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* =================================================================
              HEADER - Team Switcher + Collapse Toggle
              - When collapsed: team switcher shows by default
              - On hover (anywhere on sidebar): team switcher hides, expand btn shows
              - Both are h-10 w-10 for no layout shift
              ================================================================= */}
          <div className={cn(
            "flex items-center border-b border-sidebar-border",
            collapsed ? "p-2 justify-center" : "p-3 gap-2"
          )}>
            {/* Team Switcher - hidden on hover when collapsed (replaced by expand btn) */}
            <div className={cn(
              "min-w-0",
              collapsed 
                ? "flex-none lg:group-hover/sidebar:hidden" 
                : "flex-1"
            )}>
              <TeamSwitcher collapsed={collapsed} />
            </div>
            
            {/* Collapse Toggle Button
                - Shows on hover ANYWHERE on sidebar
                - Same size as team switcher (h-10 w-10) for seamless swap
                - hidden lg:hidden lg:group-hover/sidebar:flex pattern */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-10 w-10 cursor-pointer shrink-0 hidden lg:hidden lg:group-hover/sidebar:flex"
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? "Open sidebar" : "Close sidebar"}
              </TooltipContent>
            </Tooltip>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* =================================================================
              NAVIGATION
              - ScrollArea for overflow
              - Tooltips on right when collapsed
              ================================================================= */}
          <ScrollArea className={cn("flex-1 py-4", collapsed ? "px-2" : "px-3")}>
            <nav className="space-y-1">
              {navigation.map((item) => {
                // Active state detection
                const isActive = item.href === "/dashboard" 
                  ? pathname === item.href 
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                
                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "justify-center p-3" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && item.name}
                  </Link>
                );

                // Wrap in tooltip when collapsed
                if (collapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.name}>{linkContent}</div>;
              })}
            </nav>
          </ScrollArea>

          {/* =================================================================
              FOOTER - User Dropdown
              - NO Tooltip wrapper (breaks dropdown click)
              - Shows user info in dropdown header when collapsed
              ================================================================= */}
          <div className={cn(
            "border-t border-sidebar-border",
            collapsed ? "p-2" : "p-3"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer",
                  collapsed ? "justify-center w-full p-2" : "gap-3 w-full p-2"
                )}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={collapsed ? "start" : "end"} 
                side={collapsed ? "right" : "top"} 
                className="w-56"
              >
                {/* User info header when collapsed (replaces tooltip) */}
                {collapsed && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* ===================================================================
          MAIN CONTENT
          =================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger menu */}
        <header className="flex h-14 items-center gap-4 border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">App Name</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
