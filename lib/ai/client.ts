import { anthropic } from '@ai-sdk/anthropic'
import { AGENT_MODELS } from './models'

export const moodSensorModel = anthropic(AGENT_MODELS.MOOD_SENSOR)
export const memoryAgentModel = anthropic(AGENT_MODELS.MEMORY_AGENT)
export const safetyMonitorModel = anthropic(AGENT_MODELS.SAFETY_MONITOR)
export const emotionReasonerModel = anthropic(AGENT_MODELS.EMOTION_REASONER)
export const responseGeneratorModel = anthropic(AGENT_MODELS.RESPONSE_GENERATOR)
export const crisisModel = anthropic(AGENT_MODELS.CRISIS_ESCALATION)
