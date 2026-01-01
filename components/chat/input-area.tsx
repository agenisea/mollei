'use client'

import { useRef, useEffect, useCallback, type FormEvent, type ChangeEvent, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface InputAreaProps {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  disabled?: boolean
  placeholder?: string
}

const MIN_HEIGHT = 24
const MAX_HEIGHT = 200

export function InputArea({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Message Mollei...',
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    textarea.style.height = `${Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        formRef.current?.requestSubmit()
      }
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit(e)
  }

  const canSubmit = value.trim().length > 0 && !disabled

  return (
    <div className="border-t border-border bg-background px-4 py-3 pb-safe">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl"
      >
        <div className="relative flex items-end rounded-2xl border border-input bg-card transition-colors duration-150 focus-within:border-primary">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            aria-label="Message input"
            aria-describedby="input-hint"
            className={cn(
              'flex-1 resize-none bg-transparent px-4 py-3 pr-14',
              'text-base text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'custom-scrollbar'
            )}
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          />
          <span id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Send message"
            className={cn(
              'absolute bottom-2 right-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              'transition-all duration-150',
              canSubmit
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 scale-100'
                : 'bg-muted text-muted-foreground scale-95 opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:pointer-events-none'
            )}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  )
}
