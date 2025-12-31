# UI Design System

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-30-25 7:00PM PST

Design tokens, component specifications, and interaction patterns for Mollei's chat interface.

---

## Document Purpose

This document provides **copy-paste ready code** for implementing Mollei's visual design. It contains:

1. Wireframes and user flow diagrams
2. CSS custom properties (design tokens)
3. Chat interface component specifications
4. Accessibility patterns
5. Responsive breakpoints

**Relationship to Other Documents:**
- **BRAND_GUIDELINES.md** defines the rationale and constraints
- **This document** defines the implementation tokens

---

## Design Philosophy

From BRAND_GUIDELINES.md, Mollei's visual aesthetic is:

| Principle | Expression |
|-----------|------------|
| **Substance over flash** | No animated gradients, no hype visuals |
| **Calm, considered** | Border-only hovers, **no shadow elevation** |
| **Accessible** | WCAG AA compliance, reduced motion support |
| **Professional** | Research community, not consumer product |

**Critical Constraints:**
- **No shadows on cards** — borders only, creates calm response
- **No animated gradients** — avoid "typical AI startup" look
- **Teal over purple** — trust + expertise, not consumer wellness

---

## Wireframes & User Flows

### Screen Layout (MVP Chat Interface)

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                               │
│  ┌──────┐                                     ┌──────────┐  │
│  │ Logo │  Mollei                             │ Settings │  │
│  └──────┘                                     └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     MESSAGE AREA                            │
│                    (scrollable)                             │
│                                                             │
│  ┌─────────────────────────────────┐                        │
│  │ Mollei message bubble           │  ← Left-aligned        │
│  │ Border, no shadow               │                        │
│  └─────────────────────────────────┘                        │
│                          12:03 AM                           │
│                                                             │
│                        ┌─────────────────────────────────┐  │
│         Right-aligned →│ User message bubble             │  │
│                        │ Teal background                 │  │
│                        └─────────────────────────────────┘  │
│                                                    12:04 AM │
│                                                             │
│  ┌─────────────────────────────────┐                        │
│  │ Mollei message bubble           │                        │
│  │ with streaming cursor ▌         │                        │
│  └─────────────────────────────────┘                        │
│                                                             │
│  ┌───────┐                                                  │
│  │ • • • │  ← Typing indicator (when waiting)               │
│  └───────┘                                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      INPUT AREA                             │
│  ┌───────────────────────────────────────────────┐ ┌─────┐  │
│  │ Type a message...                             │ │  ➤  │  │
│  │                                               │ │     │  │
│  └───────────────────────────────────────────────┘ └─────┘  │
│           Auto-resize textarea          Send button (teal)  │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 640px)

```
┌───────────────────────────┐
│ ≡  Mollei          ⚙️     │  ← Compact header
├───────────────────────────┤
│                           │
│ ┌─────────────────────┐   │
│ │ Mollei bubble       │   │
│ │ Max-width: 85%      │   │
│ └─────────────────────┘   │
│                           │
│   ┌─────────────────────┐ │
│   │ User bubble         │ │
│   │ Max-width: 85%      │ │
│   └─────────────────────┘ │
│                           │
├───────────────────────────┤
│ ┌─────────────────┐ ┌───┐ │
│ │ Message...      │ │ ➤ │ │
│ └─────────────────┘ └───┘ │
└───────────────────────────┘
```

### User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MOLLEI USER FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  NEW USER    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐     No account needed for MVP
    │   LANDING    │     (anonymous sessions)
    │    PAGE      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   WELCOME    │     "Hi, I'm Mollei. What's on your mind?"
    │    STATE     │     Empty chat with greeting
    └──────┬───────┘
           │
           │ User types first message
           ▼
    ┌──────────────┐
    │   FIRST      │     ← Critical moment: "Memory wow"
    │   EXCHANGE   │     Goal: User feels understood in 3 messages
    └──────┬───────┘
           │
           │ Continue conversation
           ▼
    ┌──────────────┐
    │   ACTIVE     │     Streaming responses, typing indicators
    │   SESSION    │     Within-session memory active
    └──────┬───────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
    ┌──────────────┐                  ┌──────────────┐
    │   NORMAL     │                  │   CRISIS     │
    │   CLOSE      │                  │   DETECTED   │
    └──────┬───────┘                  └──────┬───────┘
           │                                 │
           │                                 ▼
           │                          ┌──────────────┐
           │                          │   CRISIS     │
           │                          │   RESOURCES  │
           │                          │   SHOWN      │
           │                          └──────┬───────┘
           │                                 │
           │◄────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │  SESSION     │     Session saved (within 30 min window)
    │   ENDS       │
    └──────┬───────┘
           │
           │
    ═══════════════════════════════════════════════════
           │
           │ User returns (within 30 min)
           ▼
    ┌──────────────┐
    │   RESUME     │     Context preserved
    │   SESSION    │     "Welcome back. You were telling me about..."
    └──────────────┘
           │
           │ User returns (after 30 min)
           ▼
    ┌──────────────┐
    │   NEW        │     Fresh session
    │   SESSION    │     (Phase 2: Cross-session memory)
    └──────────────┘
```

### Component State Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHAT INTERFACE STATES                            │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │    EMPTY    │
                              │   (Welcome) │
                              └──────┬──────┘
                                     │
                                     │ User sends message
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐     │
│    │   SENDING   │────────▶│   WAITING   │────────▶│  STREAMING  │     │
│    │             │         │  (Typing    │         │  (Response  │     │
│    │ Input       │         │  indicator) │         │  appearing) │     │
│    │ disabled    │         │             │         │             │     │
│    └─────────────┘         └─────────────┘         └──────┬──────┘     │
│                                                           │            │
│                                                           ▼            │
│                                                    ┌──────────────┐    │
│                                                    │   COMPLETE   │    │
│                                                    │  (Ready for  │    │
│                                                    │  next input) │    │
│                                                    └──────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

ERROR STATES:
                              ┌─────────────┐
           Network error ────▶│    ERROR    │
           API failure        │  (Retry     │
           Timeout            │   button)   │
                              └─────────────┘

CRISIS STATE (overlays normal flow):
                              ┌─────────────┐
           safety_monitor ───▶│   CRISIS    │
           severity ≥ 3       │  RESOURCES  │
                              │   SHOWN     │
                              └─────────────┘
                                     │
                                     │ Continues normal conversation
                                     ▼
                              (Back to COMPLETE state)


INPUT FIELD STATES:
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │  EMPTY   │───▶│  TYPING  │───▶│  VALID   │───▶│ DISABLED │         │
│  │          │    │          │    │ (can     │    │ (while   │         │
│  │ Placeholder   │ Text     │    │  send)   │    │ sending) │         │
│  │ visible  │    │ entered  │    │          │    │          │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


MESSAGE BUBBLE STATES:
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  MOLLEI MESSAGES:                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│  │ STREAMING│───▶│ COMPLETE │    │  CRISIS  │                         │
│  │ (cursor  │    │          │    │ (orange  │                         │
│  │ blinking)│    │          │    │ resources│                         │
│  └──────────┘    └──────────┘    │ attached)│                         │
│                                  └──────────┘                         │
│                                                                       │
│  USER MESSAGES:                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│  │ SENDING  │───▶│   SENT   │    │  FAILED  │                         │
│  │ (pending)│    │          │    │ (retry)  │                         │
│  └──────────┘    └──────────┘    └──────────┘                         │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Onboarding Flow (MVP - Minimal)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MVP ONBOARDING (< 5 min)                        │
└─────────────────────────────────────────────────────────────────────────┘

    Per NORTHSTAR.md: "Basic onboarding | <5 min to first meaningful exchange"

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │    STEP 1: Landing                                                  │
    │    ┌─────────────────────────────────────────────────────────────┐  │
    │    │                                                             │  │
    │    │     [Mollei Logo]                                           │  │
    │    │                                                             │  │
    │    │     "An emotionally intelligent AI companion"               │  │
    │    │                                                             │  │
    │    │     [ Start Conversation ]  ← Primary CTA                   │  │
    │    │                                                             │  │
    │    │     No account required                                     │  │
    │    │                                                             │  │
    │    └─────────────────────────────────────────────────────────────┘  │
    │                                │                                    │
    │                                ▼                                    │
    │    STEP 2: Welcome Message (Auto)                                   │
    │    ┌─────────────────────────────────────────────────────────────┐  │
    │    │                                                             │  │
    │    │     ┌───────────────────────────────────────────┐           │  │
    │    │     │ Hi, I'm Mollei. I'm here to listen.       │           │  │
    │    │     │                                           │           │  │
    │    │     │ I'm an AI, and I want to be upfront       │           │  │
    │    │     │ about that. I won't pretend to be human,  │           │  │
    │    │     │ but I will try to understand what         │           │  │
    │    │     │ you're going through.                     │           │  │
    │    │     │                                           │           │  │
    │    │     │ What's on your mind?                      │           │  │
    │    │     └───────────────────────────────────────────┘           │  │
    │    │                                                             │  │
    │    │     ┌─────────────────────────────────────┐ ┌───┐           │  │
    │    │     │ Type something...                   │ │ ➤ │           │  │
    │    │     └─────────────────────────────────────┘ └───┘           │  │
    │    │                                                             │  │
    │    └─────────────────────────────────────────────────────────────┘  │
    │                                │                                    │
    │                                ▼                                    │
    │    STEP 3: First Exchange                                           │
    │    ┌─────────────────────────────────────────────────────────────┐  │
    │    │                                                             │  │
    │    │     User types first message                                │  │
    │    │                    ▼                                        │  │
    │    │     Mollei responds with emotion acknowledgment             │  │
    │    │     (validates feeling before content)                      │  │
    │    │                    ▼                                        │  │
    │    │     User feels understood                                   │  │
    │    │                                                             │  │
    │    │     ✓ Onboarding complete - now in active session           │  │
    │    │                                                             │  │
    │    └─────────────────────────────────────────────────────────────┘  │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘

    SUCCESS CRITERIA (from NORTHSTAR.md):
    • First Session Completion: 70%+ complete 5+ exchanges
    • Memory "wow" moments: 50%+ mention memory
    • User feels understood in first 3 messages
```

---

## 1. CSS Custom Properties

Add to your global CSS (`globals.css`):

```css
:root {
  /* =========================
     COLOR TOKENS
     ========================= */

  /* Background & Surface */
  --color-background: #0a0a0a;
  --color-surface: #141414;
  --color-surface-elevated: #1a1a1a;

  /* Brand Accent (Teal/Cyan) */
  --color-accent: #14b8a6;
  --color-accent-hover: #0d9488;
  --color-accent-subtle: rgba(20, 184, 166, 0.1);
  --color-accent-muted: rgba(20, 184, 166, 0.6);

  /* Text */
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #71717a;
  --color-text-inverse: #0a0a0a;

  /* Borders (Primary interaction method - no shadows) */
  --color-border: #27272a;
  --color-border-hover: #3f3f46;
  --color-border-focus: var(--color-accent);

  /* Semantic Colors */
  --color-info: #3b82f6;
  --color-info-subtle: rgba(59, 130, 246, 0.1);
  --color-success: #22c55e;
  --color-success-subtle: rgba(34, 197, 94, 0.1);
  --color-warning: #f59e0b;
  --color-warning-subtle: rgba(245, 158, 11, 0.1);
  --color-error: #ef4444;
  --color-error-subtle: rgba(239, 68, 68, 0.1);

  /* Crisis Mode (elevated visibility) */
  --color-crisis: #f97316;
  --color-crisis-subtle: rgba(249, 115, 22, 0.15);
  --color-crisis-border: rgba(249, 115, 22, 0.4);

  /* =========================
     TYPOGRAPHY TOKENS
     ========================= */

  /* Font Families (Geist) */
  --font-display: 'Geist Sans', system-ui, -apple-system, sans-serif;
  --font-body: 'Geist Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  /* Font Sizes (Major Third Scale: 1.25) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 2rem;        /* 32px */

  /* Line Heights */
  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;

  /* =========================
     SPACING TOKENS
     ========================= */

  --space-0: 0;
  --space-1: 0.25rem;      /* 4px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */

  /* =========================
     BORDER RADIUS
     ========================= */

  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px - message bubbles */
  --radius-full: 9999px;

  /* =========================
     NO SHADOWS - Use borders instead
     Per BRAND_GUIDELINES.md
     ========================= */

  /* =========================
     TRANSITIONS & TIMING
     ========================= */

  --transition-fast: 100ms ease-out;
  --transition-base: 150ms ease-out;
  --transition-slow: 200ms ease-in-out;

  /* Animation Duration Tokens */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-deliberate: 500ms;
  --duration-generation: 300ms;    /* For AI streaming states */
  --duration-focus-enter: 400ms;   /* For focus mode transitions */

  /* Easing Functions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-emotional: cubic-bezier(0.34, 1.56, 0.64, 1);  /* For emotional state changes */

  /* =========================
     EMOTIONAL STATE TOKENS
     ========================= */

  /* Emotional glow effects for AI response states */
  --emotion-sensing-glow: oklch(0.8 0.12 180 / 0.3);   /* Teal glow during detection */
  --emotion-processing-pulse: oklch(0.72 0.15 180);    /* Active processing */
  --emotion-calm: oklch(0.75 0.08 200);                /* Peaceful state */
  --emotion-warm: oklch(0.78 0.12 80);                 /* Warmth/comfort */
  --emotion-alert: oklch(0.75 0.15 30);                /* Elevated attention */

  /* =========================
     LAYOUT
     ========================= */

  --container-chat: 48rem;     /* 768px - chat container */
  --container-narrow: 32rem;   /* 512px - message width */
  --input-height: 3.5rem;      /* 56px - chat input */

  /* =========================
     Z-INDEX
     ========================= */

  --z-base: 0;
  --z-sticky: 10;
  --z-input: 20;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-crisis-banner: 60;
}

/* Light mode (optional - dark is primary) */
@media (prefers-color-scheme: light) {
  :root {
    --color-background: #fafafa;
    --color-surface: #ffffff;
    --color-surface-elevated: #f4f4f5;
    --color-text-primary: #18181b;
    --color-text-secondary: #52525b;
    --color-text-muted: #a1a1aa;
    --color-border: #e4e4e7;
    --color-border-hover: #d4d4d8;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-fast: 0ms;
    --transition-base: 0ms;
    --transition-slow: 0ms;
  }
}
```

---

## 2. Chat Interface Components

### 2.1 Message Container

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: var(--container-chat);
  margin: 0 auto;
  background-color: var(--color-background);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  scroll-behavior: smooth;
}

/* Scroll to bottom smoothly */
@media (prefers-reduced-motion: reduce) {
  .chat-messages {
    scroll-behavior: auto;
  }
}
```

### 2.2 Message Bubbles

```css
/* Base message */
.message {
  display: flex;
  flex-direction: column;
  max-width: var(--container-narrow);
  margin-bottom: var(--space-4);
  animation: message-appear 200ms ease-out;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }
}

/* User message (right-aligned) */
.message-user {
  align-self: flex-end;
  align-items: flex-end;
}

.message-user .message-bubble {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--radius-2xl) var(--radius-2xl) var(--radius-sm) var(--radius-2xl);
}

/* Mollei message (left-aligned) */
.message-mollei {
  align-self: flex-start;
  align-items: flex-start;
}

.message-mollei .message-bubble {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm);
}

/* Bubble content */
.message-bubble {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  word-wrap: break-word;
}

/* Timestamp */
.message-timestamp {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
  padding: 0 var(--space-2);
}
```

### 2.3 Typing Indicator

```css
.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm);
  max-width: fit-content;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-text-muted);
  border-radius: var(--radius-full);
  animation: typing-pulse 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-pulse {
  0%, 60%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  30% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing-dot {
    animation: none;
    opacity: 0.6;
  }
}
```

### 2.4 Chat Input

```css
.chat-input-container {
  position: sticky;
  bottom: 0;
  padding: var(--space-4);
  background-color: var(--color-background);
  border-top: 1px solid var(--color-border);
  z-index: var(--z-input);
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  max-width: var(--container-chat);
  margin: 0 auto;
}

.chat-input {
  flex: 1;
  min-height: var(--input-height);
  max-height: 200px;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
  resize: none;
  transition: border-color var(--transition-base);
}

.chat-input::placeholder {
  color: var(--color-text-muted);
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Send button */
.chat-send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--input-height);
  height: var(--input-height);
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-base);
}

.chat-send-button:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.chat-send-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.chat-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 2.5 Streaming Response State

```css
/* Streaming indicator on message */
.message-streaming .message-bubble::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: var(--color-accent);
  margin-left: var(--space-1);
  animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .message-streaming .message-bubble::after {
    animation: none;
    opacity: 0.7;
  }
}
```

---

## 3. Crisis Mode Components

When safety_monitor detects crisis (severity ≥ 3), the UI shifts to crisis mode.

### 3.1 Crisis Resource Card

```css
.crisis-resources {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background-color: var(--color-crisis-subtle);
  border: 1px solid var(--color-crisis-border);
  border-radius: var(--radius-lg);
}

.crisis-resources-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-crisis);
  margin-bottom: var(--space-3);
}

.crisis-resources-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.crisis-resource-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: border-color var(--transition-base);
}

.crisis-resource-link:hover {
  border-color: var(--color-crisis-border);
}

.crisis-resource-link:focus-visible {
  outline: 2px solid var(--color-crisis);
  outline-offset: 2px;
}
```

---

## 4. Empty & Loading States

### 4.1 Error States

```css
/* Error container */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  text-align: center;
}

.error-state-icon {
  width: 48px;
  height: 48px;
  color: var(--color-error);
  margin-bottom: var(--space-4);
}

.error-state-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.error-state-message {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 32ch;
  margin-bottom: var(--space-4);
}

/* Retry button */
.retry-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: border-color var(--transition-base);
  min-height: 44px; /* Touch target */
  min-width: 44px;
}

.retry-button:hover {
  border-color: var(--color-border-hover);
}

.retry-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Inline message error (failed to send) */
.message-failed {
  opacity: 0.7;
}

.message-failed .message-bubble {
  border-color: var(--color-error);
}

.message-retry-inline {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-error);
}

.message-retry-inline button {
  padding: var(--space-1) var(--space-2);
  background: transparent;
  color: var(--color-accent);
  border: none;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  cursor: pointer;
  text-decoration: underline;
  min-height: 44px; /* Touch target */
}

.message-retry-inline button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### 4.2 Welcome State

```css
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  height: 100%;
}

.chat-welcome-icon {
  width: 64px;
  height: 64px;
  color: var(--color-accent);
  margin-bottom: var(--space-4);
}

.chat-welcome-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.chat-welcome-subtitle {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  max-width: 32ch;
  line-height: var(--leading-relaxed);
}
```

### 4.2 Skeleton Loader

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.skeleton {
  background-color: var(--color-border);
  border-radius: var(--radius-md);
  animation: skeleton-pulse 2s ease-in-out infinite;
}

.skeleton-message {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: var(--container-narrow);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
}

.skeleton-line {
  height: var(--space-4);
  background-color: var(--color-border);
  border-radius: var(--radius-sm);
}

.skeleton-line:last-child {
  width: 60%;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    opacity: 0.5;
  }
}
```

### 4.4 Session Resume State

When a user returns within the session window (30 minutes), show context continuity:

```css
/* Session resume banner */
.session-resume {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-accent-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.session-resume-icon {
  width: 20px;
  height: 20px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.session-resume-text {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.session-resume-text strong {
  color: var(--color-text-primary);
  font-weight: var(--font-medium);
}

/* Dismiss button (optional) */
.session-resume-dismiss {
  margin-left: auto;
  padding: var(--space-1);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.session-resume-dismiss:hover {
  color: var(--color-text-secondary);
}

.session-resume-dismiss:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Example Usage:**
```html
<div class="session-resume" role="status" aria-live="polite">
  <svg class="session-resume-icon" aria-hidden="true"><!-- Clock icon --></svg>
  <p class="session-resume-text">
    <strong>Welcome back.</strong> You were telling me about your conversation with your manager.
  </p>
  <button class="session-resume-dismiss" aria-label="Dismiss">
    <svg aria-hidden="true"><!-- X icon --></svg>
  </button>
</div>
```

### 4.5 Streaming UI Patterns (Emotional Detection Feedback)

Visual feedback during AI emotional detection and response generation.

```css
/* =========================
   KEYFRAME ANIMATIONS
   ========================= */

/* Shimmer sweep for skeleton loading */
@keyframes shimmer-sweep {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Emotional sensing pulse - glowing border during detection */
@keyframes emotion-sensing-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--emotion-sensing-glow);
  }
  50% {
    box-shadow: 0 0 0 4px var(--emotion-sensing-glow);
  }
}

/* Content reveal - fade in with subtle slide */
@keyframes content-reveal {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Heartbeat pulse for active emotional processing */
@keyframes heartbeat-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

/* =========================
   STREAMING STATE CLASSES
   ========================= */

/* Container for streaming response with sensing indicator */
.streaming-response {
  position: relative;
  animation: emotion-sensing-pulse 2s ease-in-out infinite;
  border-radius: var(--radius-2xl);
}

.streaming-response.complete {
  animation: none;
  box-shadow: none;
}

/* Phase indicator during emotional detection */
.sensing-phase {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-accent-subtle);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.sensing-phase-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
  animation: heartbeat-pulse 1.5s ease-in-out infinite;
}

.sensing-phase-text {
  font-style: italic;
}

/* Content reveal animation for streamed content */
.message-content-reveal {
  animation: content-reveal var(--duration-generation) var(--ease-out);
}

/* Staggered reveal for multiple elements */
.staggered-reveal > *:nth-child(1) { animation-delay: 0ms; }
.staggered-reveal > *:nth-child(2) { animation-delay: 80ms; }
.staggered-reveal > *:nth-child(3) { animation-delay: 160ms; }
.staggered-reveal > *:nth-child(4) { animation-delay: 240ms; }

/* Enhanced skeleton with emotional state theming */
.skeleton-emotional {
  background: linear-gradient(
    90deg,
    var(--color-accent-subtle) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    var(--color-accent-subtle) 100%
  );
  background-size: 200% 100%;
  animation: shimmer-sweep 1.8s ease-in-out infinite;
  border-radius: var(--radius-md);
}

/* Reduced motion: disable all streaming animations */
@media (prefers-reduced-motion: reduce) {
  .streaming-response,
  .sensing-phase-icon,
  .message-content-reveal,
  .skeleton-emotional {
    animation: none;
  }

  .streaming-response {
    box-shadow: none;
    border: 1px solid var(--color-accent);
  }
}
```

**React Component Example:**

```tsx
// components/chat/streaming-response.tsx
interface StreamingResponseProps {
  phase: 'sensing' | 'processing' | 'generating' | 'complete'
  children: React.ReactNode
}

const PHASE_MESSAGES = {
  sensing: 'Sensing your feelings...',
  processing: 'Understanding context...',
  generating: 'Crafting a response...',
  complete: '',
} as const

export function StreamingResponse({ phase, children }: StreamingResponseProps) {
  const isActive = phase !== 'complete'

  return (
    <div
      className={cn('streaming-response', !isActive && 'complete')}
      aria-busy={isActive}
      aria-live="polite"
    >
      {isActive && (
        <div className="sensing-phase" role="status">
          <HeartPulseIcon className="sensing-phase-icon" aria-hidden="true" />
          <span className="sensing-phase-text">{PHASE_MESSAGES[phase]}</span>
        </div>
      )}
      <div className={cn(phase === 'complete' && 'message-content-reveal')}>
        {children}
      </div>
    </div>
  )
}
```

---

## 5. Accessibility Patterns

### 5.1 Focus States

```css
/* Consistent focus ring - no shadows, use outline */
.focus-ring:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: var(--space-4);
}
```

### 5.2 Touch Target Guidelines

Per WCAG 2.1 Success Criterion 2.5.5, all interactive elements must have a minimum touch target of **44×44 CSS pixels**.

```css
/* Touch target utility - apply to clickable elements */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* For icon-only buttons, ensure proper hit area */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-2);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base);
}

.icon-button:hover {
  background-color: var(--color-surface-elevated);
}

.icon-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Spacing between adjacent touch targets */
.touch-target-group {
  display: flex;
  gap: var(--space-2); /* 8px minimum between targets */
}
```

**Critical Touch Target Elements:**
| Element | Minimum Size | Notes |
|---------|--------------|-------|
| Send button | 44×44px | Circular, high-priority action |
| Settings button | 44×44px | Icon button in header |
| Menu button (mobile) | 44×44px | Hamburger icon |
| Retry button | 44×44px | Error recovery action |
| Crisis resource links | 44×44px | Safety-critical, must be easy to tap |
| Dismiss buttons | 44×44px | Toast/banner dismissal |

### 5.3 Screen Reader Utilities

```css
/* Visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Live region for announcements */
.live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

### 5.4 ARIA Patterns

```html
<!-- Skip link for keyboard users -->
<a href="#chat-input" class="skip-link">Skip to message input</a>

<!-- Chat container -->
<main role="main" aria-label="Chat with Mollei">

  <!-- Session resume banner (when applicable) -->
  <div role="status" aria-live="polite" class="session-resume">
    <p>Welcome back. You were telling me about your conversation with your manager.</p>
  </div>

  <!-- Message list -->
  <div
    role="log"
    aria-live="polite"
    aria-label="Conversation"
    aria-relevant="additions"
  >
    <!-- User message -->
    <article aria-label="Your message" class="message message-user">
      <div class="message-bubble">Message content...</div>
      <time class="message-timestamp" datetime="2025-01-15T02:03:00">2:03 AM</time>
    </article>

    <!-- Mollei message -->
    <article aria-label="Mollei's response" class="message message-mollei">
      <div class="message-bubble">Response content...</div>
      <time class="message-timestamp" datetime="2025-01-15T02:04:00">2:04 AM</time>
    </article>

    <!-- Mollei message with memory callback -->
    <article aria-label="Mollei's response" class="message message-mollei">
      <div class="message-bubble">
        <span class="memory-callback" aria-label="Recalling previous conversation">
          You mentioned last week that...
        </span>
        Rest of message...
      </div>
    </article>

    <!-- Failed message -->
    <article aria-label="Your message, failed to send" class="message message-user message-failed">
      <div class="message-bubble">Failed message...</div>
      <div class="message-retry-inline" role="alert">
        <span>Failed to send.</span>
        <button type="button">Retry</button>
      </div>
    </article>
  </div>

  <!-- Typing indicator -->
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="typing-indicator-container"
  >
    <div class="typing-indicator" aria-hidden="true">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
    <span class="sr-only">Mollei is typing...</span>
  </div>

  <!-- Streaming response indicator -->
  <div
    role="status"
    aria-live="polite"
    class="streaming-status"
  >
    <span class="sr-only">Mollei is responding...</span>
  </div>

  <!-- Input -->
  <form role="form" aria-label="Send a message" id="chat-input">
    <label for="message-input" class="sr-only">Message to Mollei</label>
    <textarea
      id="message-input"
      aria-label="Message to Mollei"
      aria-describedby="input-hint"
      placeholder="Type a message..."
    ></textarea>
    <span id="input-hint" class="sr-only">Press Enter to send, Shift+Enter for new line</span>
    <button type="submit" aria-label="Send message">
      <svg aria-hidden="true"><!-- Send icon --></svg>
    </button>
  </form>
</main>

<!-- Crisis resources (when shown) -->
<aside
  role="complementary"
  aria-label="Crisis support resources"
  aria-live="assertive"
>
  <h2 id="crisis-heading">You're not alone</h2>
  <ul aria-labelledby="crisis-heading">
    <li>
      <a href="tel:988" aria-label="Call 988 Suicide and Crisis Lifeline">
        988 Suicide & Crisis Lifeline
      </a>
    </li>
    <li>
      <a href="sms:741741" aria-label="Text HOME to 741741 for Crisis Text Line">
        Crisis Text Line: Text HOME to 741741
      </a>
    </li>
  </ul>
</aside>

<!-- AI transparency indicator (always visible) -->
<div class="ai-indicator" role="note" aria-label="This is an AI companion">
  <svg aria-hidden="true"><!-- AI icon --></svg>
  <span>AI Companion</span>
</div>

<!-- Toast notifications container -->
<div
  role="region"
  aria-label="Notifications"
  aria-live="polite"
  class="toast-container"
>
  <!-- Toasts inserted here -->
</div>
```

---

## 6. Responsive Breakpoints

### 6.1 Breakpoint Scale

| Name | Width | Use Case |
|------|-------|----------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |

### 6.2 Responsive Chat Layout

```css
/* Mobile-first chat layout */
.chat-container {
  padding: 0;
}

.chat-messages {
  padding: var(--space-3);
}

.message-bubble {
  max-width: 85%;
}

/* Tablet and up */
@media (min-width: 640px) {
  .chat-messages {
    padding: var(--space-4) var(--space-6);
  }

  .message-bubble {
    max-width: 70%;
  }

  .chat-input-container {
    padding: var(--space-4) var(--space-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .chat-messages {
    padding: var(--space-6) var(--space-8);
  }

  .message-bubble {
    max-width: 60%;
  }
}
```

---

## 7. Icon Set

Using **Lucide** for consistency with calm, outlined aesthetic.

| Purpose | Icon | Usage |
|---------|------|-------|
| Send | `Send` | Chat input submit |
| Close | `X` | Dismiss modals, toasts, settings |
| Menu | `Menu` | Mobile hamburger navigation |
| Settings | `Settings` | Settings panel trigger |
| Alert | `AlertCircle` | Crisis indicator |
| Phone | `Phone` | Crisis hotline |
| External | `ExternalLink` | Resource links |
| Check | `Check` | Message sent, success toast |
| Loader | `Loader2` | Loading state |
| Brain | `Brain` | Memory callback indicator |
| Bot | `Bot` | AI transparency indicator |
| Clock | `Clock` | Session resume indicator |
| RefreshCw | `RefreshCw` | Retry action |
| Info | `Info` | Info toast |
| AlertTriangle | `AlertTriangle` | Warning/confirmation |
| ChevronDown | `ChevronDown` | Dropdown selector |

```css
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
```

---

## 8. Header & Navigation

### 8.1 Desktop Header

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-logo-icon {
  width: 32px;
  height: 32px;
  color: var(--color-accent);
}

.header-logo-text {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Settings button */
.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.settings-button:hover {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}

.settings-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### 8.2 Mobile Header

```css
/* Mobile header (< 640px) */
@media (max-width: 639px) {
  .header {
    padding: var(--space-2) var(--space-3);
  }

  .header-logo-text {
    font-size: var(--text-base);
  }
}

/* Hamburger menu button */
.menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

@media (max-width: 639px) {
  .menu-button {
    display: flex;
  }
}

.menu-button:hover {
  color: var(--color-text-primary);
}

.menu-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Hamburger icon animation */
.hamburger {
  width: 20px;
  height: 14px;
  position: relative;
}

.hamburger-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  transition: transform var(--transition-base), opacity var(--transition-base);
}

.hamburger-line:nth-child(1) { top: 0; }
.hamburger-line:nth-child(2) { top: 6px; }
.hamburger-line:nth-child(3) { top: 12px; }

/* Open state */
.menu-button[aria-expanded="true"] .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.menu-button[aria-expanded="true"] .hamburger-line:nth-child(2) {
  opacity: 0;
}

.menu-button[aria-expanded="true"] .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

@media (prefers-reduced-motion: reduce) {
  .hamburger-line {
    transition: none;
  }
}
```

### 8.3 Settings Panel

```
┌─────────────────────────────────────────────────────────────┐
│                     SETTINGS PANEL                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Settings                                    [X]       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  APPEARANCE                                           │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Theme                          [Dark ▾]         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ACCESSIBILITY                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Reduce motion                  [Toggle: Off]    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Larger text                    [Toggle: Off]    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ABOUT                                                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Mollei is an AI companion. Always honest about  │  │  │
│  │  │ being AI. ℹ️ Learn more                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  Version 0.1.0                                        │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

```css
/* Settings panel (modal) */
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 400px;
  height: 100%;
  background-color: var(--color-background);
  border-left: 1px solid var(--color-border);
  z-index: var(--z-modal);
  transform: translateX(100%);
  transition: transform var(--transition-slow);
  overflow-y: auto;
}

.settings-panel[data-open="true"] {
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .settings-panel {
    transition: none;
  }
}

.settings-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.settings-panel-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.settings-panel-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.settings-panel-close:hover {
  color: var(--color-text-primary);
}

.settings-panel-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.settings-panel-content {
  padding: var(--space-4);
}

.settings-section {
  margin-bottom: var(--space-6);
}

.settings-section-title {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-3);
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.settings-item-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

/* Toggle switch */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color var(--transition-base);
}

.toggle[aria-checked="true"] {
  background-color: var(--color-accent);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--color-text-primary);
  border-radius: var(--radius-full);
  transition: transform var(--transition-base);
}

.toggle[aria-checked="true"]::after {
  transform: translateX(20px);
}

.toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .toggle,
  .toggle::after {
    transition: none;
  }
}

/* Settings backdrop */
.settings-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-base), visibility var(--transition-base);
}

.settings-backdrop[data-open="true"] {
  opacity: 1;
  visibility: visible;
}
```

---

## 9. Memory & AI Transparency

### 9.1 Memory Callback Visual Treatment

When Mollei references previous conversation (the "memory wow" moment), visually distinguish it:

```css
/* Memory callback text styling */
.memory-callback {
  color: var(--color-accent-muted);
  font-style: italic;
}

/* Optional: subtle background for memory references */
.memory-callback-highlighted {
  background-color: var(--color-accent-subtle);
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
}

/* Memory indicator icon (optional) */
.memory-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-accent-muted);
  margin-bottom: var(--space-1);
}

.memory-indicator-icon {
  width: 14px;
  height: 14px;
}
```

**Usage Pattern:**
```html
<div class="message-bubble">
  <span class="memory-indicator">
    <svg class="memory-indicator-icon" aria-hidden="true"><!-- Brain/memory icon --></svg>
    <span class="sr-only">Remembering:</span>
  </span>
  <span class="memory-callback">You mentioned last week that your manager was being difficult.</span>
  That sounds really frustrating. How has the situation evolved?
</div>
```

### 9.2 AI Transparency Indicator

Per BRAND_GUIDELINES.md: "Honest About What We Are" — always transparent about being AI.

```css
/* AI indicator - always visible in header or footer */
.ai-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.ai-indicator-icon {
  width: 12px;
  height: 12px;
  color: var(--color-accent);
}

/* Placement options */
.ai-indicator--header {
  /* In header, next to logo */
}

.ai-indicator--footer {
  position: fixed;
  bottom: var(--space-4);
  left: var(--space-4);
  z-index: var(--z-sticky);
}

.ai-indicator--inline {
  /* In welcome message area */
  margin-bottom: var(--space-2);
}
```

**Placement:**
| Location | When to Use |
|----------|-------------|
| Header | Always visible, recommended |
| Footer | Alternative if header is crowded |
| Welcome message | First-time user emphasis |
| Settings panel | Detailed explanation available |

---

## 10. Toast Notifications

Non-blocking notifications for async feedback.

### 10.1 Toast Container

```css
.toast-container {
  position: fixed;
  bottom: calc(var(--input-height) + var(--space-8));
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
  max-width: calc(100% - var(--space-8));
}

@media (min-width: 640px) {
  .toast-container {
    bottom: var(--space-4);
    right: var(--space-4);
    left: auto;
    transform: none;
    align-items: flex-end;
  }
}
```

### 10.2 Toast Variants

```css
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  pointer-events: auto;
  animation: toast-enter 200ms ease-out;
}

@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-exit {
  animation: toast-exit 150ms ease-in forwards;
}

@keyframes toast-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
  .toast-exit {
    animation: none;
    opacity: 0;
  }
}

/* Toast variants */
.toast--success {
  border-color: var(--color-success);
}

.toast--success .toast-icon {
  color: var(--color-success);
}

.toast--error {
  border-color: var(--color-error);
}

.toast--error .toast-icon {
  color: var(--color-error);
}

.toast--info {
  border-color: var(--color-info);
}

.toast--info .toast-icon {
  color: var(--color-info);
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-dismiss {
  width: 44px;
  height: 44px;
  margin: calc(-1 * var(--space-2));
  margin-left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
}

.toast-dismiss:hover {
  color: var(--color-text-secondary);
}

.toast-dismiss:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Toast Use Cases:**
| Event | Toast Type | Message |
|-------|------------|---------|
| Message sent (offline) | Info | "Message queued. Will send when online." |
| Message failed | Error | "Couldn't send message. Tap to retry." |
| Session resumed | Info | "Welcome back. Continuing conversation." |
| Settings saved | Success | "Settings updated." |

---

## 11. Modal & Dialog Patterns

### 11.1 Modal Base

```css
/* Modal backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-base), visibility var(--transition-base);
}

.modal-backdrop[data-open="true"] {
  opacity: 1;
  visibility: visible;
}

/* Modal container */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  z-index: var(--z-modal);
  width: calc(100% - var(--space-8));
  max-width: 480px;
  max-height: calc(100vh - var(--space-16));
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-base), visibility var(--transition-base), transform var(--transition-base);
}

.modal[data-open="true"] {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .modal-backdrop,
  .modal {
    transition: none;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.modal-close {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  margin: calc(-1 * var(--space-2));
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-close:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.modal-body {
  padding: var(--space-4);
  overflow-y: auto;
  max-height: calc(100vh - var(--space-16) - 120px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}
```

### 11.2 Confirmation Dialog

```css
.confirmation-dialog .modal-body {
  text-align: center;
  padding: var(--space-6);
}

.confirmation-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-4);
  color: var(--color-warning);
}

.confirmation-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.confirmation-message {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

/* Action buttons */
.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  min-height: 44px;
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--transition-base);
}

.button-primary:hover {
  background-color: var(--color-accent-hover);
}

.button-primary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  min-height: 44px;
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: border-color var(--transition-base);
}

.button-secondary:hover {
  border-color: var(--color-border-hover);
}

.button-secondary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.button-danger {
  background-color: var(--color-error);
}

.button-danger:hover {
  background-color: #dc2626; /* error-hover */
}
```

### 11.3 Modal ARIA Pattern

```html
<!-- Modal trigger -->
<button
  type="button"
  aria-haspopup="dialog"
  aria-expanded="false"
  aria-controls="settings-modal"
>
  Settings
</button>

<!-- Modal -->
<div
  id="settings-modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-title"
  aria-describedby="settings-description"
  data-open="false"
>
  <div class="modal-header">
    <h2 id="settings-title" class="modal-title">Settings</h2>
    <button
      type="button"
      class="modal-close"
      aria-label="Close settings"
    >
      <svg aria-hidden="true"><!-- X icon --></svg>
    </button>
  </div>
  <div class="modal-body">
    <p id="settings-description">Customize your Mollei experience.</p>
    <!-- Settings content -->
  </div>
</div>

<!-- Focus trap: first and last focusable elements should loop -->
```

---

## 12. Implementation Checklist

### 12.1 Initial Setup

- [ ] Add CSS custom properties to `globals.css`
- [ ] Install Geist font (`@fontsource/geist-sans`, `@fontsource/geist-mono`)
- [ ] Install Lucide icons (`lucide-react`)
- [ ] Configure Tailwind (if using) to use CSS variables

### 12.2 Core Components

- [ ] Chat container with scroll behavior
- [ ] Message bubbles (user + Mollei variants)
- [ ] Typing indicator with animation
- [ ] Chat input with auto-resize
- [ ] Send button with states
- [ ] Streaming cursor indicator

### 12.3 Crisis Components

- [ ] Crisis resource card
- [ ] Resource links with proper ARIA

### 12.4 States

- [ ] Welcome/empty state
- [ ] Loading skeleton
- [ ] Error state with retry button
- [ ] Streaming state
- [ ] Session resume banner

### 12.5 Header & Navigation

- [ ] Desktop header with logo and settings
- [ ] Mobile header with hamburger menu
- [ ] Settings panel (slide-in modal)
- [ ] Toggle switches for settings

### 12.6 Memory & AI Transparency

- [ ] Memory callback visual treatment
- [ ] AI transparency indicator in header
- [ ] "Always AI" messaging in settings

### 12.7 Feedback Components

- [ ] Toast notification container
- [ ] Toast variants (success, error, info)
- [ ] Modal/dialog base component
- [ ] Confirmation dialog pattern

### 12.8 Validation

- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Reduced motion preference respected
- [ ] All interactive elements have 44×44px touch targets
- [ ] All interactive elements have focus states
- [ ] Screen reader testing completed
- [ ] Mobile responsive verified
- [ ] Keyboard navigation works throughout

---

## 13. Progressive Hints (Contextual Onboarding)

Non-intrusive guided learning for emotional awareness.

### 13.1 Progressive Hint Component

```tsx
// components/onboarding/progressive-hint.tsx
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/client/ui-utils'

interface ProgressiveHintProps {
  hintId: string
  title: string
  description: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  autoDismissMs?: number
}

// Hint storage hook
function useHintStorage() {
  const STORAGE_KEY = 'mollei-hints-seen'

  const hasSeenHint = useCallback((hintId: string): boolean => {
    if (typeof window === 'undefined') return true
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return seen.includes(hintId)
  }, [])

  const markHintSeen = useCallback((hintId: string): void => {
    if (typeof window === 'undefined') return
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!seen.includes(hintId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, hintId]))
    }
  }, [])

  return { hasSeenHint, markHintSeen }
}

export function ProgressiveHint({
  hintId,
  title,
  description,
  children,
  position = 'top',
  delay = 500,
  autoDismissMs = 5000,
}: ProgressiveHintProps) {
  const { hasSeenHint, markHintSeen } = useHintStorage()
  const [show, setShow] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hasSeenHint(hintId)) return

    const showTimer = setTimeout(() => {
      setShow(true)
      setTimeout(() => setVisible(true), 50)
    }, delay)

    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, delay + autoDismissMs)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [hintId, delay, autoDismissMs, hasSeenHint])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setShow(false)
      markHintSeen(hintId)
    }, 200)
  }

  if (!show) return <>{children}</>

  return (
    <div className="progressive-hint-wrapper">
      {children}
      {visible && (
        <div
          className={cn('progressive-hint', `progressive-hint--${position}`)}
          role="tooltip"
          aria-live="polite"
        >
          <div className="progressive-hint-content">
            <strong className="progressive-hint-title">{title}</strong>
            <p className="progressive-hint-description">{description}</p>
          </div>
          <button
            className="progressive-hint-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss hint"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}
```

### 13.2 Hint Styles

```css
/* Progressive hint container */
.progressive-hint-wrapper {
  position: relative;
}

.progressive-hint {
  position: absolute;
  z-index: 50;
  width: 16rem;
  padding: var(--space-3);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  animation: hint-enter 200ms var(--ease-out);
}

@keyframes hint-enter {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Position variants */
.progressive-hint--top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: var(--space-2);
}

.progressive-hint--bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: var(--space-2);
}

.progressive-hint-content {
  margin-bottom: var(--space-2);
}

.progressive-hint-title {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.progressive-hint-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.progressive-hint-dismiss {
  width: 100%;
  padding: var(--space-2);
  background-color: var(--color-accent-subtle);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.progressive-hint-dismiss:hover {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
}

.progressive-hint-dismiss:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .progressive-hint {
    animation: none;
  }
}
```

### 13.3 Emotional Awareness Hints

Contextual hints for Mollei's emotional intelligence features:

```tsx
// Hint IDs for emotional awareness features
export const EMOTIONAL_HINTS = {
  MEMORY_CALLBACK: 'emotional-memory-callback',
  PATTERN_RECOGNITION: 'emotional-pattern-recognition',
  CRISIS_RESOURCES: 'emotional-crisis-resources',
  SESSION_RESUME: 'emotional-session-resume',
} as const

// Usage example
<ProgressiveHint
  hintId={EMOTIONAL_HINTS.PATTERN_RECOGNITION}
  title="Emotional Pattern Detected"
  description="Mollei noticed you often mention work stress. This helps provide more personalized support."
  position="bottom"
>
  <div className="pattern-indicator">...</div>
</ProgressiveHint>
```

---

## 14. Error Boundary with Crisis Detection

Graceful error handling with safety-aware recovery for emotional AI context.

### 14.1 Error Boundary Component

```tsx
// components/error-boundary.tsx
import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Phone } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackComponent?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  isCrisisContext: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, isCrisisContext: false }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)

    // Detect if error occurred during crisis-related context
    const isCrisisContext = this.detectCrisisContext()
    this.setState({ isCrisisContext })
  }

  private detectCrisisContext(): boolean {
    // Check URL or session state for crisis indicators
    if (typeof window !== 'undefined') {
      const url = window.location.href
      return url.includes('crisis') || sessionStorage.getItem('crisis-mode') === 'true'
    }
    return false
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, isCrisisContext: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <div className="error-boundary-header">
              <div className="error-boundary-icon">
                <AlertTriangle aria-hidden="true" />
              </div>
              <h2 className="error-boundary-title">Something went wrong</h2>
            </div>

            <div className="error-boundary-content">
              <p className="error-boundary-message">
                We're sorry, but something unexpected happened. Your conversation is safe.
              </p>

              {/* Crisis resources - always visible during crisis context */}
              {this.state.isCrisisContext && (
                <div className="error-boundary-crisis" role="alert">
                  <Phone className="error-boundary-crisis-icon" aria-hidden="true" />
                  <div>
                    <p className="error-boundary-crisis-title">
                      If you're in crisis, help is available:
                    </p>
                    <a
                      href="tel:988"
                      className="error-boundary-crisis-link"
                    >
                      988 Suicide & Crisis Lifeline (Call or Text)
                    </a>
                  </div>
                </div>
              )}

              <div className="error-boundary-actions">
                <button
                  onClick={this.handleReset}
                  className="error-boundary-retry"
                >
                  <RefreshCw aria-hidden="true" />
                  Try again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="error-boundary-reload"
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 14.2 Error Boundary Styles

```css
/* Error boundary container */
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--color-background);
}

.error-boundary-card {
  max-width: 28rem;
  width: 100%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

.error-boundary-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.error-boundary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-error-subtle);
  border-radius: var(--radius-full);
  color: var(--color-error);
}

.error-boundary-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.error-boundary-message {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

/* Crisis resources in error state */
.error-boundary-crisis {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-crisis-subtle);
  border: 1px solid var(--color-crisis-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.error-boundary-crisis-icon {
  width: 20px;
  height: 20px;
  color: var(--color-crisis);
  flex-shrink: 0;
}

.error-boundary-crisis-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.error-boundary-crisis-link {
  font-size: var(--text-sm);
  color: var(--color-crisis);
  text-decoration: underline;
  font-weight: var(--font-medium);
}

.error-boundary-crisis-link:hover {
  text-decoration: none;
}

.error-boundary-actions {
  display: flex;
  gap: var(--space-3);
}

.error-boundary-retry,
.error-boundary-reload {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  min-height: 44px;
}

.error-boundary-retry {
  background-color: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
}

.error-boundary-retry:hover {
  background-color: var(--color-accent-hover);
}

.error-boundary-reload {
  background-color: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.error-boundary-reload:hover {
  background-color: var(--color-surface-elevated);
  border-color: var(--color-border-hover);
}
```

---

## 15. Component Composition Pattern (data-slot)

Semantic component identification for styling and testing.

### 15.1 Pattern Overview

Use `data-slot` attributes to identify component parts semantically:

```tsx
// Instead of relying on class names for structure:
<div className="card">
  <div className="card-header">...</div>
  <div className="card-body">...</div>
</div>

// Use data-slot for semantic identification:
<div data-slot="card">
  <div data-slot="card-header">...</div>
  <div data-slot="card-body">...</div>
</div>
```

### 15.2 Benefits

| Benefit | Description |
|---------|-------------|
| **Testing** | Easy selection via `[data-slot="card"]` |
| **Styling** | Component-scoped CSS without BEM |
| **Structure** | Clear visual hierarchy |
| **Decoupling** | Class names for appearance, slots for structure |

### 15.3 Mollei Component Slots

```tsx
// Message component with slots
export function Message({ variant, children }: MessageProps) {
  return (
    <div data-slot="message" data-variant={variant}>
      <div data-slot="message-avatar">
        {variant === 'mollei' && <MolleiAvatar />}
      </div>
      <div data-slot="message-content">{children}</div>
      <div data-slot="message-timestamp">
        <time>...</time>
      </div>
    </div>
  )
}

// Chat input with slots
export function ChatInput({ onSend }: ChatInputProps) {
  return (
    <form data-slot="chat-input">
      <textarea data-slot="chat-input-field" />
      <button data-slot="chat-input-send" type="submit">
        Send
      </button>
    </form>
  )
}

// Crisis resources with slots
export function CrisisResources({ resources }: CrisisResourcesProps) {
  return (
    <div data-slot="crisis-resources">
      <div data-slot="crisis-resources-header">
        Help is available
      </div>
      <ul data-slot="crisis-resources-list">
        {resources.map(resource => (
          <li data-slot="crisis-resource-item" key={resource.id}>
            <a data-slot="crisis-resource-link" href={resource.url}>
              {resource.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 15.4 Slot-Based Styling

```css
/* Target slots for styling */
[data-slot="message"] {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
}

[data-slot="message"][data-variant="user"] {
  flex-direction: row-reverse;
}

[data-slot="message-content"] {
  flex: 1;
  max-width: 80%;
}

[data-slot="message-timestamp"] {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Crisis resources styling */
[data-slot="crisis-resources"] {
  background-color: var(--color-crisis-subtle);
  border: 1px solid var(--color-crisis-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

[data-slot="crisis-resource-link"] {
  color: var(--color-crisis);
  font-weight: var(--font-medium);
}
```

### 15.5 Testing with Slots

```tsx
// Test file: message.test.tsx
import { render, screen } from '@testing-library/react'
import { Message } from './message'

test('renders message with correct structure', () => {
  render(<Message variant="mollei">Hello</Message>)

  expect(screen.getByTestId('message')).toHaveAttribute('data-variant', 'mollei')
  expect(screen.getByTestId('message-content')).toHaveTextContent('Hello')
})

// Alternatively, query by data-slot
const message = document.querySelector('[data-slot="message"]')
const content = document.querySelector('[data-slot="message-content"]')
```

---

## Quick Token Reference

```css
/* Backgrounds - NO SHADOWS */
background-color: var(--color-background);    /* Page */
background-color: var(--color-surface);       /* Cards, bubbles */
border: 1px solid var(--color-border);        /* Elevation via border */

/* Text */
color: var(--color-text-primary);             /* Main text */
color: var(--color-text-secondary);           /* Secondary */
color: var(--color-text-muted);               /* Hints, timestamps */

/* Accent (Teal) */
background-color: var(--color-accent);        /* User bubble, CTA */
border-color: var(--color-border-focus);      /* Focus state */

/* Typography */
font-family: var(--font-body);                /* All text */
font-family: var(--font-mono);                /* Timestamps */

/* Transitions */
transition: border-color var(--transition-base);  /* 150ms */
```

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
