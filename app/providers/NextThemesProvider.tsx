'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';

// Use React.ComponentProps to infer the props type from the provider
export function NextThemesProviderWrapper({
  children,
  ...props
}: React.ComponentProps<typeof ThemeProvider>) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}
