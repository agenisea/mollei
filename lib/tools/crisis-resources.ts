const CRISIS_RESOURCES = `

---

If you're in crisis, please know you're not alone:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

I'm here with you, and these resources are too.`

const SAFETY_CHECK = `

---

I want to make sure I'm being helpful. If you're going through something difficult, talking to someone who can really support you—like a counselor, therapist, or trusted friend—can make a real difference.`

const SUGGEST_HUMAN = `

---

What you're experiencing sounds significant. While I'm here to listen, a counselor or therapist can offer the kind of ongoing support that might be really valuable right now. Would you like to talk about what finding that kind of support might look like?`

export function appendCrisisResources(response: string): string {
  return response + CRISIS_RESOURCES
}

export function appendSafetyCheck(response: string): string {
  return response + SAFETY_CHECK
}

export function appendSuggestHuman(response: string): string {
  return response + SUGGEST_HUMAN
}

export function shouldAppendResources(crisisSeverity: number): boolean {
  return crisisSeverity >= 4
}

export function applySeverityModifier(response: string, severity: number): string {
  if (severity >= 4) {
    return appendCrisisResources(response)
  }
  if (severity === 3) {
    return appendSuggestHuman(response)
  }
  if (severity === 2) {
    return appendSafetyCheck(response)
  }
  return response
}
