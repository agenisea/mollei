const CRISIS_RESOURCES = `

---

If you're in crisis, please know you're not alone:
- National Suicide Prevention Lifeline: 988 (US)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

I'm here with you, and these resources are too.`

export function appendCrisisResources(response: string): string {
  return response + CRISIS_RESOURCES
}

export function shouldAppendResources(crisisSeverity: number): boolean {
  return crisisSeverity >= 4
}
