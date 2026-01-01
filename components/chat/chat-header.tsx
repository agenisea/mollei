'use client'

import Image from 'next/image'
import { UserButton } from '@/lib/auth/clerk'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Image
            src="/logo.png"
            alt="Mollei"
            width={400}
            height={400}
            className="h-9 w-auto"
            priority
          />
          <span>Mollei™</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
    </header>
  )
}
