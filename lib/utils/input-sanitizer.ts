interface SanitizationResult {
  sanitized: string
  wasModified: boolean
  detectedPatterns: string[]
}

const INJECTION_PATTERNS: { name: string; pattern: RegExp; replacement: string }[] = [
  {
    name: 'system_override',
    pattern: /\b(ignore (all )?(previous|prior|above) (instructions?|prompts?|rules?))\b/gi,
    replacement: '[filtered]',
  },
  {
    name: 'role_injection',
    pattern: /\b(you are now|act as|pretend (to be|you'?re)|roleplay as)\b/gi,
    replacement: '[filtered]',
  },
  {
    name: 'prompt_leak',
    pattern: /\b(show (me )?(your|the) (system )?(prompt|instructions?)|what are your instructions)\b/gi,
    replacement: '[filtered]',
  },
  {
    name: 'jailbreak_attempt',
    pattern: /\b(DAN|do anything now|jailbreak|bypass (safety|restrictions|filters))\b/gi,
    replacement: '[filtered]',
  },
  {
    name: 'delimiter_injection',
    pattern: /(\[SYSTEM\]|\[\/INST\]|\<\|im_start\|>|\<\|im_end\|>|###\s*(System|User|Assistant):)/gi,
    replacement: '',
  },
  {
    name: 'xml_injection',
    pattern: /<(system|assistant|user|prompt|instruction)[^>]*>/gi,
    replacement: '',
  },
]

const MAX_MESSAGE_LENGTH = 10000

export function sanitizeUserInput(input: string): SanitizationResult {
  const detectedPatterns: string[] = []
  let sanitized = input

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_LENGTH)
    detectedPatterns.push('message_truncated')
  }

  for (const { name, pattern, replacement } of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      detectedPatterns.push(name)
      sanitized = sanitized.replace(pattern, replacement)
    }
  }

  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()

  return {
    sanitized,
    wasModified: sanitized !== input,
    detectedPatterns,
  }
}

export function logSuspiciousInput(
  traceId: string,
  originalLength: number,
  result: SanitizationResult
): void {
  if (result.detectedPatterns.length > 0) {
    console.warn(`[${traceId}] Suspicious input detected:`, {
      patterns: result.detectedPatterns,
      originalLength,
      sanitizedLength: result.sanitized.length,
    })
  }
}
