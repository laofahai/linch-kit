'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Logger } from '@linch-kit/core/client'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    Logger.info('Theme Provider initialized', {
      attribute: props.attribute,
      defaultTheme: props.defaultTheme,
    })
  }, [props.attribute, props.defaultTheme])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
