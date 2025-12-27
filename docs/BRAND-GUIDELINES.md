# Mollei Brand Guidelines

> Design system, visual identity, and decision rationale for contributors.

---

## Brand Essence

**Mollei** — from the Latin *mollis*, meaning soft, gentle, sensitive.

Technology that approaches human emotion with care, not carelessness.

### Positioning Statement

> **For** developers, researchers, and ethicists **who** believe AI should understand human emotion without exploiting it, **Mollei** is an **open source research community** that provides transparent, auditable infrastructure for emotionally intelligent AI. **Unlike** engagement-optimized companions, **Mollei measures emotional outcomes, not time in app — and succeeds when users need it less.**

### Core Tagline

> "Open — but not careless."

---

## Visual Identity

### Logo

The Mollei logo features a celestial figure in cyan-blue, representing:
- **Elevation** — aspirational approach to emotional AI
- **Care** — gentle, human-centered design
- **Trust** — professional credibility

**Usage:**
- Full logo (mark + wordmark) in hero sections
- Mark only in favicons and small contexts
- Always include ™ symbol: **Mollei™**

### Color System (OKLCH)

We use OKLCH color space for perceptual uniformity and accessibility. OKLCH values are the **source of truth**.

All colors verified for **WCAG AA compliance** (4.5:1 minimum contrast ratio).

#### Light Mode

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--primary` | `oklch(0.58 0.15 230)` | Primary actions, links, logo |
| `--primary-foreground` | `oklch(0.98 0 0)` | Text on primary |
| `--secondary` | `oklch(0.52 0.10 240)` | Secondary elements |
| `--secondary-foreground` | `oklch(0.98 0 0)` | Text on secondary |
| `--accent` | `oklch(0.75 0.12 225)` | Highlights, hover states |
| `--accent-foreground` | `oklch(0.15 0.03 235)` | Text on accent |
| `--background` | `oklch(0.98 0.006 235)` | Page background (cool white) |
| `--foreground` | `oklch(0.18 0.03 235)` | Primary text |
| `--card` | `oklch(1 0 0)` | Card backgrounds |
| `--card-foreground` | `oklch(0.18 0.03 235)` | Card text |
| `--muted` | `oklch(0.96 0.008 235)` | Secondary backgrounds |
| `--muted-foreground` | `oklch(0.45 0.03 235)` | Secondary text |
| `--border` | `oklch(0.90 0.012 235)` | Borders, dividers |
| `--input` | `oklch(0.90 0.012 235)` | Input borders |
| `--ring` | `oklch(0.58 0.15 230)` | Focus rings |
| `--destructive` | `oklch(0.55 0.22 25)` | Error states |
| `--destructive-foreground` | `oklch(0.98 0 0)` | Text on destructive |

#### Dark Mode

Enhanced luminance values for WCAG AA compliance on dark backgrounds.

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--primary` | `oklch(0.72 0.12 230)` | Primary actions, links |
| `--primary-foreground` | `oklch(0.10 0.02 230)` | Text on primary |
| `--secondary` | `oklch(0.58 0.10 235)` | Secondary elements |
| `--secondary-foreground` | `oklch(0.95 0 0)` | Text on secondary |
| `--accent` | `oklch(0.78 0.13 220)` | Highlights |
| `--accent-foreground` | `oklch(0.10 0.02 230)` | Text on accent |
| `--background` | `oklch(0.10 0.020 240)` | Deep space with teal tint |
| `--foreground` | `oklch(0.95 0.008 225)` | Light text |
| `--card` | `oklch(0.14 0.022 238)` | Elevated surfaces |
| `--card-foreground` | `oklch(0.95 0.008 225)` | Card text |
| `--muted` | `oklch(0.18 0.022 238)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.70 0.025 230)` | Secondary text |
| `--border` | `oklch(0.26 0.025 235)` | Borders |
| `--input` | `oklch(0.20 0.022 238)` | Input backgrounds |
| `--ring` | `oklch(0.72 0.12 230)` | Focus rings |
| `--destructive` | `oklch(0.62 0.20 25)` | Error states |
| `--destructive-foreground` | `oklch(0.98 0 0)` | Text on destructive |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headlines | Geist Sans | 700 | 3rem - 3.75rem |
| Subheads | Geist Sans | 600 | 1.5rem - 2.25rem |
| Body | Geist Sans | 400 | 1rem - 1.125rem |
| Code | Geist Mono | 400 | 0.875rem |

**Fallback Stack:**
- Sans: `Geist Sans, Inter, system-ui, sans-serif`
- Mono: `Geist Mono, JetBrains Mono, monospace`

**Type Scale:** 1.25 ratio (Major Third)

### Spacing

8px base unit system:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Component padding |
| md | 16px | Standard gaps |
| lg | 24px | Section margins |
| xl | 32px | Large spacing |
| 2xl | 48px | Section padding |
| 3xl | 64px | Major sections |
| 4xl | 80px | Hero spacing |
| 5xl | 96px | Maximum breathing room |

### Border Radius

- **Default (`--radius`):** `0.75rem` (12px) — rounded but not pill-shaped
- **Small (`rounded-lg`):** `0.5rem` (8px)
- **Large (`rounded-xl`):** `0.75rem` (12px)

---

## Components

### Buttons

- Primary: Solid fill, teal background, white text
- Secondary: Border only, transparent background
- Ghost: Minimal, text-only appearance
- All buttons: 12px radius, 44px minimum touch target

### Cards

- Border-only design (no shadows) — reflects "thoughtful research" positioning
- 12px border radius (`rounded-xl`)
- Background: `--card`
- 1px border: `--border`

### Interactive States

All interactive elements follow a consistent hover pattern:

| Element | Hover State | Transition |
|---------|-------------|------------|
| Cards | `hover:border-primary/50` | 200ms |
| Icon containers | `group-hover:bg-primary/20` | 200ms |
| Links | `hover:underline` | instant |
| Destructive cards | `hover:border-destructive/40` | 200ms |

**Key Decision:** No shadow hovers. Border-only hovers create a "calm, considered response" aligned with the thoughtful research community positioning.

### Code Blocks

- Dark background (#1f2937)
- Monospace font
- 12px radius

---

## Accessibility

### WCAG Compliance

All color combinations meet **WCAG AA** standards (4.5:1 contrast ratio minimum).

| Pairing | Light Mode | Dark Mode |
|---------|------------|-----------|
| Body text on background | ~16:1 ✅ | ~15:1 ✅ |
| Muted text on background | ~6:1 ✅ | ~7:1 ✅ |
| Muted text on card | ~6:1 ✅ | ~5.5:1 ✅ |
| Primary on background | ~5:1 ✅ | ~8:1 ✅ |

### Focus States

All interactive elements have visible focus indicators:
```css
:focus-visible {
  outline: none;
  ring: 2px;
  ring-color: var(--ring);
  ring-offset: 2px;
}
```

### Motion

- Reduced motion preference respected via `prefers-reduced-motion`
- All animations disabled when user prefers reduced motion
- Default animations are subtle (opacity, transform only)

### Touch Targets

Minimum 44x44px touch targets for all interactive elements (WCAG 2.5.5).

---

## Animation

### Breathing Glow (Hero Logo)

Subtle pulsing glow effect on the hero logo:
```css
@keyframes glow-breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}
.glow-breathe {
  animation: glow-breathe 4s ease-in-out infinite;
}
```

### Fade-In Sections

Content sections fade in on scroll:
```css
.fade-in-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.fade-in-section.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## Mobile Patterns

### Safe Area Padding

Footer includes safe area inset for iOS devices:
```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Voice & Tone

### Personality

| Trait | Expression |
|-------|------------|
| **Knowledgeable** | We understand the space deeply |
| **Humble** | We're building something, not claiming to have solved it |
| **Inviting** | Everyone is welcome to participate |
| **Clear** | No jargon for jargon's sake |
| **Human** | We acknowledge the emotional weight of this work |

### Writing Principles

**Do:**
- Be direct and honest
- Acknowledge limitations
- Use accessible language
- Focus on substance over flash

**Don't:**
- Use buzzword-heavy marketing speak
- Overpromise capabilities
- Add emojis or decorative elements
- Use "AI-powered" or "revolutionary"

### Examples

| Instead of... | Write... |
|---------------|----------|
| "AI-powered emotional intelligence platform" | "Open source tools for building AI that understands how people feel" |
| "Revolutionary breakthrough" | "We're exploring what's possible" |
| "Join thousands of users" | "Join the research community" |

---

## Design Decisions (Rationale)

### Why Teal/Cyan (Not Purple or Blue)?

**Decision:** Primary color `oklch(0.58 0.15 230)` — vibrant cyan-blue

**Rationale:**
- **Purple** (common in emotional/wellness apps) feels too consumer-focused, potentially "cute"
- **Cold blue** (enterprise) lacks warmth for emotional AI context
- **Teal/Cyan** signals trust + expertise (healthcare/tech crossover) while maintaining warmth
- Derived from logo mark for visual consistency

### Why OKLCH (Not Hex)?

**Decision:** OKLCH color space as source of truth

**Rationale:**
- Perceptually uniform — consistent perceived lightness across hues
- Better for accessibility calculations (contrast ratios)
- Modern CSS support in all major browsers
- Future-proof for wide-gamut displays

### Why Hippocratic License?

**Decision:** Hippocratic License 3.0 (not MIT, Apache, GPL)

**Rationale:**
- Open source with ethical guardrails
- Explicitly prohibits emotional manipulation, surveillance, coercion
- Differentiates from "move fast and break things" AI culture
- Aligns with "open — but not careless" positioning

### Why "Success Means You Need Us Less"?

**Decision:** Anti-engagement metrics philosophy

**Rationale:**
- Industry standard (DAU) rewards addiction, distress loops
- Emotional AI should measure outcomes, not extraction
- Creates genuine differentiation vs. Character.AI, Replika
- Attracts ethically-aligned contributors

### Why No Shadows on Cards?

**Decision:** Border-only hover states, no shadow elevation

**Rationale:**
- Shadows signal "commercial product" — Mollei is a research community
- Border-only hovers create calm, considered response
- Aligns with "thoughtful research" positioning
- Reduces visual noise, increases content focus

### Why No Animated Gradients?

**Decision:** Subtle, professional aesthetics

**Rationale:**
- Avoid "typical AI startup" visual language
- Substance over flash — let content speak
- Accessible (reduced motion preference respected)
- Technical credibility through restraint

---

## Anti-Patterns

What we explicitly avoid:

| Anti-Pattern | Why We Avoid It |
|--------------|-----------------|
| Engagement-first metrics | Rewards addiction, not outcomes |
| Animated hero gradients | Hype over substance |
| "AI-powered" buzzwords | Empty marketing speak |
| Purple/pink color schemes | Too "consumer wellness" |
| Gamification elements | Streaks, badges create guilt |
| Social features | Privacy is architecture, not feature |
| Shadow-based elevation | Too commercial, reduces focus |
| Lift/transform on hover | Motion for motion's sake |

---

## Usage Guidelines

### For Contributors

1. **Colors:** Use CSS custom properties (`var(--primary)`) not raw values
2. **Typography:** Stick to the type scale, avoid custom sizes
3. **Spacing:** Use 8px multiples, prefer Tailwind classes
4. **Icons:** Lucide React library for consistency
5. **Copy:** Follow voice guidelines, keep it human
6. **Hover states:** Border-only, 200ms transitions, no shadows
7. **Accessibility:** Test with screen readers, respect reduced motion

### For External Use

- Logo available in `/assets/logo.png`
- Always include ™ symbol
- Maintain clear space around logo (minimum 16px)
- Do not alter colors or proportions

---

## Brand Assets

| Asset | Location |
|-------|----------|
| Logo (PNG) | `/assets/logo.png` |
| Color tokens | `/app/globals.css` |
| Typography | Geist Sans via `next/font` |
| Icons | Lucide React |

---

## Questions?

Open a discussion on [GitHub](https://github.com/agenisea/mollei/discussions) for brand-related questions or suggestions.

---

*Last updated: 12-26-2025*
