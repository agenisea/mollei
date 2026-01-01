'use client'

import { AlertTriangle } from 'lucide-react'

interface CrisisResourcesProps {
  severity?: number
}

export function CrisisResources({ severity = 0 }: CrisisResourcesProps) {
  if (severity < 3) return null

  return (
    <div
      className="border-l-4 border-crisis bg-crisis/10 p-4 rounded-r-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 text-crisis shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-foreground">
            If you&apos;re in crisis, please reach out:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text{' '}
              <a
                href="tel:988"
                className="text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                988
              </a>
            </li>
            <li>
              <strong>Crisis Text Line:</strong> Text HOME to{' '}
              <a
                href="sms:741741"
                className="text-primary underline underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                741741
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
