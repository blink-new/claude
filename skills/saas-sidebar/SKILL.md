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
│ │ Header: [TeamSwitcher] or [ExpandBtn]*      │ │  * swap on hover
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
   - Position: Header row, replaces team switcher on hover when collapsed
   - Visibility: Hidden by default, shows on hover **anywhere on sidebar** (using `group/sidebar`)
   - Icons: `PanelLeftOpen` (expand) / `PanelLeftClose` (collapse)
   - Size: `h-10 w-10` (matches team switcher for no layout shift)
   - Tooltip: "Open sidebar" / "Close sidebar"

3. **Team Switcher (Collapsed)**
   - Shows icon-only avatar (`h-10 w-10 p-0`)
   - Hidden on hover, replaced by expand button
   - NO tooltip wrapper (breaks popover click) - popover itself shows team list
   - Popover position: `side="right"`

4. **Show Only One at a Time (Collapsed)**
   - Team switcher: `lg:group-hover/sidebar:hidden`
   - Expand button: `hidden lg:hidden lg:group-hover/sidebar:flex`
   - This ensures smooth swap without both showing

5. **Navigation Items (Collapsed)**
   - Icon only, centered: `justify-center p-3`
   - Tooltip on right side showing item name
   - Active state still visible via background

6. **User Footer (Collapsed)**
   - Avatar only, centered
   - NO tooltip wrapper (conflicts with dropdown)
   - Dropdown shows user info header when collapsed
   - Dropdown position: `side="right" align="start"`

7. **Mobile Behavior**
   - Separate `sidebarOpen` state for mobile slide-in
   - Backdrop overlay with blur
   - X close button in header (mobile only)
   - Menu hamburger in main content header

### Critical Implementation Notes

**DO NOT nest Tooltip inside DropdownMenuTrigger or PopoverTrigger** - causes click handling issues. Instead:
- Remove tooltip for dropdown/popover triggers when collapsed
- Add info to dropdown/popover content when collapsed

**Hover-reveal with swap pattern (collapsed):**
```tsx
// Sidebar needs group class
<aside className="group/sidebar">
  {/* Team switcher - hides on sidebar hover when collapsed */}
  <div className={cn(
    collapsed ? "lg:group-hover/sidebar:hidden" : "flex-1"
  )}>
    <TeamSwitcher collapsed={collapsed} />
  </div>
  
  {/* Expand button - shows on sidebar hover */}
  <Button className="hidden lg:hidden lg:group-hover/sidebar:flex h-10 w-10" />
</aside>
```

**Size matching is critical:**
- Team switcher collapsed: `h-10 w-10`
- Expand button: `h-10 w-10`
- No layout shift on hover swap

## Dependencies

- shadcn/ui components: `Button`, `Avatar`, `DropdownMenu`, `Popover`, `ScrollArea`, `Tooltip`
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

### Step 3: Sidebar Container with Group

```tsx
<aside
  className={cn(
    "group/sidebar fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-all duration-200 lg:relative lg:translate-x-0",
    collapsed ? "w-16" : "w-64",
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  )}
>
```

### Step 4: Header with Hover-Swap Toggle

```tsx
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
  
  {/* Collapse Toggle - shows on hover anywhere on sidebar */}
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
```

### Step 5: Team Switcher Component (NO Tooltip wrapper)

```tsx
// team-switcher.tsx
interface TeamSwitcherProps {
  collapsed?: boolean;
}

export function TeamSwitcher({ collapsed = false }: TeamSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "cursor-pointer",
            collapsed ? "h-10 w-10 p-0" : "w-full justify-between"
          )}
        >
          {collapsed ? (
            <Avatar className="h-6 w-6">
              {/* Avatar content */}
            </Avatar>
          ) : (
            <>
              <div className="flex items-center gap-2 truncate">
                <Avatar className="h-5 w-5 shrink-0">{/* ... */}</Avatar>
                <span className="truncate">{teamName}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side={collapsed ? "right" : "bottom"}>
        {/* Team list */}
      </PopoverContent>
    </Popover>
  );
}
```

### Step 6: Navigation with Tooltips

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

### Step 7: User Footer (NO Tooltip wrapper)

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

### Step 8: Mobile Backdrop & Header

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

See `assets/components/dashboard-shell.tsx` and `assets/components/team-switcher.tsx` for complete working examples.

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
- [ ] `group/sidebar` on aside element for hover detection
- [ ] Collapse button shows on hover **anywhere on sidebar**
- [ ] Team switcher and collapse button are SAME SIZE (h-10 w-10)
- [ ] Only ONE shows at a time when collapsed (swap on hover)
- [ ] NO Tooltip wrapper on Popover/Dropdown triggers
- [ ] Navigation tooltips on right when collapsed
- [ ] User info shown in dropdown header when collapsed
- [ ] Mobile has backdrop + slide animation
- [ ] Mobile header with hamburger menu
- [ ] All tooltips have zero delay
