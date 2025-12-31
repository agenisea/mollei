import { SIGNAL_TYPES, type SignalType } from '../utils/constants'

interface HeuristicResult {
  shouldEscalate: boolean
  signals: SignalType[]
  matchedPhrases: string[]
}

const CRISIS_PATTERNS: Record<SignalType, RegExp[]> = {
  [SIGNAL_TYPES.SUICIDAL_IDEATION]: [
    /\b(want to die|end (it|my life)|kill myself|suicide|suicidal)\b/i,
    /\b(no (point|reason) (to|in) liv(e|ing))\b/i,
    /\b(better off (dead|without me))\b/i,
    /\b(can'?t (go on|take it|do this) anymore)\b/i,
    /\b(don'?t want to (be here|exist|wake up))\b/i,
  ],
  [SIGNAL_TYPES.SELF_HARM]: [
    /\b(cut(ting)? myself|hurt(ing)? myself|self[- ]?harm)\b/i,
    /\b(burn(ing)? myself|scratch(ing)? myself)\b/i,
    /\b(hit(ting)? myself|punch(ing)? myself)\b/i,
  ],
  [SIGNAL_TYPES.ABUSE]: [
    /\b((he|she|they|partner|spouse|parent) (hit|hits|beat|beats|hurt|hurts) me)\b/i,
    /\b(being (abused|beaten|hit))\b/i,
    /\b(domestic (violence|abuse))\b/i,
    /\b((physically|sexually|emotionally) (abused|assaulted))\b/i,
  ],
  [SIGNAL_TYPES.SAFETY]: [
    /\b(not safe|don'?t feel safe|unsafe)\b/i,
    /\b(threatened|threatening me)\b/i,
    /\b(scared for my life)\b/i,
  ],
  [SIGNAL_TYPES.DISTRESS]: [
    /\b(hopeless|no hope|lost all hope)\b/i,
    /\b(worthless|no one cares|nobody cares)\b/i,
    /\b(can'?t cope|falling apart|breaking down)\b/i,
    /\b(desperate|despair)\b/i,
  ],
  [SIGNAL_TYPES.NONE]: [],
}

const COLLOQUIAL_OVERRIDES: RegExp[] = [
  /\b(killing (it|me)|kill(s|ed)? it|so funny|hilarious|dying (of|from) laughter)\b/i,
  /\b(to die for|drop[- ]dead gorgeous)\b/i,
  /\b(dead tired|dead serious|deadly serious)\b/i,
  /\b(bored to death|scared to death|worried to death)\b/i,
  /\b(you'?re killing me|that kills|this kills)\b/i,
]

export function runSafetyHeuristics(message: string): HeuristicResult {
  const normalizedMessage = message.toLowerCase()

  for (const override of COLLOQUIAL_OVERRIDES) {
    if (override.test(normalizedMessage)) {
      return {
        shouldEscalate: false,
        signals: [],
        matchedPhrases: [],
      }
    }
  }

  const signals: SignalType[] = []
  const matchedPhrases: string[] = []

  for (const [signalType, patterns] of Object.entries(CRISIS_PATTERNS)) {
    if (signalType === SIGNAL_TYPES.NONE) continue

    for (const pattern of patterns) {
      const match = normalizedMessage.match(pattern)
      if (match) {
        signals.push(signalType as SignalType)
        matchedPhrases.push(match[0])
        break
      }
    }
  }

  return {
    shouldEscalate: signals.length > 0,
    signals,
    matchedPhrases,
  }
}
