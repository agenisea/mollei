'use client'

import { useRef, useEffect, type RefObject } from 'react'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import { CrisisResources } from './crisis-resources'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  isStreaming?: boolean
  crisisSeverity?: number
}

function useAutoScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  messageCount: number,
  lastContent: string | undefined,
  isLoading: boolean
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [containerRef, messageCount, lastContent, isLoading])
}

export function MessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  crisisSeverity = 0,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMessageContent = messages[messages.length - 1]?.content

  useAutoScroll(containerRef, messages.length, lastMessageContent, isLoading)

  const hasMessages = messages.length > 0
  const lastMessage = messages[messages.length - 1]
  const showCrisisResources =
    crisisSeverity >= 3 && lastMessage?.role === 'assistant'

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Conversation history"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 overflow-y-auto custom-scrollbar"
    >
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {!hasMessages && (
          <div className="flex h-full min-h-[50vh] items-center justify-center">
            <p className="text-center text-lg text-muted-foreground">
              Start a conversation with Mollei
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          const isStreamingThisMessage =
            isStreaming && isLastMessage && message.role === 'assistant'

          return (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              isStreaming={isStreamingThisMessage}
            />
          )
        })}

        {isLoading && !isStreaming && <TypingIndicator />}

        {showCrisisResources && <CrisisResources severity={crisisSeverity} />}
      </div>
    </div>
  )
}
