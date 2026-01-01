'use client'

export function TypingIndicator() {
  return (
    <div className="flex justify-start" aria-label="Mollei is typing">
      <div
        className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-3"
        role="status"
        aria-live="polite"
      >
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="sr-only">Mollei is thinking...</span>
      </div>
    </div>
  )
}
