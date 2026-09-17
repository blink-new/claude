import { useEffect, useRef, useState } from "react";
import { PanelLeft } from "lucide-react";
import { ListSidebar, type ListItem } from "./ListSidebar";

/**
 * The shell around the sidebar: collapse, ⌘B, ⌘N, ⌘K, and the hover flyout that replaces the
 * sidebar when it is collapsed. This is the half people get wrong — the sidebar is the easy part.
 *
 * Collapsed does NOT mean an icon rail. A list sidebar has nothing to show as icons, so it leaves
 * entirely and comes back as a floating panel when the pointer reaches the left edge.
 */
const KEY = "sidebar-collapsed";
const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

export function AppShell(props: {
  items: ListItem[];
  activeId: string | null;
  onSelect: (i: ListItem) => void;
  onNew: () => void;
  onRename: (i: ListItem, title: string) => void;
  onDelete: (i: ListItem) => void;
  onOpenSearch?: () => void;
  children: React.ReactNode;
  /** Desktop app: leave room for the macOS traffic lights in the header row. */
  desktop?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(() => safeGet(KEY) === "1");
  const [peek, setPeek] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  /*
   * Close the flyout by hit-testing the pointer, not with onPointerLeave.
   *
   * The panel is `pointer-events-none` at the moment a SIBLING (the edge strip) sets `peek`, so
   * the browser never dispatches pointerover to it — and with no enter there is never a leave,
   * whatever element the handler sits on. Peek, then go straight back to the content, and the
   * panel stays up forever swallowing clicks. A pointermove test has no such blind spot.
   */
  useEffect(() => {
    if (!peek) return;
    const onMove = (e: PointerEvent) => {
      const r = panel.current?.getBoundingClientRect();
      if (!r) return;
      if (e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setPeek(false);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [peek]);

  // The write lives in an effect, never inside the state updater: a throwing localStorage there
  // takes the whole tree down mid-render.
  useEffect(() => { safeSet(KEY, collapsed ? "1" : "0"); }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "b") { e.preventDefault(); setCollapsed((v) => !v); }
      if (k === "n") { e.preventDefault(); props.onNew(); }
      if (k === "k" && props.onOpenSearch) { e.preventDefault(); props.onOpenSearch(); }
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setPeek(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onEsc);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keydown", onEsc); };
  }, [props.onNew, props.onOpenSearch]);

  const sidebar = (overlay?: boolean) => (
    <ListSidebar
      overlay={overlay}
      items={props.items}
      activeId={props.activeId}
      heading="Conversations"
      onSelect={(i) => { props.onSelect(i); if (overlay) setPeek(false); }}
      onNew={props.onNew}
      onRename={props.onRename}
      onDelete={props.onDelete}
      onOpenSearch={props.onOpenSearch}
      headerLeft={
        <button
          type="button"
          aria-label="Hide sidebar ⌘B"
          onClick={() => setCollapsed(true)}
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          // Desktop: the traffic lights own the first 76px of the title bar.
          style={props.desktop ? { marginLeft: 66 } : undefined}
        >
          <PanelLeft className="size-4" />
        </button>
      }
    />
  );

  return (
    <div className="relative flex h-dvh">
      {!collapsed && sidebar()}

      {collapsed && (
        <>
          {/* A 12px strip at the window edge is the only always-on hit area; it never covers content. */}
          <div className="absolute left-0 top-0 z-30 h-full w-3" onPointerEnter={() => setPeek(true)} />
          {/* pointer-events-none while hidden, or an invisible 240px panel swallows every click. */}
          <div
            ref={panel}
            className={`absolute left-2 top-11 z-40 h-[calc(100%-3.5rem)] w-60 transition-all duration-150 ${
              peek ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0"
            }`}
          >
            {sidebar(true)}
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {collapsed && (
          <div
            className="titlebar-drag flex h-10 shrink-0 items-center gap-1 pr-2.5"
            style={{ paddingLeft: props.desktop ? 84 : 10 }}
          >
            <button
              type="button"
              aria-label="Show sidebar ⌘B"
              onClick={() => setCollapsed(false)}
              onPointerEnter={() => setPeek(true)}
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <PanelLeft className="size-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto">{props.children}</div>
      </div>
    </div>
  );
}
