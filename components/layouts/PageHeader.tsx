'use client';

import { Box, Typography, SxProps, Theme } from '@mui/material';

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
 */
export default function PageHeader({ title, subtitle, action, containerSx }: PageHeaderProps) {
  return (
    <Box
      component="header"
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
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              mb: subtitle ? 1 : 0,
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
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && <Box sx={{ mt: { xs: 1, sm: 0 } }}>{action}</Box>}
      </Box>
    </Box>
  );
}
