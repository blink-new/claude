# SaaS Collapsible Sidebar

Build a modern, collapsible sidebar for SaaS dashboards following the ChatGPT/Notion design pattern.

## When to Use

Use this skill when:
- Building a SaaS dashboard with sidebar navigation
- User requests collapsible/minimizable sidebar
- Need icon-only sidebar mode with tooltips
- Building responsive dashboard layouts

## Design Decisions

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Sidebar (w-64 expanded / w-16 collapsed)        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Header: [TeamSwitcher] [CollapseBtn*]       │ │  * appears on hover
│ ├─────────────────────────────────────────────┤ │
│ │ Navigation (ScrollArea)                     │ │
│ │   [Icon] Label  (expanded)                  │ │
│ │   [Icon]        (collapsed + tooltip)       │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Footer: User Avatar + Dropdown              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Width Dimensions**
   - Expanded: `w-64` (256px)
   - Collapsed: `w-16` (64px)
   - Transition: `transition-all duration-200`

2. **Collapse Toggle Button**
   - Position: Header row, RIGHT of team switcher
   - Visibility: Hidden by default, shows on hover (using `group/header`)
   - Icons: `PanelLeftOpen` (expand) / `PanelLeftClose` (collapse)
   - Zero width when hidden (use `hidden`/`flex`, NOT opacity)
   - Tooltip: "Open sidebar" / "Close sidebar"

3. **Navigation Items (Collapsed)**
   - Icon only, centered: `justify-center p-3`
   - Tooltip on right side showing item name
   - Active state still visible via background

4. **User Footer (Collapsed)**
   - Avatar only, centered
   - NO tooltip wrapper (conflicts with dropdown)
   - Dropdown shows user info header when collapsed
   - Dropdown position: `side="right" align="start"`

5. **Mobile Behavior**
   - Separate `sidebarOpen` state for mobile slide-in
   - Backdrop overlay with blur
   - X close button in header (mobile only)
   - Menu hamburger in main content header

### Critical Implementation Notes

**DO NOT nest Tooltip inside DropdownMenuTrigger** - causes click handling issues. Instead:
- Remove tooltip for dropdown triggers when collapsed
- Add user info to dropdown content when collapsed

**Hover-reveal button pattern:**
```tsx
// Parent needs group class
<div className="group/header">
  {/* Button hidden by default, shows on group hover */}
  <Button className="hidden lg:hidden lg:group-hover/header:flex" />
</div>
```

**Tooltip positioning:**
- All collapsed tooltips: `side="right"`
- Zero delay (per user rules)

## Dependencies

- shadcn/ui components: `Button`, `Avatar`, `DropdownMenu`, `ScrollArea`, `Tooltip`
- lucide-react icons: `PanelLeftOpen`, `PanelLeftClose`, `Menu`, `X`, `ChevronDown`
- Tailwind CSS with `cn()` utility

## Implementation

### Step 1: Add Required Imports

```tsx
import {
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
```

### Step 2: Add State

```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);  // mobile
const [collapsed, setCollapsed] = useState(false);       // desktop collapse
```

### Step 3: Sidebar Container

```tsx
<aside
  className={cn(
    "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-200 lg:relative lg:translate-x-0",
    collapsed ? "w-16" : "w-64",
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  )}
>
```

### Step 4: Header with Hover-Reveal Toggle

```tsx
<div className={cn(
  "group/header flex items-center border-b border-sidebar-border",
  collapsed ? "p-2 justify-center" : "p-3 gap-2"
)}>
  {/* Team Switcher - only when expanded */}
  {!collapsed && (
    <div className="flex-1 min-w-0">
      <TeamSwitcher />
    </div>
  )}
  
  {/* Collapse Toggle - shows on hover, zero width when hidden */}
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "h-8 w-8 cursor-pointer shrink-0",
          collapsed 
            ? "flex" 
            : "hidden lg:hidden lg:group-hover/header:flex"
        )}
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
```

### Step 5: Navigation with Tooltips

```tsx
<ScrollArea className={cn("flex-1 py-4", collapsed ? "px-2" : "px-3")}>
  <nav className="space-y-1">
    {navigation.map((item) => {
      const isActive = /* your active logic */;
      
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
```

### Step 6: User Footer (NO Tooltip wrapper)

```tsx
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
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
      {/* Show user info when collapsed since no tooltip */}
      {collapsed && (
        <>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
        </>
      )}
      {/* Rest of dropdown items */}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### Step 7: Mobile Backdrop & Header

```tsx
{/* Mobile backdrop */}
{sidebarOpen && (
  <div
    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}

{/* Mobile header in main content */}
<header className="flex h-14 items-center gap-4 border-b px-4 lg:hidden">
  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
    <Menu className="h-5 w-5" />
  </Button>
  <span className="font-semibold">App Name</span>
</header>
```

## Reference Implementation

See `assets/components/dashboard-shell.tsx` for complete working example.

## CSS Variables (globals.css)

Ensure these sidebar CSS variables are defined:

```css
:root {
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-border: 220 13% 91%;
  --sidebar-accent: 220 14.3% 95.9%;
  --sidebar-accent-foreground: 220.9 39.3% 11%;
}

.dark {
  --sidebar: 240 5.9% 10%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 240 4.8% 95.9%;
}
```

## Checklist

- [ ] Two states: `sidebarOpen` (mobile) and `collapsed` (desktop)
- [ ] Width transitions smoothly between w-64 and w-16
- [ ] Collapse button in header, right side, hover-reveal
- [ ] Collapse button takes zero width when hidden
- [ ] Navigation tooltips on right when collapsed
- [ ] User dropdown works when collapsed (no tooltip wrapper!)
- [ ] User info shown in dropdown header when collapsed
- [ ] Mobile has backdrop + slide animation
- [ ] Mobile header with hamburger menu
- [ ] All tooltips have zero delay
