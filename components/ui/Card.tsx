'use client';

/* istanbul ignore file coverage-justification
 * This is a purely presentational component using React's forwardRef.
 * Lower coverage thresholds are acceptable because:
 * 1. Components are simple wrappers for styling and structure
 * 2. Uncovered lines are primarily React boilerplate (displayName, prop spreading)
 * 3. Testing these would mostly test React's functionality rather than our business logic
 * Coverage thresholds are set in jest.config.js
 */

import { forwardRef } from 'react';
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader,
  CardActions as MuiCardActions,
  Typography,
} from '@mui/material';

// Card components using semantic HTML where appropriate
// and enhanced with accessibility attributes

const Card = forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiCard>>(
  ({ sx, ...props }, ref) => {
    return (
      <MuiCard
        ref={ref}
        elevation={1}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
          ...(sx || {}),
        }}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiCardHeader>>(
  ({ sx, ...props }, ref) => (
    <MuiCardHeader
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        p: 3,
        ...(sx || {}),
      }}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * Card title component.
 * For accessibility, provide a unique `id` and reference it in an associated
 * CardDescription's `aria-labelledby` prop to create a semantic link.
 *
 * @example
 * ```tsx
 * <CardTitle id="user-profile-title">User Profile</CardTitle>
 * <CardDescription aria-labelledby="user-profile-title">
 *   Manage your profile settings and preferences
 * </CardDescription>
 * ```
 */
const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<typeof Typography> & { component?: 'h3' }
>(({ sx, variant = 'h5', component = 'h3', ...props }, ref) => (
  <Typography
    ref={ref}
    variant={variant}
    component={component}
    sx={{
      fontWeight: 600,
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
      ...(sx || {}),
    }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Card description component.
 * For accessibility, use the `aria-labelledby` prop to reference the `id` of the
 * corresponding CardTitle to programmatically link this description to its title.
 *
 * @example
 * ```tsx
 * <CardTitle id="user-profile-title">User Profile</CardTitle>
 * <CardDescription aria-labelledby="user-profile-title">
 *   Manage your profile settings and preferences
 * </CardDescription>
 * ```
 */
const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof Typography> & { component?: 'p' }
>(({ sx, variant = 'body2', component = 'p', ...props }, ref) => (
  <Typography
    ref={ref}
    variant={variant}
    color="text.secondary"
    component={component}
    sx={{ ...(sx || {}) }}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiCardContent>>(
  ({ sx, ...props }, ref) => (
    <MuiCardContent
      ref={ref}
      sx={{
        p: 3,
        pt: 0,
        ...(sx || {}),
      }}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.ComponentProps<typeof MuiCardActions>>(
  ({ sx, ...props }, ref) => (
    <MuiCardActions
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        pt: 0,
        ...(sx || {}),
      }}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
