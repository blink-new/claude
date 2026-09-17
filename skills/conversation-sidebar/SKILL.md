---
name: conversation-sidebar
description: Build a Claude-desktop-style list sidebar — conversations, chats, sessions, documents or projects grouped in a rail, with pinning, drag-to-reorder, inline rename, right-click menus, and a hover flyout when collapsed. Use for chat history or record lists in a web or Electron app, or when the user wants a sidebar like Claude, ChatGPT, Linear or Notion. For icon-rail SaaS dashboard navigation, use saas-sidebar instead.
---

# The list sidebar

Two different things get called "a sidebar", and they share almost no code:

| | **This skill** | **`saas-sidebar`** |
|---|---|---|
| Holds | Records: conversations, sessions, documents, projects | Navigation: Dashboard, Settings, Billing |
| Row count | Hundreds to thousands, growing | Eight to twenty, fixed |
| Rows are | Created, renamed, pinned, reordered, archived, deleted | Written once in code |
| Collapsed | Gone, and back on hover as a floating panel | A 48px icon rail |
| Built on | Your own markup plus three Radix menus | shadcn's `Sidebar` primitives |

If the user says "like Claude", "like ChatGPT", "chat history", "my sessions", or the rows are data, you are in the right place. If the rows are links to pages, use `saas-sidebar`.

## What makes this one feel expensive

The reference implementation is Claude's desktop app. Six details do the work:

1. **The row never reflows.** The relative time (`4h`, `2d`) and the `⋮` button occupy the same slot: time hides on hover, the button appears. Nothing shifts, ever.
2. **Chrome appears only when pointed at.** Section controls, the group's `+`, the chevron — all `opacity-0` until `group-hover`, plus `focus-within` so keyboards get them too, plus a `data-[state=open]` so they stay while their menu is open.
3. **Everything is renameable in place.** Double-click the title, the row becomes an input, Enter commits, Escape cancels.
4. **The same actions on the button and on right-click.** One list of menu items rendered into both a dropdown and a context menu, so there is no "which menu had Delete?".
5. **The list is yours to arrange.** Drag rows within a group, drag groups against each other, drop a row on Pinned. Order persists per user.
6. **Collapsed is not a rail.** A record list has nothing meaningful to show as icons, so the sidebar leaves entirely. The left edge and the header button bring it back as a floating panel that closes when you pick something.

## Prerequisites

**Tailwind v4 and current shadcn.** The markup uses v4-only syntax (`size-3.5`, named groups like `group/hdr`, `data-[state=open]:`), and `variant="destructive"` on menu items, which older shadcn copies do not have.

```bash
npm i lucide-react
npx shadcn@latest init -b radix -p nova -y
npx shadcn@latest add context-menu dropdown-menu tooltip -y
```

Both flags matter, and both changed recently: `-b` is the primitive library (`radix` | `base` | `aria`, **not** a colour), and `-p` is a preset (`nova` | `vega` | `maia` | `lyra` | `mira` | `luma` | `sera` | `rhea`). Omit `-p` and the CLI drops into an arrow-key prompt that hangs a non-interactive agent.

In a Vite app, set the `@` alias in **both** `vite.config.ts` (`resolve.alias`) and `tsconfig.json` (`compilerOptions.paths`) — use `paths` without `baseUrl`, which TypeScript 6 rejects.

Tokens the classes depend on, all written by `shadcn init` and all load-bearing: `--card`, `--border`, `--muted`, `--muted-foreground`, `--foreground`, `--background`, `--accent`, `--accent-foreground`, `--ring`, `--destructive`, `--popover`, `--popover-foreground`. Without `bg-card` and `border-border` the sidebar is transparent against the page.

**Two things the host app owns:**
- **⌘N, ⌘K and ⌘B are bound in `AppShell`**, not in the sidebar. The sidebar only draws the hints.
- **`.titlebar-drag`** is your CSS (below). It does nothing on the web and is required in Electron.

## The three files

| File | What it is |
|---|---|
| [assets/ListSidebar.tsx](assets/ListSidebar.tsx) | The sidebar: groups, pinned section, rows, menus, rename, paging |
| [assets/use-pointer-drag.ts](assets/use-pointer-drag.ts) | Drag-to-reorder, in 60 lines, with no library |
| [assets/AppShell.tsx](assets/AppShell.tsx) | Collapse, ⌘B, and the hover flyout |

`ListItem` is deliberately thin — `id`, `title`, `updatedAt`, `group`, optional `icon` and `archived`. Map your records onto it; do not widen it.

## Decisions worth copying

**Width is 240px (`w-60`) and does not resize.** Every extra pixel is taken from the content. If you add a resize handle, clamp it to 200–320 and persist it, but ask whether anyone will ever move it.

**Group by something the user already thinks in** — folder, project, date bucket (Today / Yesterday / Previous 7 days), status. Offer at most four groupings and remember the choice.

**Page at ten rows per group.** A "More" button beats a scrollbar into the hundreds, and it keeps the DOM small. Below about 500 visible rows you do not need virtualization; above that, use it.

**The Pinned section renders only when something is pinned.** The first pin comes from the ⋮ or right-click menu; dragging onto the section is a shortcut once it exists. Do not add a "drop here to pin" placeholder that appears when a drag starts — injecting it pushes every row down by its own height (measured: 68px, 2.4 rows), so the pointer ends up over a different row than the one it grabbed and every drop lands two rows off. It also taught nobody anything, since you had to already be performing the gesture to see the hint. If you truly want the affordance, reserve the space permanently (`h-0 overflow-hidden`, expanded absolutely during a drag) so it can never displace a row.

**Archive instead of delete.** Archived rows stay in the list at `opacity-55` and come back to full strength on hover, which says "still here, not in your way" without a second screen.

**Persist per user, not per window:** ordering, group order, row order, pinned ids, collapsed groups, the sidebar's own collapsed state. `localStorage` is right for anything a server does not need to know.

## The gotchas that cost a day each

- **HTML5 drag-and-drop does not fire in an Electron window with `webviewTag` enabled**, and never on touch. Use pointer events. `usePointerDrag` also gives you the 4px threshold that separates a click from a drag.
- **Decide the drop position by the hovered row's midpoint.** The obvious version — swap with whatever is under the cursor, skip when that is the dragged row — lands the row in the wrong place every time: it undershoots by two going down and overshoots by one going up, because the preview has already moved the row beneath the pointer. Insert before or after the hovered row depending on which half of it the pointer is in, and never early-return.
- **A drop zone must be able to decline.** If "drop here to pin" claims every drop inside its bounds, reordering *within* the pinned section silently does nothing. Let the zone return false for a row that is already there, and fall through to a normal reorder.
- **A drag ends with a click.** Without a suppression flag, releasing the mouse selects whatever row you dropped on. Set the flag when the drag goes live and clear it in a `setTimeout(…, 0)` after `pointerup`, so the click that follows is swallowed and the next one is not.
- **Reorder by reading the DOM, not by juggling indices.** `document.elementFromPoint` plus `data-item` / `data-lane` attributes gives you exactly what is under the cursor, in visual order, with no maths.
- **Rows only reorder inside their own lane.** Check `data-lane` before moving anything, or a drag across a group boundary produces nonsense.
- **`stopPropagation` on the rename input's `onKeyDown`**, or typing "k" fires the global ⌘K and "n" starts a new record.
- **Radix's menu typeahead only moves the highlight.** If you print letter shortcuts next to items, a keypress has to *click* the item, or every printed letter is a lie. Match on a `data-menu-key` attribute and call `.click()`.
- **`setTimeout(…, 0)` before entering rename from a menu item.** The menu is still closing and will steal focus back from your input.
- **A tooltip on every row needs a long delay** (600ms). At the default, dragging the pointer down the list flashes a tooltip per row. It also needs a `TooltipProvider`: current shadcn tooltips throw without one, and the thrown error unmounts the entire app — a blank white page from one missing wrapper. `ListSidebar` carries its own.
- **Never write to `localStorage` inside a state updater.** In Safari private mode and at quota, `setItem` throws, and thrown from inside `setState` it takes the tree down mid-render. Read in a try/catch, write in an effect.
- **Shape-check what you read back.** Malformed text is the easy case — `JSON.parse` throws and your catch handles it. The crash that actually ships is well-formed JSON of the wrong type: `"null"` parses happily, and the next `.map` blanks the page. Check `Array.isArray` / `typeof` against the fallback before trusting it.
- **Radix returns focus to the trigger when a menu closes**, which blurs and cancels the rename input that menu item just opened — so "Rename" from the ⋮ works from right-click and silently fails from the button. `onCloseAutoFocus={(e) => e.preventDefault()}`, and ignore the input's first blur for ~250ms.
- **A double-click fires two clicks first.** Without an `e.detail > 1` guard, double-clicking a title to rename it loads the conversation twice on the way.
- **Never nest interactive elements.** The `⋮` and the group's `+` must be siblings of the row button, not children — a button inside a button is invalid HTML and the inner one is unreachable by keyboard. Position the `⋮` absolutely; that also guarantees the row cannot reflow when it appears.
- **`opacity-0` hides a control from the keyboard too.** `hidden` / `group-hover:block` removes it from the tab order entirely. Use `opacity-0 focus-visible:opacity-100 group-hover:opacity-100` so it is reachable, and add `aria-current` to the active row.
- **Keep the chevron visible while a group is collapsed.** If it only appears on hover, a collapsed group is indistinguishable from an empty one.
- **The flyout needs `pointer-events-none` while hidden**, or an invisible 240px panel eats clicks on the content behind it.
- **Put `onPointerLeave` on the flyout panel itself.** On a zero-width wrapper it never fires, so the panel stays up forever the moment somebody peeks and then goes straight back to the content. Add Escape as a second way out.
- **Give the flyout a way in that is not the sidebar.** A 12px strip at the window edge plus the header button; a button alone is a hunt.
- **On macOS the traffic lights own the first 76px of the title bar.** Pad the header when the sidebar is collapsed, and mark the bar `-webkit-app-region: drag` with `no-drag` on its buttons, or the window cannot be moved — or its buttons cannot be clicked.

```css
/* Electron only */
.titlebar-drag { -webkit-app-region: drag; }
.titlebar-drag button,
.titlebar-drag input,
.titlebar-drag [role="button"] { -webkit-app-region: no-drag; }
```

## Web, desktop, mobile

- **Web:** drop `titlebar-drag`, the traffic-light padding and the `desktop` prop. Everything else is the same.
- **Electron:** as shipped. Keep the sidebar inside the window chrome so the flyout can overlap content.
- **Mobile:** below 768px, do not collapse to a flyout — render the same `ListSidebar` inside a full-height drawer and close it on select. The row height (`h-7`, 28px) is deliberate for a pointer; bump it to 40px for touch.

## Verify it by hand

1. Hover a row top to bottom. The `⋮` replaces the timestamp and **nothing moves**.
2. Click `⋮`. The row must not become selected.
3. Double-click a title, type, press Escape. The old title is back.
4. Rename again, press Enter, reload. The new title is still there.
5. Drag the third row to the top, reload. It is still at the top.
6. Move a row two pixels and release. It selects, and the order is unchanged.
7. Drag a row onto Pinned, reload. It is pinned.
8. Right-click a row, then open the `⋮`. Same items, same order.
9. ⌘B. The sidebar goes; the header button appears. ⌘B again brings it back.
10. Collapsed, sweep the pointer to the left edge. The panel slides in. Move away. It slides out and stops swallowing clicks.
11. Tab through the sidebar. Every row, every `⋮`, every group header is reachable, and the active row carries `aria-current`.
12. Focus a row and press ⌥↓. It moves, and keeps focus.
13. With 500 rows, each group still shows ten with a "More" — the paging is what keeps the DOM small, so no virtualization is needed.
14. Set `localStorage.setItem` to throw, then reload and press ⌘B. The app still works.
15. Put `"null"` in any of the sidebar's storage keys and reload. The sidebar falls back instead of blanking.
