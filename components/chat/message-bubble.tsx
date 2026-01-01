'use client'

import { cn } from '@/lib/utils/cn'

type MessageRole = 'user' | 'assistant'

interface MessageBubbleProps {
  role: MessageRole
  content: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          'text-base leading-normal',
          'transition-colors duration-150',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-card-foreground',
          'sm:max-w-[75%]'
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {content}
          {isStreaming && !isUser && (
            <span
              className="streaming-cursor ml-0.5 inline-block h-4 w-0.5 bg-primary"
              aria-hidden="true"
            />
          )}
        </p>
      </div>
    </div>
  )
}
