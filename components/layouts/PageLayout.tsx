'use client';

import { ReactNode } from 'react';
import { Box, Container, SxProps, Theme } from '@mui/material';
import PageHeader from './PageHeader';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

/**
 * Standard page layout component for consistent page structure across the application
 *
 * Provides consistent padding, margins, and layout for all pages
 * Following Material UI spacing guidelines
 */
export default function PageLayout({
  children,
  title,
  subtitle,
  action,
  headerSx,
  contentSx,
  maxWidth = 'lg',
}: PageLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px - 100px)',
        bgcolor: 'background.default',
        pt: { xs: 2, sm: 3 },
      }}
    >
      <Container
        maxWidth={maxWidth}
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 4, sm: 6 },
        }}
      >
        <PageHeader title={title} subtitle={subtitle} action={action} containerSx={headerSx} />

        <Box
          component="div"
          role="region"
          aria-label="Page content"
          sx={{
            mt: { xs: 2, sm: 3 },
            ...contentSx,
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
