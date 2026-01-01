import { vi } from 'vitest'
import { generateObject, generateText, streamText } from 'ai'
import type {
  MockEmotionOutput,
  MockSafetyOutput,
  MockMemoryOutput,
  MockEmotionReasonerOutput,
} from './types'

type MockedGenerateObject = ReturnType<typeof vi.mocked<typeof generateObject>>
type MockedGenerateText = ReturnType<typeof vi.mocked<typeof generateText>>
type MockedStreamText = ReturnType<typeof vi.mocked<typeof streamText>>

export function mockGenerateObjectOnce<T>(mock: MockedGenerateObject, object: T): void {
  mock.mockResolvedValueOnce({ object } as Awaited<ReturnType<typeof generateObject>>)
}

export function mockGenerateObjectError(mock: MockedGenerateObject, error: Error): void {
  mock.mockRejectedValueOnce(error)
}

export function mockEmotionResponse(mock: MockedGenerateObject, object: MockEmotionOutput): void {
  mockGenerateObjectOnce(mock, object)
}

export function mockSafetyResponse(mock: MockedGenerateObject, object: MockSafetyOutput): void {
  mockGenerateObjectOnce(mock, object)
}

export function mockMemoryResponse(mock: MockedGenerateObject, object: MockMemoryOutput): void {
  mockGenerateObjectOnce(mock, object)
}

export function mockEmotionReasonerResponse(mock: MockedGenerateObject, object: MockEmotionReasonerOutput): void {
  mockGenerateObjectOnce(mock, object)
}

export function mockGenerateTextOnce(mock: MockedGenerateText, text: string): void {
  mock.mockResolvedValueOnce({ text } as Awaited<ReturnType<typeof generateText>>)
}

export function mockGenerateTextError(mock: MockedGenerateText, error: Error): void {
  mock.mockRejectedValueOnce(error)
}

async function* createAsyncTextStream(text: string): AsyncGenerator<string> {
  const words = text.split(' ')
  for (const word of words) {
    yield word + ' '
  }
}

export function mockStreamTextOnce(mock: MockedStreamText, text: string): void {
  mock.mockReturnValueOnce({
    textStream: createAsyncTextStream(text),
    text: Promise.resolve(text),
    finishReason: Promise.resolve('stop'),
    usage: Promise.resolve({ promptTokens: 100, completionTokens: 50 }),
  } as unknown as ReturnType<typeof streamText>)
}
