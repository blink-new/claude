# Blog Pattern Image Generation Prompts

Use these prompts with AI image generation tools (DALL-E, Midjourney, etc.) to create consistent blog header backgrounds.

## Brand Colors

```
Primary Orange: #f97316 (hsl 24 95% 53%)
Dark Navy: #0f172a
Dark Slate: #1e293b
Dark Charcoal: #1a1a2e
Amber Accent: #f59e0b
```

## Recommended Size

- **OG Image**: 1200x630 pixels (1.91:1 ratio)
- **Blog Card**: 800x420 pixels or similar
- **Format**: PNG with transparency support

---

## Pattern 1: Grid Network

**Style**: Linear, Notion, technical grid

```
A minimalist abstract geometric pattern background in the style of Linear, 
Vercel, and Resend. Features subtle gradients from deep navy blue (#0f172a) 
to warm orange (#f97316). Clean intersecting lines forming a grid pattern 
with soft glowing nodes at intersections. Very subtle noise texture overlay. 
Modern tech aesthetic, perfect for a blog header. No text, pure abstract 
pattern. High contrast, dark theme. 1200x630 pixels.
```

**Best for**: Technical articles, comparisons, data-driven content

---

## Pattern 2: Wave Lines

**Style**: Stripe, flowing, dynamic

```
A sophisticated abstract wave pattern background inspired by Linear and 
Stripe design. Flowing curved lines in gradients of orange (#f97316) and 
amber on a dark slate background (#1e293b). Subtle mesh gradient effect 
with soft glow. Minimalist, modern, tech-forward aesthetic. Clean and 
professional, suitable for SaaS blog headers. No text, pure abstract 
pattern. 1200x630 pixels.
```

**Best for**: Guides, tutorials, process-oriented content

---

## Pattern 3: Radial Gradient

**Style**: Vercel, spotlight effect

```
A modern abstract radial gradient pattern in the style of Linear and Vercel. 
Concentric circles emanating from the bottom center, transitioning from 
deep charcoal (#1a1a2e) to warm orange (#f97316) with soft blur effects. 
Subtle dot grid overlay. Clean, minimal, professional SaaS aesthetic for 
blog headers. No text, pure abstract pattern. Dark theme with orange accent. 
1200x630 pixels.
```

**Best for**: Feature highlights, announcements, thought leadership

---

## Pattern 4: Mesh Gradient (Alternative)

**Style**: Apple, soft gradients

```
A soft mesh gradient background with organic blob shapes. Colors blend from 
deep purple (#4c1d95) through orange (#f97316) to warm amber (#fbbf24) on 
a dark background (#0f0f1a). Smooth transitions, no hard edges. Subtle 
grain texture. Modern, premium feel suitable for SaaS marketing. No text. 
1200x630 pixels.
```

**Best for**: Marketing content, premium feel

---

## Pattern 5: Isometric Grid (Alternative)

**Style**: Technical, 3D feel

```
An isometric grid pattern with subtle 3D depth. Lines in muted gray (#374151) 
on dark background (#111827) with selective orange (#f97316) highlight 
accents at key intersection points. Clean, technical, developer-focused 
aesthetic. Subtle depth perception without being distracting. No text. 
1200x630 pixels.
```

**Best for**: Developer content, technical documentation

---

## Usage Guidelines

1. **Generate 3 patterns minimum** before starting blog content
2. **Save to public folder** as `blog-pattern-{n}.png`
3. **Assign consistently** based on content type:
   - Comparisons → Pattern 1 (Grid)
   - Tutorials → Pattern 2 (Waves)
   - Announcements → Pattern 3 (Radial)

4. **Reference in frontmatter**:
```javascript
export const frontmatter = {
  // ...other fields
  image: "/blog-pattern-1.png"
};
```

---

## Regenerating Patterns

If you need project-specific colors, update the hex values in prompts:

```
Replace:
- #f97316 → Your primary color
- #0f172a → Your dark background
- #1e293b → Your secondary background
```

Keep the same style descriptions for consistency.
