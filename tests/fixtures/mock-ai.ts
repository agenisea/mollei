import { vi } from 'vitest'
import { generateObject } from 'ai'
import type {
  MockEmotionOutput,
  MockSafetyOutput,
  MockMemoryOutput,
  MockEmotionReasonerOutput,
} from './types'

type MockedGenerateObject = ReturnType<typeof vi.mocked<typeof generateObject>>

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
