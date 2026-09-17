import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MoreVertical, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { moveBy, usePointerDrag } from "./use-pointer-drag";

/**
 * A Claude-desktop-style list sidebar: one row per record, grouped, pinnable, reorderable,
 * renameable in place, with the same actions on a ⋮ button and on right-click.
 *
 * It is deliberately item-agnostic. Anything with an id, a title and a timestamp works —
 * conversations, sessions, documents, projects, tickets.
 */
export interface ListItem {
  id: string;
  title: string;
  updatedAt: number;
  /** Which group the row belongs to. Use one constant for a flat list. */
  group: string;
  /** Drawn at the left of the row: a status dot, an avatar, an unread marker. */
  icon?: React.ReactNode;
  /** Rows that are done with: dimmed until pointed at, hidden unless "Archived" is shown. */
  archived?: boolean;
}

export type Ordering = "recent" | "name" | "manual";
const ORDERINGS: Ordering[] = ["manual", "recent", "name"];

const PINNED = "__pinned__";
/** A group shows this many rows before "More" — a thousand records must not be a thousand nodes. */
const PAGE = 10;

/** 4h, 2d — how a row is dated. */
export function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.round(d / 30);
  return mo < 12 ? `${mo}mo` : `${Math.round(mo / 12)}y`;
}

/**
 * Persisted state, read defensively.
 *
 * localStorage throws in private mode and with a full quota, and anything can be sitting under
 * your key from an older version. A sidebar must never be the reason the app renders nothing, so
 * every read is wrapped AND shape-checked: well-formed JSON of the wrong type is the crash that
 * actually happens (`"null"` parses fine, then `null.map` takes the page down).
 */
function read<T>(key: string, fallback: T, ok: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value: unknown = JSON.parse(raw);
    return ok(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
const isArray = (v: unknown) => Array.isArray(v);
const isRecord = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v);

export function ListSidebar(props: {
  items: ListItem[];
  activeId: string | null;
  /** Label shown above the list. */
  heading?: string;
  /** Name each group. Defaults to the group key itself. */
  groupLabel?: (group: string) => string;
  /** Floating variant: rounded, bordered and shadowed, for the collapsed hover flyout. */
  overlay?: boolean;
  onSelect: (item: ListItem) => void;
  onNew: () => void;
  onNewIn?: (group: string) => void;
  onRename: (item: ListItem, title: string) => void;
  onDelete: (item: ListItem) => void;
  onArchive?: (item: ListItem, archived: boolean) => void;
  onOpenSearch?: () => void;
  /** Rendered in the header row, left of everything: a panel toggle, back/forward. */
  headerLeft?: React.ReactNode;
  /** Rendered at the bottom: account row, settings, update notice. */
  footer?: React.ReactNode;
  /** Namespace for the persisted preferences, so two sidebars can coexist. */
  storageKey?: string;
}): React.JSX.Element {
  const ns = props.storageKey ?? "list-sidebar";
  const label = props.groupLabel ?? ((g: string) => g);

  const [ordering, setOrdering] = useState<Ordering>(() =>
    read<Ordering>(`${ns}:ordering`, "manual", (v) => typeof v === "string" && ORDERINGS.includes(v as Ordering)));
  const [showArchived, setShowArchived] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() =>
    read<Record<string, boolean>>(`${ns}:collapsed-groups`, {}, isRecord));
  const [shown, setShown] = useState<Record<string, number>>({});
  const [pinned, setPinned] = useState<string[]>(() => read<string[]>(`${ns}:pinned`, [], isArray));
  const [itemOrder, setItemOrder] = useState<Record<string, string[]>>(() =>
    read<Record<string, string[]>>(`${ns}:item-order`, {}, isRecord));
  const [laneOrder, setLaneOrder] = useState<string[]>(() => read<string[]>(`${ns}:lane-order`, [], isArray));
  const rows = useRef(new Map<string, HTMLElement>());

  const persist = (key: string, value: unknown) => {
    try { localStorage.setItem(`${ns}:${key}`, JSON.stringify(value)); } catch { /* private mode, full quota */ }
  };
  const saveOrdering = (v: Ordering) => { setOrdering(v); persist("ordering", v); };
  const saveItemOrder = (lane: string, ids: string[]) => {
    const next = { ...itemOrder, [lane]: ids };
    setItemOrder(next);
    persist("item-order", next);
    // Dragging a row into place is a request for manual order.
    if (ordering !== "manual") saveOrdering("manual");
  };
  const savePinned = (ids: string[]) => { setPinned(ids); persist("pinned", ids); };

  const drag = usePointerDrag({
    onReorderItems: saveItemOrder,
    onReorderLanes: (ids) => { setLaneOrder(ids); persist("lane-order", ids); },
    onDropZone: (zone, id) => {
      if (zone !== "pin" || pinned.includes(id)) return false;   // already pinned: let it reorder
      savePinned([...pinned, id]);
      return true;
    },
  });

  const togglePin = (id: string) =>
    savePinned(pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id]);

  const sortItems = (lane: string, list: ListItem[]): ListItem[] => {
    if (ordering === "recent") return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
    if (ordering === "name") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    const ids = drag.preview?.lane === lane ? drag.preview.ids : itemOrder[lane];
    if (!ids) return list;
    return [...list].sort((a, b) => {
      const ia = ids.indexOf(a.id), ib = ids.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  };

  const visible = useMemo(
    () => props.items.filter((i) => (showArchived ? true : !i.archived)),
    [props.items, showArchived],
  );
  const pinnedItems = useMemo(
    () => pinned.map((id) => visible.find((i) => i.id === id)).filter(Boolean) as ListItem[],
    [pinned, visible],
  );
  const groups = useMemo(() => {
    const by = new Map<string, ListItem[]>();
    for (const item of visible) {
      if (pinned.includes(item.id)) continue;
      const list = by.get(item.group) ?? [];
      list.push(item);
      by.set(item.group, list);
    }
    const order = drag.lanePreview ?? laneOrder;
    return [...by.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]), ib = order.indexOf(b[0]);
      if (ia === -1 && ib === -1) return a[0].localeCompare(b[0]);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [visible, pinned, laneOrder, drag.lanePreview]);

  // Ids of deleted records would otherwise accumulate in the saved orders forever.
  useEffect(() => {
    const live = new Set(props.items.map((i) => i.id));
    if (pinned.some((id) => !live.has(id)) && props.items.length) savePinned(pinned.filter((id) => live.has(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.items]);

  /** ⌥↑ / ⌥↓ move a row, which is the only way to reorder without a pointer. */
  const onRowKeyDown = (item: ListItem, lane: string, list: ListItem[]) => (e: React.KeyboardEvent) => {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const next = moveBy(list.map((i) => i.id), item.id, e.key === "ArrowUp" ? -1 : 1);
    if (next) {
      saveItemOrder(lane, next);
      requestAnimationFrame(() => rows.current.get(item.id)?.focus());
    }
  };

  const actions = (item: ListItem, Parts: typeof DROPDOWN | typeof CONTEXT) => (
    <>
      <Parts.Item onSelect={() => setTimeout(() => setRenaming(item.id), 0)}>
        <Pencil className="size-3.5" /> Rename
      </Parts.Item>
      <Parts.Item onSelect={() => togglePin(item.id)}>
        {pinned.includes(item.id) ? <><PinOff className="size-3.5" /> Unpin</> : <><Pin className="size-3.5" /> Pin</>}
      </Parts.Item>
      {props.onArchive && (
        <Parts.Item onSelect={() => props.onArchive?.(item, !item.archived)}>
          {item.archived ? "Unarchive" : "Archive"}
        </Parts.Item>
      )}
      <Parts.Separator />
      <Parts.Item variant="destructive" onSelect={() => props.onDelete(item)}>
        <Trash2 className="size-3.5" /> Delete
      </Parts.Item>
    </>
  );

  /**
   * One row.
   *
   * The ⋮ is a SIBLING of the row button, positioned over it, not nested inside it: a button
   * inside a button is invalid HTML, and the nested one is unreachable by keyboard. Absolute
   * positioning also guarantees the row box cannot reflow when the ⋮ appears.
   */
  const Row = (item: ListItem, lane: string, list: ListItem[]) => {
    const active = item.id === props.activeId;
    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger asChild>
          <li
            data-item={item.id}
            data-lane={lane}
            onPointerDown={renaming === item.id ? undefined : drag.start("item", item.id, lane)}
            onDragStart={(e) => e.preventDefault()}
            className={`group relative flex h-7 items-center rounded-md transition-all ${
              drag.draggingItem === item.id ? "opacity-50" : ""
            } ${item.archived && !active ? "opacity-55 hover:opacity-100" : ""} ${
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {renaming === item.id ? (
              <RenameInput
                initial={item.title}
                onCancel={() => { setRenaming(null); requestAnimationFrame(() => rows.current.get(item.id)?.focus()); }}
                onSubmit={(title) => {
                  setRenaming(null);
                  props.onRename(item, title);
                  requestAnimationFrame(() => rows.current.get(item.id)?.focus());
                }}
              />
            ) : (
              <Tooltip delayDuration={600}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    ref={(el) => { if (el) rows.current.set(item.id, el); else rows.current.delete(item.id); }}
                    aria-current={active ? "true" : undefined}
                    className="flex h-7 w-full select-none items-center gap-1.5 rounded-md px-2 pr-8 text-left text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onKeyDown={onRowKeyDown(item, lane, list)}
                    onDoubleClick={(e) => { e.stopPropagation(); setRenaming(item.id); }}
                    onClick={(e) => {
                      // detail > 1 is the second click of a double-click, which is a rename, not a select.
                      if (e.detail > 1 || drag.isClickSuppressed()) return;
                      props.onSelect(item);
                    }}
                  >
                    {item.icon}
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                      {ago(item.updatedAt)}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="start" className="max-w-72">{item.title}</TooltipContent>
              </Tooltip>
            )}
            {renaming !== item.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions for ${item.title}`}
                    className="absolute right-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-background focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                {/* Radix hands focus back to the trigger on close, which blurs — and cancels — the
                    rename input that a menu item just opened. */}
                <DropdownMenuContent align="start" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
                  {actions(item, DROPDOWN)}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
          {actions(item, CONTEXT)}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const more = (lane: string, total: number) =>
    total > (shown[lane] ?? PAGE) ? (
      <button
        type="button"
        className="w-full rounded-md py-1 pl-[22px] pr-2 text-left text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => setShown((v) => ({ ...v, [lane]: (v[lane] ?? PAGE) + PAGE }))}
      >
        More
      </button>
    ) : null;

  return (
    <TooltipProvider delayDuration={600}>
      <div
        className={`flex w-60 shrink-0 flex-col bg-card ${
          props.overlay ? "h-full rounded-lg border border-border shadow-xl" : "border-r border-border"
        }`}
      >
        {props.headerLeft && (
          <div className="titlebar-drag flex h-10 shrink-0 items-center gap-0.5 px-1.5">{props.headerLeft}</div>
        )}

        {/* Quick actions. The shortcut hint appears on hover: discoverable, never noisy.
            The host app binds the keys — see AppShell. */}
        <div className="px-2 pb-1.5">
          <button
            type="button"
            onClick={props.onNew}
            className="group/b flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
              <Plus className="size-3" />
            </span>
            New
            <span className="ml-auto text-[10px] opacity-0 transition-opacity group-hover/b:opacity-100">⌘N</span>
          </button>
          {props.onOpenSearch && (
            <button
              type="button"
              onClick={props.onOpenSearch}
              className="group/b flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="flex size-4 shrink-0 items-center justify-center"><Search className="size-3.5" /></span>
              Search
              <span className="ml-auto text-[10px] opacity-0 transition-opacity group-hover/b:opacity-100">⌘K</span>
            </button>
          )}
        </div>

        {/* Section header. Controls stay hidden until hover — plus focus-within, so keyboards get them. */}
        <div className="group/hdr flex shrink-0 items-center gap-1 px-4 pb-0.5 pt-1">
          <span className="truncate text-xs text-muted-foreground">{props.heading ?? "All"}</span>
          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/hdr:opacity-100">
            <select
              aria-label="Sort"
              value={ordering}
              onChange={(e) => saveOrdering(e.target.value as Ordering)}
              className="rounded bg-transparent text-[11px] text-muted-foreground outline-none hover:text-foreground"
            >
              <option value="manual">Manual</option>
              <option value="recent">Recent</option>
              <option value="name">Name</option>
            </select>
            {props.onArchive && (
              <button
                type="button"
                className="rounded px-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? "Active" : "Archived"}
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {/*
            The Pinned section renders only when something is pinned — never injected on drag.
            A section that appears when the drag goes live pushes every row down by its own height
            (measured: 68px, 2.4 rows), so the pointer is suddenly hovering a different row than the
            one it grabbed and the drop lands two rows off. The first pin therefore comes from the
            menu; once the section exists, rows can be dragged onto it.
          */}
          {pinnedItems.length > 0 && (
            <div
              data-drop-zone="pin"
              className={`mb-3 rounded-md transition-colors ${
                drag.hotZone === "pin" && drag.draggingItem ? "bg-accent/40" : ""
              }`}
            >
              <div className="mb-0.5 mt-1 flex items-center gap-1.5 px-2 py-0.5 text-xs text-muted-foreground">
                <Pin className="size-3" /> Pinned
              </div>
              <ul role="list">{sortItems(PINNED, pinnedItems).map((i) => Row(i, PINNED, sortItems(PINNED, pinnedItems)))}</ul>
            </div>
          )}

          {groups.map(([group, list]) => {
            const isCollapsed = collapsedGroups[group];
            const ordered = sortItems(group, list);
            return (
              <div
                key={group}
                className={`group/grp mb-3 rounded-md transition-all ${drag.draggingLane === group ? "opacity-50" : ""}`}
              >
                {/* A div, not a button: the group's + is a real button and cannot be nested in one. */}
                <div
                  data-lane-header={group}
                  onPointerDown={drag.start("lane", group, group)}
                  onDragStart={(e) => e.preventDefault()}
                  className="mb-0.5 mt-1 flex select-none items-center gap-1.5 rounded pr-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() => {
                      if (drag.isClickSuppressed()) return;
                      const next = { ...collapsedGroups, [group]: !isCollapsed };
                      setCollapsedGroups(next);
                      persist("collapsed-groups", next);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-0.5 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="truncate">{label(group)}</span>
                    {/* Visible whenever the group is closed, so a collapsed group never reads as an empty one. */}
                    <ChevronDown className={`size-3 shrink-0 transition-all group-hover/grp:opacity-100 ${
                      isCollapsed ? "-rotate-90 opacity-100" : "opacity-0"
                    }`} />
                  </button>
                  {props.onNewIn && (
                    <button
                      type="button"
                      aria-label={`New in ${label(group)}`}
                      className="rounded p-0.5 opacity-0 transition-opacity hover:bg-background focus-visible:opacity-100 group-hover/grp:opacity-70 hover:!opacity-100"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => props.onNewIn?.(group)}
                    >
                      <Plus className="size-3" />
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <ul role="list">{ordered.slice(0, shown[group] ?? PAGE).map((i) => Row(i, group, ordered))}</ul>
                    {more(group, list.length)}
                  </>
                )}
              </div>
            );
          })}

          {groups.length === 0 && pinnedItems.length === 0 && (
            <div className="px-2 py-1.5 text-[13px] text-muted-foreground/70">Nothing yet. Press ⌘N to start.</div>
          )}
        </div>

        {props.footer}
      </div>
    </TooltipProvider>
  );
}

/** The dropdown and the context menu are the same shape, so one list of items renders into either. */
const DROPDOWN = { Item: DropdownMenuItem, Separator: DropdownMenuSeparator };
const CONTEXT = { Item: ContextMenuItem, Separator: ContextMenuSeparator };

function RenameInput(props: { initial: string; onSubmit: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(props.initial);
  const ref = useRef<HTMLInputElement>(null);
  // Radix can return focus to its trigger a frame after this mounts; ignore that first blur.
  const armed = useRef(false);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
    const t = setTimeout(() => { armed.current = true; }, 250);
    return () => clearTimeout(t);
  }, []);
  return (
    <input
      ref={ref}
      aria-label="Rename"
      className="mx-2 min-w-0 flex-1 rounded border border-ring bg-background px-1 py-0 text-[13px] outline-none"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={() => { if (armed.current) props.onCancel(); else ref.current?.focus(); }}
      onKeyDown={(e) => {
        e.stopPropagation();                       // ⌘K and friends must not fire while typing
        if (e.key === "Enter" && v.trim()) props.onSubmit(v.trim());
        if (e.key === "Escape") props.onCancel();
      }}
    />
  );
}
