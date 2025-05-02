'use client';

import { Box, Typography, SxProps, Theme } from '@mui/material';

// --- Extracted Title Section Component ---
interface TitleSectionProps {
  title: string;
  subtitle?: string;
}

const TitleSection: React.FC<TitleSectionProps> = ({ title, subtitle }) => (
  <Box>
    <Typography
      variant="h4"
      component="h1"
      id="page-title"
      tabIndex={0}
      sx={{
        fontWeight: 600,
        mb: subtitle ? 1 : 0,
        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
        visibility: 'visible',
        display: 'block',
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography
        variant="subtitle1"
        component="h2"
        color="text.secondary"
        sx={{ mt: 0.5 }}
        id="page-subtitle"
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

// --- Main Page Header Component ---
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  containerSx?: SxProps<Theme>;
}

/**
 * Standard page header component for consistent page headings across the application
 *
 * According to Material UI guidelines, page headers should have consistent spacing
 * and follow a standard typographic hierarchy
 *
 * This component ensures proper accessibility by always including an h1 element
 * with appropriate ARIA attributes
 */
export default function PageHeader({ title, subtitle, action, containerSx }: PageHeaderProps) {
  return (
    <Box
      component="header"
      role="banner"
      aria-labelledby="page-title"
      sx={{
        mb: { xs: 3, sm: 4 },
        pb: { xs: 2, sm: 2 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        ...containerSx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        {/* Use the extracted component */}
        <TitleSection title={title} subtitle={subtitle} />

        {/* Original action section */}
        {action && <Box sx={{ mt: { xs: 1, sm: 0 } }}>{action}</Box>}
      </Box>
    </Box>
  );
}
