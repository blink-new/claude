---
name: saas-sidebar
description: Build a collapsible SaaS dashboard sidebar, side nav or app shell with shadcn/ui — icon-only mode, hover-swap expand button, tooltips, mobile sheet and persisted state. Use when building or fixing dashboard navigation, or when a collapsed or minimized sidebar misbehaves: wrong hover target, hover highlighting the wrong row, icons shifting sideways, dead click areas, the sidebar not collapsing, or the collapse button in the wrong place.
---

# SaaS Collapsible Sidebar

Build a polished, collapsible sidebar using the **shadcn/ui Sidebar component system**. Covers every detail: icon-mode centering, hover-swap expand button, auto-tooltips, keyboard shortcuts, mobile Sheet, state persistence, loading skeletons.

## When to Use

- SaaS dashboard with sidebar navigation
- Collapsible/minimizable sidebar (icon-only mode)
- Responsive layout with mobile sheet overlay

**Wrong skill?** This one is for *navigation* — a fixed set of links that collapses to a 48px icon rail. If the sidebar holds *records* instead (conversations, chat history, sessions, documents, projects) with renaming, pinning, drag-to-reorder and right-click menus, use **`conversation-sidebar`**, which follows the Claude desktop pattern and disappears into a hover flyout when collapsed.

## Quick Start

```bash
npx shadcn@latest add sidebar tooltip avatar popover collapsible separator skeleton sheet
```

This generates `components/ui/sidebar.tsx` (~726 lines) with ALL sidebar primitives. Do NOT build a custom `<aside>`.

---

## Collapsed Mode: Fix These Three Before You Ship

Every one of these looks fine in the expanded sidebar and breaks in icon mode. They are the difference between a sidebar that feels finished and one that feels broken. shadcn's generated `sidebar.tsx` ships the first two; the third is on you, and its example blocks invite it.

### 1. Hidden group labels still swallow the hover

**Symptom:** collapsed, you hover an icon and nothing highlights — or the icon *above* the one you are pointing at highlights instead. Clicks land on the wrong row near section boundaries.

**Cause:** `SidebarGroupLabel` hides itself with `-mt-8 opacity-0`. An element at `opacity: 0` is still there and still takes pointer events, so an invisible 32px-tall label sits on top of the icon above it.

**Fix** — in `components/ui/sidebar.tsx`, add `pointer-events-none` to the collapsed variant:

```diff
 // components/ui/sidebar.tsx — SidebarGroupLabel
   className={cn(
-    "flex h-8 shrink-0 items-center rounded-md px-2 ... group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
+    "flex h-8 shrink-0 items-center rounded-md px-2 ... group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
     className
   )}
```

Match on the substring `group-data-[collapsible=icon]:opacity-0` — the rest of the class string differs between registry styles.

The same rule applies to anything else you fade out instead of unmounting: `opacity-0` needs `pointer-events-none` beside it, always.

### 2. `overflow-hidden` on the menu button lets the icon slide sideways

**Symptom:** collapsed, something calls `scrollIntoView()` on a label inside a nav button, or focus lands on a descendant *inside* the button, and the icon slides out of its 32px square and stays there — measured at 32px, from x=8 to x=−24. (Tab-focusing the button itself does not do it: the button is the focusable element, so nothing needs revealing.)

**Cause:** `overflow: hidden` still creates a *scroll container*. The collapsed menu button is forced to 32px wide (`size-8!`) while its flex content — a 16px icon, an 8px gap, the label, maybe a badge — is about 170px. The browser is allowed to scroll that container to bring a child into view, and it does; nothing scrolls it back. MDN is explicit: with `hidden`, "scrolling is still possible via other methods including tabbing to hidden focusable elements, properties such as `scrollLeft`, and methods like `scrollTo()`", while with `clip` "the element box is not a scroll container … programmatic scrolling is not supported" ([MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)).

**Fix** — one line, on the menu-button base:

```diff
 // sidebarMenuButtonVariants base string
-"peer/menu-button ... flex w-full items-center gap-2 overflow-hidden rounded-md p-2 ..."
+"peer/menu-button ... flex w-full items-center gap-2 overflow-hidden overflow-clip rounded-md p-2 ..."
```

Measured: with `hidden`, `button.scrollLeft = 100` sticks and a `scrollIntoView()` on the label shifts the icon 32px. With `clip`, both are refused.

Keep `overflow-hidden` in front of `overflow-clip`. On Safari 15 the `clip` declaration is invalid and dropped, and a button that falls back to `overflow: visible` is the one case that really does make the whole icon column scroll sideways (measured: `scrollWidth` 169 against a 48px rail).

Match on the substring `overflow-hidden rounded-md p-2` rather than the whole class string — registry styles differ (the `radix-nova` style inserts `group/menu-button` right after `peer/menu-button`).

**Leave `SidebarContent` alone.** Once the button clips, the rail has no horizontal overflow left to scroll — `scrollWidth === clientWidth === 48` — so there is nothing for the container fix to fix. And it would not work anyway: `overflow-x: clip` beside `overflow-y: auto` **computes to `overflow-x: hidden`** in Chromium, WebKit and Firefox alike, because `clip` only survives when the other axis is `visible` or `clip` ([MDN: overflow-x](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-x)). There is no CSS pair that scrolls vertically and forbids horizontal scrolling; the single-axis scroll container is still only an editor's draft. A plain `overflow-clip` on `SidebarContent` *does* take effect — and kills vertical scrolling, so a nav taller than the viewport becomes unreachable.

**Support:** `overflow: clip` needs Chrome/Edge 90, Firefox 81, Safari 16 and iOS Safari 16 — Baseline "widely available" since March 2025 ([webstatus.dev](https://webstatus.dev/features/overflow-clip)). The Tailwind utility is `overflow-clip`, available since v3.0.

**Focus rings are not a concern.** `hidden` and `clip` clip paint identically, so this change cannot cut off anything that `overflow-hidden` was not already cutting off, and shadcn tooltips render through a Radix portal at `<body>` level, so they are never clipped. (`overflow-clip-margin` only works with `clip`, and WebKit ignores it — do not build on it.)

### 3. The collapse control in the wrong place

**Symptom:** the toggle floats in the page header, or sits in the footer, or disappears entirely when collapsed, so people cannot get the sidebar back without the keyboard.

**Rule:** the control lives **in the sidebar header row**, and it swaps with state:

| State | Header row |
|---|---|
| Expanded | `[avatar + name ————————— collapse ‹]` — the collapse button sits at the right end of the row |
| Collapsed, idle | `[avatar]` — one 32px icon, nothing else |
| Collapsed, hovered | `[expand ›]` — the expand button **replaces** the avatar in the same square |

Two things make this feel right:

- **Swap in place.** The expand button is exactly the size of the avatar (`size-8`), so nothing moves when it appears.
- **Hide the whole trigger, not just the icon inside it.** This is the bug that produces a dead 32px hotspot: the avatar div is hidden on hover but its parent `SidebarMenuButton` (a dropdown trigger) is still there, sitting under the expand button and eating the click.

```tsx
// The header button hides itself entirely when collapsed AND hovered.
<SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:group-hover/sidebar:hidden">
  ...avatar + name...
</SidebarMenuButton>
```

### Verify it by hand

With the sidebar collapsed, on desktop:

1. Hover every icon top to bottom. Each one highlights, and the highlight is under the cursor — never one row off.
2. Hover near a section boundary. Still correct.
3. Tab from the top of the page through the whole nav. The icon column never shifts sideways.
4. Hover the header. The avatar becomes the expand button, in the same square, with no layout shift.
5. Click it. The sidebar expands. Nothing else received that click.
6. Tooltips appear only when collapsed, never when expanded.

---

## Architecture

### How the Layout Works (Dual-Div Trick)

The `Sidebar` component renders **two divs** on desktop:

```
┌──────────────────────────────────────────────┐
│ SidebarProvider (flex container, min-h-svh)   │
│                                              │
│  ┌─ Sidebar outer div ──────────────────┐    │
│  │  [Spacer div]     ← reserves width   │    │
│  │   relative w-[--sidebar-width]        │    │
│  │   (pushes SidebarInset right)         │    │
│  │                                       │    │
│  │  [Fixed div]      ← actual sidebar   │    │
│  │   fixed inset-y-0 z-10               │    │
│  │   w-[--sidebar-width]                 │    │
│  │   (contains children)                 │    │
│  └───────────────────────────────────────┘    │
│                                              │
│  ┌─ SidebarInset (main) ────────────────┐    │
│  │  flex-1 overflow-y-auto h-dvh         │    │
│  └───────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

Both divs transition width together: `transition-[width] duration-200 ease-linear`. The spacer ensures the main content never overlaps the sidebar.

### Width Constants (CSS Variables)

Set by `SidebarProvider` as inline CSS custom properties:

| State     | Variable               | Value           |
|-----------|------------------------|-----------------|
| Expanded  | `--sidebar-width`      | `16rem` (256px) |
| Collapsed | `--sidebar-width-icon` | `3rem` (48px)   |
| Mobile    | `--sidebar-width`      | `18rem` (288px) |

### State Context

```typescript
type SidebarContextProps = {
  state: "expanded" | "collapsed"  // derived from open
  open: boolean                     // true = expanded
  setOpen: (open: boolean) => void
  openMobile: boolean               // separate mobile Sheet state
  setOpenMobile: (open: boolean) => void
  isMobile: boolean                 // < 768px
  toggleSidebar: () => void         // smart: routes to mobile or desktop
}
```

Access anywhere via `useSidebar()`. Never pass `collapsed` as prop.

### Data Attribute Styling (No Prop Drilling)

The outer `Sidebar` div sets data attributes that children react to via Tailwind group selectors:

```html
<div data-state="collapsed" data-collapsible="icon" data-variant="sidebar" data-side="left">
```

Key selectors and what they do:

```css
/* Force menu buttons to 32×32px centered squares when collapsed */
group-data-[collapsible=icon]:size-8!
group-data-[collapsible=icon]:p-2!

/* Hide text labels smoothly (negative margin pulls up, opacity fades).
   pointer-events-none is required: a faded label still takes hover. */
group-data-[collapsible=icon]:-mt-8
group-data-[collapsible=icon]:pointer-events-none
group-data-[collapsible=icon]:opacity-0

/* Hard-hide sub-menus, group actions, badges when collapsed */
group-data-[collapsible=icon]:hidden

/* On the menu BUTTON, clip the label overhang: hidden would make the button a
   scroll container. The container keeps overflow-auto. See "Collapsed Mode" above. */
overflow-hidden overflow-clip
```

### Peer Coordination (Sidebar ↔ Main Content)

The sidebar outer div has `group peer`. `SidebarInset` uses peer selectors:

```tsx
// SidebarInset reacts to sidebar state for inset variant
"md:peer-data-[variant=inset]:m-2"
"md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2"
```

---

## The Centering Magic (How Icons Align Perfectly)

This is the most important detail. `SidebarMenuButton` uses CVA variants:

```typescript
const sidebarMenuButtonVariants = cva(
  // Base: flex row, gap-2, overflow-clip (NOT hidden — see "Collapsed Mode"), rounded-md, p-2
  "peer/menu-button flex w-full items-center gap-2 overflow-clip rounded-md p-2 text-left text-sm " +
  // Auto-truncate the last span (label text)
  "[&>span:last-child]:truncate " +
  // Icons: always 16×16, never shrink
  "[&>svg]:size-4 [&>svg]:shrink-0 " +
  // COLLAPSED: force to 32×32 square with centered icon.
  // Tailwind v4 registry writes important as a suffix (`size-8!`); v3 wrote it as a prefix (`!size-8`).
  "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! " +
  // Transitions on width, height, padding (not all)
  "transition-[width,height,padding] " +
  // Active state
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium",
  {
    variants: {
      size: {
        default: "h-8 text-sm",                                    // 32px — nav items
        sm: "h-7 text-xs",                                         // 28px — compact
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",     // 48px — header (workspace switcher)
      },
    },
  }
)
```

**Why everything centers when collapsed:**
- Container is `3rem` (48px) wide with `p-2` (8px each side) = 32px usable
- Button forced to `size-8!` (32px) with `p-2!` (8px padding) = icon at center
- `overflow-clip` clips any text that hasn't faded yet, without becoming a scroll container
- Icons have `[&>svg]:size-4 [&>svg]:shrink-0` = always 16×16, never compressed

**Size `"lg"` for header:**
- `h-12` (48px) gives room for two-line text (name + subtitle)
- `group-data-[collapsible=icon]:p-0!` removes padding so the 32px avatar fits cleanly

### Built-in Tooltip System

`SidebarMenuButton` has a `tooltip` prop. NO manual wrapping needed:

```tsx
<SidebarMenuButton asChild isActive={isActive} tooltip="Home">
  <Link href="/"><Home className="h-4 w-4" /><span>Home</span></Link>
</SidebarMenuButton>
```

Internally, it wraps the button in `<Tooltip>` with auto-visibility:

```tsx
<TooltipContent
  side="right"
  align="center"
  hidden={state !== "collapsed" || isMobile}  // only show when collapsed + desktop
/>
```

`TooltipProvider delayDuration={0}` is set at the `SidebarProvider` level = instant tooltips.

### The `asChild` / Slot Pattern

Every component supports `asChild` (Radix Slot). When true, it merges its props into the child element instead of rendering a wrapper. This is why this works:

```tsx
// SidebarMenuButton renders as <Link> not <button><Link>
<SidebarMenuButton asChild tooltip="Home">
  <Link href="/">...</Link>
</SidebarMenuButton>
```

---

## The Expand/Collapse Pattern

### How It Works

When collapsed, hovering **anywhere on the sidebar** swaps the header avatar for an expand button:

```
Collapsed (idle):    [OrgAvatar]                    ← icon only, 7×7
Collapsed (hover):   [ExpandBtn]                    ← replaces avatar on sidebar hover
Expanded:            [OrgSwitcher ——— CollapseBtn]  ← full row
```

### Implementation

```tsx
<Sidebar collapsible="icon" className="border-r group/sidebar">
  <SidebarHeader className="pb-0">
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-1">
        <ExpandButton />           {/* hidden → shows on sidebar hover */}
        <OrgSwitcher />            {/* avatar hides on sidebar hover when collapsed */}
        <CollapseToggle />         {/* early-returns null when collapsed */}
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
```

### ExpandButton

```tsx
function ExpandButton() {
  const { toggleSidebar, state } = useSidebar()
  if (state !== 'collapsed') return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => { e.stopPropagation(); toggleSidebar() }}
          className="hidden size-8 shrink-0 items-center justify-center rounded-md bg-accent text-foreground transition-colors group-hover/sidebar:flex hover:bg-accent/80 cursor-pointer"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">Expand sidebar</TooltipContent>
    </Tooltip>
  )
}
```

Key classes:
- `hidden group-hover/sidebar:flex` — invisible by default, appears when sidebar hovered
- `size-8` — matches the org avatar exactly, so the swap shifts nothing. Every collapsed control in the rail is 32px; do not mix in `h-7 w-7`
- `e.stopPropagation()` — prevents the click from reaching the PopoverTrigger behind it

### CollapseToggle

```tsx
function CollapseToggle() {
  const { toggleSidebar, state } = useSidebar()
  if (state !== 'expanded') return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleSidebar}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
        >
          <PanelLeftOpen className="h-4 w-4 rotate-180" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Close sidebar</TooltipContent>
    </Tooltip>
  )
}
```

Key: same `PanelLeftOpen` icon with `rotate-180` — not a separate `PanelLeftClose` icon.

### Org/Team Avatar (Hides on Hover When Collapsed)

Hide the **whole button**, not the avatar inside it. The button is the dropdown trigger; leaving it mounted under the expand button is what creates a dead click target (see "Collapsed Mode" above).

```tsx
<SidebarMenuButton
  size="lg"
  className="data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:group-hover/sidebar:hidden"
>
  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
    {initials}
  </div>
  <div className="grid flex-1 text-left leading-tight">
    <span className="truncate text-sm font-medium">{name}</span>
    <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
  </div>
  <ChevronDown className="ml-auto size-4 shrink-0 opacity-60" />
</SidebarMenuButton>
```

Notes:
- `size-8` on the avatar matches `ExpandButton` exactly, so the swap causes no layout shift.
- `grid flex-1` plus `leading-tight` keeps two lines inside the `h-12` (`size="lg"`) button.
- Hide the trigger with the CSS classes above, not a `collapsed &&` JS branch: the state is read from a cookie on the server and a JS branch flashes the wrong variant on hydration. The text *inside* the button can be rendered either way — the CVA clips it when collapsed.

---

## Navigation Items

### Standard Nav Item

```tsx
function NavItem({ href, label, icon: Icon, badge, onClick }: {
  href?: string; label: string; icon: ComponentType<{ className?: string }>
  badge?: string; onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = href ? pathname === href : false

  const content = (
    <>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {badge && (
        <span className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground/50">
          <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted/50 px-1 font-mono text-[10px]">⌘</kbd>
          <kbd className="inline-flex h-5 items-center rounded border border-border/50 bg-muted/50 px-1 font-mono text-[10px]">{badge}</kbd>
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton isActive={isActive} tooltip={label} onClick={onClick} className="cursor-pointer">
          {content}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href!}>{content}</Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
```

When collapsed: icon centers at 32×32, span truncates to invisible, badge hides (`overflow-clip` clips it), tooltip appears on hover.

### Collapsible Nested Section

```tsx
function CollapsibleSection({ label, icon: Icon, items }: { ... }) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="cursor-pointer" tooltip={label}>
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <ChevronRight className={cn(
              "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
              open && "rotate-90"
            )} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => (
              <SidebarMenuSubItem key={item.id}>
                <SidebarMenuSubButton asChild>
                  <Link href={item.href}><span className="truncate">{item.name}</span></Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
```

`SidebarMenuSub` auto-hides when collapsed: `group-data-[collapsible=icon]:hidden`. The parent button still shows as an icon-only tooltip item.

### Group Labels (Auto-Hide Trick)

```tsx
<SidebarGroup className="py-1">
  <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
    Projects
  </SidebarGroupLabel>
  <SidebarMenu>{/* items */}</SidebarMenu>
</SidebarGroup>
```

Built-in auto-hide uses `-mt-8 opacity-0 pointer-events-none` (NOT `display:none`). The `pointer-events-none` is not optional: without it the invisible label steals hover from the icon above it (see "Collapsed Mode"). Keeping the label in the DOM lets items below shift up with a smooth `transition-[margin,opacity] duration-200 ease-linear` instead of a hard jump.

### Inline Action Button (Show on Hover)

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild tooltip="Projects">
    <Link href="/projects"><FolderOpen className="h-4 w-4" /><span>Projects</span></Link>
  </SidebarMenuButton>
  <SidebarMenuAction showOnHover>
    <Plus className="h-4 w-4" />
  </SidebarMenuAction>
</SidebarMenuItem>
```

The action is positioned `absolute right-1` and uses `md:opacity-0 group-hover/menu-item:opacity-100` to appear only on hover. Auto-hidden when collapsed.

---

## Footer Widgets (Collapsed ↔ Expanded Pattern)

Footer items must gracefully transform between full content (expanded) and centered icon + tooltip (collapsed).

### Pattern: Early Return for Collapsed

```tsx
function UsageWidget() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  // Collapsed: centered icon with tooltip
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center justify-center mx-auto w-8 h-8 cursor-pointer hover:bg-accent/50 rounded-md transition-colors">
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">75% credits used</TooltipContent>
      </Tooltip>
    )
  }

  // Expanded: full widget
  return (
    <div className="mx-2 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">250 credits left</span>
        <span className="text-[10px] text-muted-foreground/60">75%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: '75%' }} />
      </div>
    </div>
  )
}
```

### User Row (Using SidebarMenuButton)

```tsx
function UserRow() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={userName} className={cn(collapsed && "flex items-center justify-center")}>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={photo} />
              <AvatarFallback className="text-[10px] bg-muted">{initial}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <span className="truncate text-sm font-medium">{userName}</span>
                <Settings className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

Uses `SidebarMenuButton tooltip=` so collapsed state gets auto-tooltip. Avatar at `size-6` fits within the `size-8!` collapsed button.

---

## Org/Team Switcher (Popover in Header)

**Critical: DO NOT wrap PopoverTrigger in Tooltip** — breaks click handling.

```tsx
function OrgSwitcher() {
  const { state } = useSidebar()
  const [open, setOpen] = useState(false)
  const collapsed = state === 'collapsed'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The WHOLE trigger hides on hover when collapsed — see "Collapsed Mode". */}
        <SidebarMenuButton
          size="lg"
          className="w-full cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:group-hover/sidebar:hidden"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate leading-tight">{orgName}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{planLabel}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={collapsed ? 'right' : 'bottom'}
        sideOffset={4}
        className="w-60 p-1"
      >
        {/* Org list items */}
        {orgs.map((org) => (
          <button
            key={org.id}
            onClick={() => switchOrg(org.id)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors w-full cursor-pointer text-sm"
          >
            <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0">
              {org.name.charAt(0)}
            </div>
            <span className="flex-1 truncate font-medium">{org.name}</span>
            {org.id === active.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
          </button>
        ))}
        <SidebarSeparator className="my-1" />
        <Link href="/settings" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer w-full">
          <Plus className="h-3.5 w-3.5" /> New workspace
        </button>
      </PopoverContent>
    </Popover>
  )
}
```

Popover `side` flips to `"right"` when collapsed so it doesn't overlap the narrow sidebar.

---

## SidebarRail (Edge Hover Toggle)

```tsx
<SidebarRail />
```

An invisible `w-4` hit area positioned at `-right-4` of the sidebar. On hover, it shows a `2px` vertical line (`hover:after:bg-sidebar-border`). Clicking toggles the sidebar. Users discover this naturally — it's a secondary toggle alongside the header buttons.

---

## Mobile Behavior

**Automatic.** The `Sidebar` component checks `useIsMobile()` (768px breakpoint) and renders:
- Desktop: `hidden md:block` with collapse animation
- Mobile: Radix `Sheet` overlay (slide-in from left, with backdrop)

`toggleSidebar()` routes to the correct behavior:

```tsx
const toggleSidebar = () => isMobile ? setOpenMobile(o => !o) : setOpen(o => !o)
```

Mobile trigger in your page header:

```tsx
<SidebarTrigger className="md:hidden" />  // PanelLeft icon, size-7 by default
```

The `useIsMobile` hook:

```tsx
const MOBILE_BREAKPOINT = 768
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])
  return !!isMobile
}
```

---

## Keyboard Shortcut

Built into `SidebarProvider`: **⌘B** (Mac) / **Ctrl+B** (Windows). No configuration needed. Calls `toggleSidebar()`.

---

## State Persistence

### localStorage (instant on mount)

```tsx
const SIDEBAR_KEY = 'sidebar_state'

const [open, setOpen] = useState(() => {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SIDEBAR_KEY)
  return stored === null ? true : stored === 'true'
})

const handleOpenChange = (value: boolean) => {
  setOpen(value)
  localStorage.setItem(SIDEBAR_KEY, String(value))
}

<SidebarProvider open={open} onOpenChange={handleOpenChange}>
```

### Cookie (SSR, set by SidebarProvider internally)

```tsx
document.cookie = `sidebar_state=${openState}; path=/; max-age=${60 * 60 * 24 * 7}`
```

---

## Loading Skeleton (Zero Layout Shift)

Match sidebar width and element sizes:

```tsx
function SidebarSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 shrink-0 border-r bg-sidebar p-3 space-y-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-muted animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-1 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  )
}
```

---

## Full Assembly

### Layout (wraps your app)

```tsx
'use client'
import { useState } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

const SIDEBAR_KEY = 'sidebar_state'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(SIDEBAR_KEY)
    return stored === null ? true : stored === 'true'
  })

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    localStorage.setItem(SIDEBAR_KEY, String(value))
  }

  return (
    <SidebarProvider open={open} onOpenChange={handleOpenChange}>
      <AppSidebar />
      <SidebarInset className="overflow-y-auto h-dvh">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
```

Note: `h-dvh` (dynamic viewport height) is better than `h-screen` on mobile Safari.

### Sidebar (all sections)

```tsx
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r group/sidebar">
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <ExpandButton />
            <OrgSwitcher />
            <CollapseToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="py-1">
          <SidebarMenu>
            <NavItem href="/dashboard" label="Home" icon={Home} />
            <NavItem label="Search" icon={Search} badge="K" onClick={openSearch} />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarMenu>
            <CollapsibleSection label="Recent" icon={Clock} items={recentItems} />
            <NavItem href="/projects" label="All projects" icon={FolderOpen} />
            <NavItem href="/starred" label="Starred" icon={Star} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0.5 pb-2">
        <SidebarSeparator />
        <UsageWidget />
        <UserRow />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
```

---

## CSS Variables (globals.css)

```css
/* Tailwind v4 — what `npx shadcn@latest add sidebar` installs today.
   Raw colour values in :root, exposed to utilities through @theme inline. No tailwind.config.ts. */
:root {
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}
.dark {
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-ring: var(--sidebar-ring);
}
```

**On Tailwind v3** there is no `@theme inline`. Use HSL triplets in `:root` and map them in `tailwind.config.ts`:

```ts
// theme.extend.colors
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",
  foreground: "hsl(var(--sidebar-foreground))",
  border: "hsl(var(--sidebar-border))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  ring: "hsl(var(--sidebar-ring))",
},
```

Check which you are on before copying: `npx shadcn@latest add sidebar` installs the v4 registry, and mixing the two leaves every sidebar colour unresolved.

---

## Critical Rules

### DO

- `collapsible="icon"` on `<Sidebar>` for icon-only collapse
- `group/sidebar` class on `<Sidebar>` for hover detection
- `useSidebar()` to read state — never prop-drill `collapsed`
- `SidebarMenuButton tooltip={label}` for auto-tooltips
- `group-data-[collapsible=icon]:` selectors for collapsed styling
- Match expand button and avatar sizes exactly (`size-8`, 32px — every control in the collapsed rail is 32px)
- `e.stopPropagation()` on expand button (prevents popover trigger)
- `PanelLeftOpen` with `rotate-180` for collapse (one icon, not two)
- `leading-tight` for multi-line text in header button
- `shrink-0` on all icons and trailing elements
- `truncate` on all text that could overflow
- `min-w-0` on flex children that contain truncated text
- `cursor-pointer` on all clickable elements
- `overflow-hidden overflow-clip` on the menu-button base, so it cannot become a scroll container
- `pointer-events-none` next to every `opacity-0` that hides something in icon mode
- Hide the whole header trigger on hover when collapsed, not the avatar inside it

### DO NOT

- Nest `Tooltip` inside `PopoverTrigger` or `DropdownMenuTrigger`
- Use `transition-all` — use specific properties (`transition-[width]`)
- Build a custom `<aside>` — use the shadcn/ui Sidebar system
- Use `w-16` (64px) for collapsed — it's `3rem` (48px) via CSS var
- Use `display:none` for group labels — use `-mt-8 opacity-0 pointer-events-none`
- Use `h-screen` — use `h-dvh` for mobile Safari compatibility
- Add `TooltipProvider` yourself — it's already in `SidebarProvider`
- Leave the collapse toggle floating in the page header — it belongs in the sidebar header row
- Fade an element out with `opacity-0` alone — it keeps its hit area and steals hover from the row above
- Put `Tooltip`-wrapped elements inside a `Popover`/`Dialog` content — Radix tooltips trigger on **focus**, not just hover. When a popover opens, focus moves into its content and auto-fires the tooltip on the first focusable element. See "Tooltip-on-Focus Gotcha" below.

---

## Tooltip-on-Focus Gotcha (Radix)

**Problem:** Radix `<Tooltip>` triggers on both hover AND focus. When you place tooltip-wrapped buttons inside a `<PopoverContent>`, opening the popover moves focus into the content, which immediately triggers the tooltip on the first focusable element — even without hovering.

**This affects any component with tooltips rendered inside:**
- `PopoverContent`
- `DialogContent`
- `SheetContent`
- Any container that receives focus on open

**Solution:** Add a `showTooltips` prop to components that contain tooltips, and disable them when used inside focus-trapping containers:

```tsx
interface ThemeToggleProps {
  showTooltips?: boolean  // default true
}

function ThemeToggle({ showTooltips = true }: ThemeToggleProps) {
  const btn = <button aria-label={label}>...</button>

  // Skip tooltip wrapper when inside popover/dialog
  if (!showTooltips) return btn

  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// Usage inside popover — tooltips disabled (label "Theme" provides context)
<PopoverContent>
  <span>Theme</span>
  <ThemeToggle showTooltips={false} />
</PopoverContent>

// Usage in header — tooltips enabled (icon-only, needs tooltip)
<ThemeToggle showTooltips={true} />
```

**Why not just increase `delayDuration`?** The delay only affects hover. Focus-triggered tooltips ignore `delayDuration` in Radix and fire immediately regardless of the delay value.

**Rule of thumb:** If a tooltip-wrapped element appears inside a focus-trapping container, either disable tooltips or ensure adjacent text labels provide sufficient context.

---

## Checklist

- [ ] `npx shadcn@latest add sidebar tooltip avatar popover collapsible separator skeleton sheet`
- [ ] CSS variables in globals.css (light + dark) + Tailwind config
- [ ] `SidebarProvider` wraps app with `open`/`onOpenChange` + localStorage
- [ ] `Sidebar collapsible="icon" className="border-r group/sidebar"`
- [ ] `ExpandButton`: `hidden group-hover/sidebar:flex`, same size as avatar
- [ ] `CollapseToggle`: `PanelLeftOpen rotate-180`, conditional render
- [ ] Header trigger (whole button): `group-data-[collapsible=icon]:group-hover/sidebar:hidden`
- [ ] `SidebarGroupLabel` has `pointer-events-none` in icon mode
- [ ] The menu-button base uses `overflow-hidden overflow-clip` (and `SidebarContent` is left on `overflow-auto`)
- [ ] Collapsed hover checked icon by icon — highlight always under the cursor
- [ ] Tab through the collapsed nav — the icon column never shifts sideways
- [ ] All nav items use `SidebarMenuButton tooltip={label}`
- [ ] Group labels use `SidebarGroupLabel` (auto-hides)
- [ ] Collapsible sections use `Collapsible` + `SidebarMenuSub`
- [ ] Footer widgets: collapsed=icon+tooltip, expanded=full content
- [ ] `SidebarRail` for edge hover toggle
- [ ] `SidebarInset className="overflow-y-auto h-dvh"`
- [ ] Loading skeleton matches sidebar width (`w-64`)
- [ ] Mobile renders as Sheet (automatic)
- [ ] Keyboard shortcut: ⌘B / Ctrl+B (automatic)
