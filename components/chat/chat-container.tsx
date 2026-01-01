'use client'

import { useChat } from '@ai-sdk/react'
import { type UIMessage } from 'ai'
import { useCallback, useState, useMemo, type FormEvent, type ChangeEvent } from 'react'
import { MolleiChatTransport } from '@/lib/client/chat-transport'
import { useAuth, SignInButton } from '@/lib/auth/clerk'
import { ChatHeader } from './chat-header'
import { MessageList } from './message-list'
import { InputArea } from './input-area'

interface ChatContainerProps {
  sessionId?: string
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const [crisisSeverity, setCrisisSeverity] = useState(0)

  const transport = useMemo(
    () => new MolleiChatTransport({ api: '/api/chat' }),
    []
  )

  const { messages, sendMessage, regenerate, status, error, clearError } =
    useChat({
      id: sessionId,
      transport,
      onFinish: () => {
        setCrisisSeverity(0)
      },
      onError: (err) => {
        console.error('[chat] Stream error:', err)
      },
    })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isStreaming = status === 'streaming'

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!inputValue.trim() || isLoading) return

      const messageText = inputValue.trim()
      setInputValue('')
      await sendMessage({ text: messageText })
    },
    [inputValue, isLoading, sendMessage]
  )

  const handleRetry = useCallback(() => {
    clearError()
    regenerate()
  }, [clearError, regenerate])

  const normalizedMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: getMessageContent(msg),
  }))

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Mollei
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to start a conversation
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Sign In
          </button>
        </SignInButton>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <a href="#chat-input" className="skip-link">
        Skip to chat input
      </a>

      <ChatHeader />

      <MessageList
        messages={normalizedMessages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        crisisSeverity={crisisSeverity}
      />

      {error && (
        <div
          role="alert"
          className="mx-auto max-w-3xl px-4 pb-2"
        >
          <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={handleRetry}
              className="text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div id="chat-input">
        <InputArea
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          disabled={isLoading}
          placeholder="Type a message..."
        />
      </div>
    </div>
  )
}

function getMessageContent(message: UIMessage): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('')
  }

  return ''
}
