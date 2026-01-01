'use client'

import { useEffect, useCallback, useSyncExternalStore, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './button'

type Theme = 'light' | 'dark' | 'system'

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) ?? 'system'
}

const subscribeToStorage = (callback: () => void) => {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

const getServerSnapshot = (): Theme => 'system'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToStorage, getStoredTheme, getServerSnapshot)
  const hasMounted = useRef(false)

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemDark)
    } else {
      root.classList.toggle('dark', newTheme === 'dark')
    }
  }, [])

  useEffect(() => {
    hasMounted.current = true
    applyTheme(theme)
  }, [theme, applyTheme])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    window.dispatchEvent(new Event('storage'))
  }, [theme, applyTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-10 w-10"
    >
      {/* Render both icons, use CSS to show/hide based on .dark class */}
      <Sun className="h-5 w-5 transition-transform dark:hidden" aria-hidden="true" />
      <Moon className="h-5 w-5 transition-transform hidden dark:block" aria-hidden="true" />
    </Button>
  )
}
