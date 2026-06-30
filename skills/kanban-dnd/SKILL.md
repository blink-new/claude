---
name: kanban-dnd
description: Build world-class kanban board drag-and-drop with @dnd-kit. Linear-quality UX with proper collision detection, smooth animations, and visual feedback
---

## When to Use This Skill

Use when:
- Building a kanban/pipeline board with drag-and-drop
- Implementing card movement between columns
- Need proper collision detection that prioritizes columns over cards
- Want Linear/Notion-style drag UX with cursor-following overlay

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.x | Core DnD context and hooks |
| `@dnd-kit/modifiers` | ^9.x | Cursor snapping modifiers |
| `@dnd-kit/utilities` | ^3.x | CSS transform utilities |

## Installation

```bash
bun add @dnd-kit/core @dnd-kit/modifiers @dnd-kit/utilities
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  DndContext (sensors, collision detection, event handlers) │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Column  │  │ Column  │  │ Column  │  │ Column  │        │
│  │(droppa- │  │(droppa- │  │(droppa- │  │(droppa- │        │
│  │  ble)   │  │  ble)   │  │  ble)   │  │  ble)   │        │
│  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │  │         │        │
│  │ │Card │ │  │ │Card │ │  │ │Card │ │  │  Empty  │        │
│  │ │drag │ │  │ │drag │ │  │ │drag │ │  │         │        │
│  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │  │         │        │
│  │ ┌─────┐ │  │ ┌─────┐ │  │         │  │         │        │
│  │ │Card │ │  │ │Card │ │  │         │  │         │        │
│  │ └─────┘ │  │ └─────┘ │  │         │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
├─────────────────────────────────────────────────────────────┤
│  DragOverlay (follows cursor with snapCenterToCursor)       │
└─────────────────────────────────────────────────────────────┘
```

## Critical Patterns

### 1. Custom Collision Detection (MOST IMPORTANT)

**Problem:** Default collision detection can return card IDs when dropping on a card instead of the column ID.

**Solution:** Custom collision detection that prioritizes column droppables:

```typescript
// lib/dnd/collision-detection.ts
import {
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";

export const columnPriorityCollision: CollisionDetection = (args) => {
  // First, check pointer intersections
  const pointerCollisions = pointerWithin(args);
  
  // Filter to only column collisions (columns have data.type === 'column')
  const columnCollisions = pointerCollisions.filter(
    (collision) => collision.data?.droppableContainer?.data?.current?.type === "column"
  );

  if (columnCollisions.length > 0) {
    return columnCollisions;
  }

  // Fallback to rect intersection
  const rectCollisions = rectIntersection(args);
  const columnRectCollisions = rectCollisions.filter(
    (collision) => collision.data?.droppableContainer?.data?.current?.type === "column"
  );

  if (columnRectCollisions.length > 0) {
    return columnRectCollisions;
  }

  return rectCollisions;
};
```

### 2. Column Setup with Data Type

Columns must include `data.type` for collision detection filtering:

```typescript
const { setNodeRef } = useDroppable({
  id: column.id,
  data: {
    type: "column",  // CRITICAL: Enables collision filtering
    columnId: column.id,
  },
});
```

### 3. Card Setup with useDraggable (NOT useSortable)

For cross-column moves without within-column reordering, use `useDraggable`:

```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  isDragging,
} = useDraggable({
  id: card.id,
  data: {
    type: "card",
    card,
  },
});

// Apply to entire card for drag-anywhere behavior
<Card
  ref={setNodeRef}
  {...attributes}
  {...listeners}
  className="cursor-grab active:cursor-grabbing touch-none select-none"
>
```

### 4. Resolving Drop Target to Column ID

Handle both column drops and card drops:

```typescript
const findTargetColumnId = useCallback(
  (overId: UniqueIdentifier | undefined): string | null => {
    if (!overId) return null;
    
    const overIdStr = String(overId);
    
    // Check if it's a column ID directly
    if (columnIds.has(overIdStr)) {
      return overIdStr;
    }
    
    // Otherwise it's a card ID - find which column that card is in
    const columnId = cardColumnMap.get(overIdStr);
    return columnId || null;
  },
  [columnIds, cardColumnMap]
);
```

### 5. DragOverlay with Cursor Snapping

**Problem:** Default DragOverlay appears offset from cursor.

**Solution:** Use `snapCenterToCursor` modifier and disable drop animation:

```typescript
import { snapCenterToCursor } from "@dnd-kit/modifiers";

<DragOverlay
  modifiers={[snapCenterToCursor]}
  dropAnimation={null}  // Prevents fly-out effect on drop
>
  {activeCard ? (
    <div className="w-[272px] pointer-events-none">
      <Card card={activeCard} isDragging />
    </div>
  ) : null}
</DragOverlay>
```

### 6. Sensor Configuration — instant drag, mobile-scroll friendly

**Use a `distance` constraint, never a `delay`.** A `distance` constraint starts
the drag the instant the pointer moves a few px — dragging feels immediate, and
a plain click (no movement) still falls through to the card's `onClick`. A
`delay` constraint forces the user to *hold* before the card becomes draggable,
**and a quick flick before the delay elapses cancels the drag entirely** — the
card won't move at all. This is a very common "I can't drag unless I hold first"
bug.

```typescript
// ✅ Instant on mouse, still scrolls on touch.
// MouseSensor (mouse only) + TouchSensor (touch only) beats a single
// PointerSensor, which can't both start instantly on mouse AND let a finger
// swipe scroll the board on mobile.
const sensors = useSensors(
  useSensor(MouseSensor, {
    activationConstraint: { distance: 4 }, // drag starts after ~4px, no hold
  }),
  useSensor(TouchSensor, {
    // A short press-and-hold on touch so a vertical swipe scrolls the board
    // instead of grabbing a card. Touch is the one place a small delay is right.
    activationConstraint: { delay: 200, tolerance: 8 },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

If you don't need mobile scrolling, a single `PointerSensor` with
`{ distance: 4 }` is fine and also instant. The rule that matters: **distance,
not delay.**

### 7. Visual Feedback States

```typescript
// Board tracks active states
const [activeCard, setActiveCard] = useState<Card | null>(null);
const [activeOverColumn, setActiveOverColumn] = useState<string | null>(null);

// Pass to columns for visual feedback
<Column
  isOver={activeOverColumn === column.id}
  isDragging={!!activeCard}
/>
```

### 8. Within-Column Reordering & Sortable Columns (advanced)

The patterns above cover cross-column moves with `useDraggable`. If you also
need to **reorder cards within a column** and/or **reorder the columns
themselves**, switch to `useSortable` + nested `SortableContext` (all inside one
`DndContext`):

```typescript
<SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
  {columns.map((col) => <Column key={col.id} column={col} />)}
</SortableContext>

// Inside each Column, its cards get their own vertical context:
<SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
  {cards.map((c) => <Card key={c.id} card={c} />)}
</SortableContext>
```

In `onDragEnd`, branch on `active.data.current.type` (`"column"` vs `"card"`) to
decide whether you're reordering columns or moving a card.

**Gotcha — a sortable column is ALSO a drop target; don't register both.**
`useSortable` already makes the node droppable. If you additionally call
`useDroppable({ id: column.id })` on the same column you register **two
droppables with the same id**, which corrupts collision detection (cards stop
dropping reliably). Use `useSortable` alone — it gives you `setNodeRef` (drop
target), `attributes`/`listeners` (drag handle), and `isOver`:

```typescript
// ✅ One registration is both the card drop target and the column drag source
const { setNodeRef, attributes, listeners, transform, transition, isOver } =
  useSortable({ id: column.id, data: { type: "column", columnId: column.id } });
// ❌ Do NOT also do: useDroppable({ id: column.id })
```

**Drop indicator: a line on the hovered card, not a persistent gap.** Render a
thin insertion line on the single card the pointer is over (`isOver`), placed
above or below it based on the dragged item's index vs this card's index. Don't
rely on the sortable's shifting gap alone — a crisp line reads far better and
appears only where it's relevant.

```typescript
const { isOver, active, index } = useSortable({ id: card.id, data: { ... } });
const showIndicator = isOver && active?.id !== card.id;
let above = false, below = false;
if (showIndicator) {
  if (active?.data.current?.columnId !== card.columnId) {
    above = true; // cross-column: insert before the hovered card
  } else {
    const activeIndex = active?.data.current?.sortable?.index ?? -1;
    above = activeIndex > index;             // dragging up → line above
    below = activeIndex < index && activeIndex !== -1; // dragging down → below
  }
}
// Card root must be `relative`. Lines are absolutely positioned so DOM order
// doesn't matter:
{above && <div className="absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-primary z-10" />}
{below && <div className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary z-10" />}
// Dragged original is just dimmed in place:
className={cn("relative", isDragging && "opacity-30 z-50")}
```

**The "card reverts then snaps into place on release" flash** is almost always
a missing `dropAnimation={null}` on the `DragOverlay` (see #5). The default drop
animation flies the floating clone back to the original slot before the list
settles into the new order. Always set `dropAnimation={null}`.

**Reveal drag handles on hover — but collapse their _width_, not just their
opacity.** A persistent grip (⠿) is visual noise, so show it only on hover with
`group/col` on the column root. The trap: `opacity-0 group-hover/col:opacity-100`
alone still lays the handle out — it keeps its width *and* the flex `gap` next to
it — so the title sits permanently indented by a phantom gutter even while the
grip is invisible. (Absolutely-positioning the handle instead just moves the
problem: now it overlaps the title or hangs off the column edge.)

What you actually want:

```
idle  → [no space][Title]            handle reserves nothing, title flush
hover → [⠿ space ][Title]            handle expands in-flow, title slides right
```

Achieve it by collapsing the handle to **zero width** when idle and expanding it
on hover, and **drop the flex `gap`** on the header (a `gap` is applied even
beside a zero-width child) — let the handle own its margin so it only appears on
hover:

```tsx
{/* header: NO `gap` — the handle manages its own spacing */}
<div className="flex items-center px-1">
  <button
    {...attributes} {...listeners}
    className="flex w-0 shrink-0 items-center overflow-hidden opacity-0
               transition-all duration-150
               group-hover/col:mr-1 group-hover/col:w-4 group-hover/col:opacity-100
               cursor-grab active:cursor-grabbing touch-none"
  >
    <GripVertical className="h-4 w-4 shrink-0" />
  </button>
  <span className="font-semibold">{name}</span>
  <span className="ml-2 …">{count}</span>   {/* space the rest explicitly */}
</div>
```

Transitioning `w-0 → w-4` (plus `mr`) makes the title slide right smoothly as
the grip fades in, with the idle state perfectly flush against the cards below.

**Dragging a column? Render the WHOLE column in the overlay — with _static_ card
clones.** The overlay should preview the header *and* its cards so the user
drags a faithful copy, not just the title. But do **not** render your real
`useSortable` card component inside the overlay: the cards are still mounted in
the list, so you'd register duplicate sortable ids and corrupt measuring/
collision. Render lightweight static clones (plain divs with the card's look),
clipped to the column's max height:

```typescript
<DragOverlay dropAnimation={null}>
  {activeColumn ? (
    <div className="w-[272px] rotate-[2deg] rounded-xl border bg-muted/95 p-2.5 shadow-xl ...">
      <Header name={activeColumn.name} count={cards.length} />
      <div className="flex max-h-[440px] flex-col gap-2 overflow-hidden">
        {cards.map((c) => (
          <div key={c.id} className="rounded-lg border bg-card px-3 py-2.5">
            {c.title}            {/* static clone — NOT <SortableCard/> */}
          </div>
        ))}
      </div>
    </div>
  ) : activeCard ? (
    <Card card={activeCard} isDragging />
  ) : null}
</DragOverlay>
```

### 9. Reading column items from the cache in `onDragEnd` (gotcha)

To compute the new order on drop you often read a column's items out of a React
Query cache. **Do not reconstruct the exact query key** — the column was likely
fetched with extra params (`limit`, sort, `includeX`, …) and a hand-built key
won't match, so `getQueryData` returns `undefined` and the reorder **silently
does nothing** (a classic "drag works in some columns but not others" bug). Read
cache-key-agnostically — scan every list query and keep the ones scoped to that
column:

```typescript
// ❌ Misses the cache if the real query was { columnId, limit: 200 }
const items = queryClient.getQueryData(itemKeys.list({ columnId }));

// ✅ Match by the column field, ignore other filter params
function getColumnItems(columnId: string): Item[] {
  const byId = new Map<string, Item>();
  for (const [key, data] of queryClient.getQueriesData<Item[]>({
    queryKey: itemKeys.lists(),
  })) {
    const filters = (key as unknown[])[2] as { columnId?: string } | undefined;
    if (data && filters?.columnId === columnId) {
      for (const it of data) if (!byId.has(it.id)) byId.set(it.id, it);
    }
  }
  return [...byId.values()];
}
```

### 10. Undoable drag operations

To make drags `Cmd+Z`-able, record an inverse command on each successful
move/reorder. The non-obvious part: **a cross-column move must restore the
previous order of EVERY bucket it touched — the source AND the destination —
not just the destination.** Restoring only the destination leaves the card in
its new column, so undo *appears to do nothing*.

```typescript
// Capture the *pre-move* order of every affected bucket: the destination
// plus each source column a card moved out of.
record({
  label: "Move card",
  undo: async () => {
    for (const [columnId, order] of Object.entries(prevOrders)) {
      // Restoring a source column (whose saved order still includes the moved
      // card) sends the card home; restoring the destination drops it.
      await api.reorder({ columnId, itemIds: order });
    }
  },
  redo: async () => api.reorder({ columnId: destColumnId, itemIds: newOrder }),
});
```

Record inside the **mutation hook**, not each call site, so every entry point
(drag, keyboard shortcut, menu) becomes undoable through one place. Have
undo/redo call the API **directly** (not the recording hook) so applying history
never records new entries.

## Complete Event Handlers

```typescript
const handleDragStart = useCallback((event: DragStartEvent) => {
  const { active } = event;
  const card = cards?.find((c) => c.id === active.id);
  if (card) {
    setActiveCard(card);
    setActiveOverColumn(card.columnId);
  }
}, [cards]);

const handleDragOver = useCallback((event: DragOverEvent) => {
  const { over } = event;
  if (!over) {
    setActiveOverColumn(null);
    return;
  }
  const targetColumnId = findTargetColumnId(over.id);
  setActiveOverColumn(targetColumnId);
}, [findTargetColumnId]);

const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  
  setActiveCard(null);
  setActiveOverColumn(null);

  if (!over) return;

  const cardId = String(active.id);
  const targetColumnId = findTargetColumnId(over.id);

  if (!targetColumnId) return;

  const card = cards?.find((c) => c.id === cardId);
  if (!card || card.columnId === targetColumnId) return;

  // Optimistic update via mutation
  updateCard.mutate({
    cardId,
    data: { columnId: targetColumnId },
  });
}, [cards, findTargetColumnId, updateCard]);

const handleDragCancel = useCallback(() => {
  setActiveCard(null);
  setActiveOverColumn(null);
}, []);
```

## Styling Patterns

### Card States

```typescript
// Original card being dragged
isCurrentlyDragging && "opacity-30"

// DragOverlay card
isDragging && "shadow-xl ring-2 ring-primary/20 rotate-[1deg] cursor-grabbing"

// Entire card is draggable
"cursor-grab active:cursor-grabbing touch-none select-none"
```

### Column States

```typescript
// Column during any drag
isDragging && "bg-muted/30"

// Column being hovered
isOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
```

### Empty Column State

Render the drop placeholder **only during an active drag**. An idle empty
column must take up **no** space — don't reserve a permanent "Drag here" box;
the column's own "add" affordance is enough. Showing a persistent placeholder
is a common eyesore that makes idle boards look cluttered.

```typescript
{/* ✅ Only while a card is being dragged. Idle empty column collapses. */}
{isDragging && (
  <div className={cn(
    "rounded-lg border-2 border-dashed px-2.5 py-4 text-center",
    isOver ? "border-primary/40 bg-primary/5" : "border-border/50"
  )}>
    Drop here
  </div>
)}

{/* ❌ Don't: a permanent box that reserves space when nothing is dragging */}
// <div className="border-2 border-dashed ...">Drag items here</div>
```

## Common Mistakes to Avoid

### ❌ Using useSortable for cross-column moves

```typescript
// WRONG - useSortable is for within-list reordering
import { useSortable } from "@dnd-kit/sortable";
const { ... } = useSortable({ id: card.id });
```

### ✅ Use useDraggable for cross-column moves

```typescript
// CORRECT - useDraggable for simple drag to droppable
import { useDraggable } from "@dnd-kit/core";
const { ... } = useDraggable({ id: card.id });
```

### ❌ Assuming over.id is always a column ID

```typescript
// WRONG - over.id could be a card ID if you drop on a card
const handleDragEnd = (event) => {
  const newColumnId = over.id as string;  // Might be a card ID!
};
```

### ✅ Resolve over.id to column ID

```typescript
// CORRECT - Handle both column and card drop targets
const targetColumnId = findTargetColumnId(over.id);
```

### ❌ Using drop animation with snapCenterToCursor

```typescript
// WRONG - Causes fly-out effect on drop
<DragOverlay
  modifiers={[snapCenterToCursor]}
  dropAnimation={{ duration: 200, easing: "ease-out" }}
>
```

### ✅ Disable drop animation

```typescript
// CORRECT - Instant disappear on drop
<DragOverlay
  modifiers={[snapCenterToCursor]}
  dropAnimation={null}
>
```

### ❌ Separate drag handle

```typescript
// WRONG - Creates offset issues, worse UX
<Card>
  <div {...listeners}>
    <GripIcon /> {/* Only this area is draggable */}
  </div>
  <Content />
</Card>
```

### ✅ Entire card draggable

```typescript
// CORRECT - Linear-style drag anywhere
<Card {...listeners} {...attributes} className="cursor-grab">
  <Content />
</Card>
```

### ❌ `delay`-based activation on mouse

```typescript
// WRONG - the card only drags after a hold, and a quick flick is cancelled
useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
```

### ✅ `distance`-based activation on mouse

```typescript
// CORRECT - drag starts instantly on a few px of movement; click still works
useSensor(MouseSensor, { activationConstraint: { distance: 4 } })
```

### ❌ Reconstructing the exact query key to read column items on drop

```typescript
// WRONG - won't match a cache fetched with extra params (limit/sort/…)
const items = queryClient.getQueryData(itemKeys.list({ columnId })); // undefined
```

### ✅ Read the cache by matching the column field across all list queries

See pattern #9 (`getColumnItems`) — silently-failing reorders are almost always this.

### ❌ Registering a separate `useDroppable` on a `useSortable` column

```typescript
// WRONG - two droppables share column.id, breaking collision detection
useSortable({ id: column.id, ... });
useDroppable({ id: column.id }); // duplicate id!
```

### ❌ `KeyboardSensor` on focusable cards that also handle Enter/Space

After a mouse drag, dnd-kit leaves DOM focus on the dragged card. The
`KeyboardSensor`'s default activator is **Space/Enter**, so it treats the next
Space/Enter on that focused card as "start dragging" — pressing Enter for some
*other* shortcut accidentally re-grabs the card into a dragged state. If your
cards are focusable and your app binds Enter/Space elsewhere, drop the
`KeyboardSensor` and provide keyboard reordering via explicit shortcuts (move
up/down, defer, …) — or remap its `keyboardCodes`.

```typescript
// ✅ Mouse + touch only; no accidental Enter/Space drags
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
);
```

## Optimistic Updates with React Query

```typescript
export function useUpdateCard(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, data }) => updateCard(teamId, cardId, data),

    // Optimistic update
    onMutate: async ({ cardId, data }) => {
      await queryClient.cancelQueries({ queryKey: cardKeys.lists() });

      const previousCards = queryClient.getQueriesData<Card[]>({
        queryKey: cardKeys.lists(),
      });

      queryClient.setQueriesData<Card[]>(
        { queryKey: cardKeys.lists() },
        (old) => old?.map((card) =>
          card.id === cardId ? { ...card, ...data } : card
        )
      );

      return { previousCards };
    },

    // Rollback on error
    onError: (_err, _variables, context) => {
      context?.previousCards?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    // Refetch after settle
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
    },
  });
}
```

## File Structure

```
src/
├── components/
│   └── kanban/
│       ├── kanban-board.tsx       # DndContext wrapper
│       ├── kanban-column.tsx      # Droppable column
│       ├── kanban-card.tsx        # Draggable card
│       └── kanban-skeleton.tsx    # Loading state
├── lib/
│   └── dnd/
│       └── collision-detection.ts # Custom collision detection
└── hooks/
    └── use-cards.ts               # React Query with optimistic updates
```

## Related Asset Files

| Asset | Description |
|-------|-------------|
| `assets/lib/collision-detection.ts` | Column-priority collision detection |
| `assets/components/kanban-board.tsx` | Complete board implementation |
| `assets/components/kanban-column.tsx` | Droppable column with visual feedback |
| `assets/components/kanban-card.tsx` | Draggable card component |

## Checklist

- [ ] Installed `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/utilities`
- [ ] Sensors use a **`distance`** activation constraint, never `delay` (instant drag)
- [ ] `MouseSensor` (distance) + `TouchSensor` (delay) if the board must scroll on mobile
- [ ] Custom collision detection prioritizes columns
- [ ] Columns use `useDroppable` with `data.type: "column"` (or `useSortable` if columns reorder)
- [ ] Cards use `useDraggable` for cross-column only; `useSortable` + `SortableContext` if reordering within a column
- [ ] A `useSortable` column does NOT also register a separate `useDroppable` (duplicate id)
- [ ] `findTargetColumnId` resolves both column and card drop targets
- [ ] Column items read from the cache **cache-key-agnostically** in `onDragEnd` (not a reconstructed key)
- [ ] DragOverlay uses `snapCenterToCursor` modifier
- [ ] DragOverlay has `dropAnimation={null}` (else the card "reverts" then snaps on release)
- [ ] Within-column drop shows an insertion **line on the hovered card** (`isOver`), not a persistent gap
- [ ] Empty-column drop placeholder renders **only during a drag** — idle empty columns take up no space
- [ ] DragOverlay wrapper has fixed width matching card width
- [ ] Cards have `touch-none select-none cursor-grab` classes
- [ ] Visual feedback for `isOver` and `isDragging` states
- [ ] Optimistic updates with rollback on error
- [ ] Undoable moves restore **every** affected bucket's prior order (source + destination)
