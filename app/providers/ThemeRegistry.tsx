// This component must be a Client Component
'use client';

import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme as baseTheme } from '@/lib/theme';
import { ReactNode, useState, useMemo, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import './mui-overrides.css';

// This implementation is from the Material UI with Next.js example
// https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { theme: mode } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create the MUI theme based on our dark/light mode
  const muiTheme = useMemo(() => 
    createTheme({
      ...baseTheme,
      palette: {
        mode: mounted && (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
          ? 'dark' 
          : 'light',
        ...baseTheme.palette,
      },
    }), 
  [mode, mounted]);

  const [{ cache, flush }] = useState(() => {
    const cache = createCache({
      key: 'mui',
      prepend: true, // Ensures MUI styles are loaded first
    });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </CacheProvider>
  );
} 