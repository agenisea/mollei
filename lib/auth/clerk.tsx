'use client'

import {
  ClerkProvider as BaseClerkProvider,
  useAuth as useClerkAuth,
  SignInButton as BaseSignInButton,
  UserButton as BaseUserButton,
} from '@clerk/nextjs'
import type { ComponentProps, ReactNode } from 'react'

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) return <>{children}</>
  return (
    <BaseClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      {children}
    </BaseClerkProvider>
  )
}

export function useAuth() {
  if (!CLERK_ENABLED) {
    return { isLoaded: true, isSignedIn: true, userId: 'anonymous' }
  }
  const auth = useClerkAuth()
  return {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
  }
}

export function SignInButton(props: ComponentProps<typeof BaseSignInButton>) {
  if (!CLERK_ENABLED) return null
  return <BaseSignInButton {...props} />
}

export function UserButton(props: ComponentProps<typeof BaseUserButton>) {
  if (!CLERK_ENABLED) return null
  return <BaseUserButton {...props} />
}
