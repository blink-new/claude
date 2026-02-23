---
name: linear-design
description: Audit and fix UI/UX design quality following Linear, Vercel, and Notion standards. Covers progressive disclosure, monochrome-first color, interaction feedback, typography hierarchy, and state handling. Use when reviewing UI components, building new pages, auditing design consistency, or when the user asks for a design review.
---

# Linear-Style Design Review

Audit and fix codebase UI/UX quality. Great UI is achieved through restraint, not addition.

## Philosophy

Quality has a feeling — you can't always name it, but you know when it's there and when it's not.
The best design details are invisible: felt, not seen. Interaction smoothness, alignment precision,
transition timing matter more than any individual visual rule. Pursue "does this feel right?" before
"does this follow the rules?"

## Golden Rules

### 1. Less is more
When in doubt, remove an element before adding one. If something feels off, it's usually too much —
too much color, too much weight, too much clutter. Every element must earn its place.

### 2. Monochrome-first
Establish hierarchy through opacity and weight, not color. Color ONLY for semantic meaning:
- Error/destructive (red), success (green), active/selected state, brand accent
- No decorative color, no habitual colored icons
- Limit brand color leakage into chrome — UI should feel neutral and timeless
- Use CSS variables for dark/light mode, never hardcoded hex

### 3. One primary action per view
Each page, modal, or card gets AT MOST one `variant="default"` (primary) button. Everything else
uses secondary, outline, or ghost. Destructive actions use destructive variant + confirmation dialog.

### 4. Progressive disclosure
Resting state must be minimal. Hide until hover/focus:
- Row action buttons (edit, delete, options menu)
- Metadata and timestamps
- Secondary controls and toolbars
- Contextual menus on right-click

The UI should feel **calm at rest, powerful on interaction**.

### 5. Whitespace is the design
Generous, intentional spacing. Don't fill empty space just because it exists. Remove visual dividers
that spacing alone can replace. Sections breathe. Empty space is not wasted — it IS the design.

### 6. Every interaction has feedback
- All clickable elements: visible `hover:` and `active:` states
- No bare `<div onClick>` without visual response
- Focusable elements: `focus-visible:ring-2`
- Consistent `transition-colors duration-150`
- Care about hover timing, safe areas, transition curves — interaction physics matter

### 7. Truncate everything
- Single-line: `truncate` (+ `min-w-0` on flex parent)
- Multi-line: `line-clamp-{n}` with deliberate max
- Text never overflows its container. Titles, labels, names, descriptions — all bounded.

### 8. Handle all states
- **Loading**: Skeleton loaders mirroring real layout, never spinner in content area
- **Empty**: Title + one-line description + single CTA, never blank void
- **Error**: Human-readable message + what to do next
- **Disabled**: `opacity-50 cursor-not-allowed`, never remove the element

### 9. Use the design system
- shadcn/ui only — never reimplement Dialog, Tooltip, Dropdown, Select, Tabs, Badge, Card, Skeleton
- Lucide icons only. No emojis. No decorative AI icons (sparkles, wands, stars)
- Consistent border radius and spacing scale throughout
- CSS variables for theming, no hardcoded values

### 10. Tooltips on all icon buttons
Every icon-only button wrapped in `<Tooltip>` with a short descriptive label. No exceptions.

### 11. Typography hierarchy
- Each view: one dominant heading, one focal point, no competing visual weights
- Chrome recedes, content advances — high-contrast text/icons against quieter frame
- Design system type tokens only, no arbitrary font sizes or weights

### 12. No slop
No `console.log` in UI. No `z-[9999]`. No `!important`. No arbitrary z-index.
Consistent icon sizing within same context. Clean, professional, precise.

## Audit Output Format

For each issue:
1. File path + line
2. What's wrong (one sentence)
3. The fix

Group by: **Interactivity** → **Progressive Disclosure** → **Typography** → **Color** → **States** → **Polish**

Rank by severity: broken interactions > missing states > visual inconsistency > polish.

End with: what still needs human design judgment that code alone cannot resolve.
