'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

import { cn } from '../utils'

import { Button } from './button'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function ThemeToggle({ className, size = 'sm' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Wait until mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn(
          size === 'sm' && 'h-8 w-8 p-0',
          'text-muted-foreground hover:text-foreground',
          className
        )}
        disabled
      >
        <Sun className="w-4 h-4" />
      </Button>
    )
  }

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className={cn(
        size === 'sm' && 'h-8 w-8 p-0',
        'text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  )
}
