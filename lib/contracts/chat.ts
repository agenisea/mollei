import { z } from 'zod'

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(10000),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

export interface ChatResponse {
  sessionId: string
  response: string
  turnNumber: number
  latencyMs: number
  crisisDetected?: boolean
}

export interface StreamChatResponse {
  sessionId: string
  response: string
  turnNumber: number
  crisisDetected?: boolean
  latencyMs: Record<string, number>
}
