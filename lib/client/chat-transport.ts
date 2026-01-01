import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface MolleiTransportOptions {
  api?: string
}

export class MolleiChatTransport implements ChatTransport<UIMessage> {
  private api: string

  constructor(options: MolleiTransportOptions = {}) {
    this.api = options.api ?? '/api/chat'
  }

  async sendMessages(options: {
    chatId: string
    messages: UIMessage[]
    abortSignal: AbortSignal | undefined
  }): Promise<ReadableStream<UIMessageChunk>> {
    const { chatId, messages, abortSignal } = options

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (!lastUserMessage) {
      throw new Error('No user message to send')
    }

    const messageText =
      lastUserMessage.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? ''

    const sessionId = UUID_REGEX.test(chatId) ? chatId : undefined

    const response = await fetch(this.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageText,
        sessionId,
      }),
      signal: abortSignal,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Chat request failed: ${response.status} - ${errorBody}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    return this.transformSSEToUIMessageStream(response.body, messages.length)
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null
  }

  private transformSSEToUIMessageStream(
    sseStream: ReadableStream<Uint8Array>,
    messageIndex: number
  ): ReadableStream<UIMessageChunk> {
    const decoder = new TextDecoder()
    const messageId = `assistant-${messageIndex}`
    let buffer = ''
    let fullResponse = ''
    let startSent = false

    return new ReadableStream<UIMessageChunk>({
      async start(controller) {
        const reader = sseStream.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (fullResponse && !startSent) {
                controller.enqueue({ type: 'start', messageId })
                controller.enqueue({ type: 'text-start', id: messageId })
                controller.enqueue({
                  type: 'text-delta',
                  id: messageId,
                  delta: fullResponse,
                })
                controller.enqueue({ type: 'text-end', id: messageId })
              }
              controller.enqueue({ type: 'finish', finishReason: 'stop' })
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.response && !startSent) {
                    startSent = true
                    fullResponse = parsed.response

                    controller.enqueue({ type: 'start', messageId })
                    controller.enqueue({ type: 'text-start', id: messageId })
                    controller.enqueue({
                      type: 'text-delta',
                      id: messageId,
                      delta: parsed.response,
                    })
                    controller.enqueue({ type: 'text-end', id: messageId })
                  }
                } catch {
                  // Ignore non-JSON SSE data
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        }
      },
    })
  }
}
