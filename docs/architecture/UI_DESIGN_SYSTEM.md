# UI Design System

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-30-25 5:15PM PST

Production-ready design tokens, component specifications, and interaction patterns for Mollei's chat interface.

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
     TRANSITIONS
     ========================= */

  --transition-fast: 100ms ease-out;
  --transition-base: 150ms ease-out;
  --transition-slow: 200ms ease-in-out;

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

### 4.1 Welcome State

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

### 5.2 Screen Reader Utilities

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

### 5.3 ARIA Patterns

```html
<!-- Chat container -->
<main role="main" aria-label="Chat with Mollei">

  <!-- Message list -->
  <div
    role="log"
    aria-live="polite"
    aria-label="Conversation"
    aria-relevant="additions"
  >
    <!-- Messages rendered here -->
  </div>

  <!-- Typing indicator -->
  <div aria-live="polite" aria-atomic="true">
    <span class="sr-only">Mollei is typing...</span>
  </div>

  <!-- Input -->
  <form role="form" aria-label="Send a message">
    <textarea
      aria-label="Message to Mollei"
      placeholder="Type a message..."
    ></textarea>
    <button type="submit" aria-label="Send message">
      <!-- Icon -->
    </button>
  </form>
</main>

<!-- Crisis resources (when shown) -->
<aside
  role="complementary"
  aria-label="Crisis support resources"
  aria-live="assertive"
>
  <!-- Resources -->
</aside>
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
| Close | `X` | Dismiss modals |
| Menu | `Menu` | Mobile navigation |
| Alert | `AlertCircle` | Crisis indicator |
| Phone | `Phone` | Crisis hotline |
| External | `ExternalLink` | Resource links |
| Check | `Check` | Message sent confirmation |
| Loader | `Loader2` | Loading state |

```css
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.25rem; height: 1.25rem; }
.icon-lg { width: 1.5rem; height: 1.5rem; }
```

---

## 8. Implementation Checklist

### 8.1 Initial Setup

- [ ] Add CSS custom properties to `globals.css`
- [ ] Install Geist font (`@fontsource/geist-sans`, `@fontsource/geist-mono`)
- [ ] Install Lucide icons (`lucide-react`)
- [ ] Configure Tailwind (if using) to use CSS variables

### 8.2 Core Components

- [ ] Chat container with scroll behavior
- [ ] Message bubbles (user + Mollei variants)
- [ ] Typing indicator with animation
- [ ] Chat input with auto-resize
- [ ] Send button with states
- [ ] Streaming cursor indicator

### 8.3 Crisis Components

- [ ] Crisis resource card
- [ ] Resource links with proper ARIA

### 8.4 States

- [ ] Welcome/empty state
- [ ] Loading skeleton
- [ ] Error state
- [ ] Streaming state

### 8.5 Validation

- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Reduced motion preference respected
- [ ] All interactive elements have focus states
- [ ] Screen reader testing completed
- [ ] Mobile responsive verified

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
