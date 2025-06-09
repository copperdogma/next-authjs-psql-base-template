'use client';

import {
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuProps as MuiMenuProps,
  MenuItemProps as MuiMenuItemProps,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import { forwardRef, ReactNode, memo, useCallback } from 'react';

export interface MenuItemProps extends MuiMenuItemProps {
  icon?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export const MenuItem = memo(
  forwardRef<HTMLLIElement, MenuItemProps>(
    ({ children, icon, primary, secondary, danger, disabled = false, sx, ...props }, ref) => {
      const theme = useTheme();
      const dangerColor = theme.palette.error.main;
      const dangerHoverBg = theme.palette.error.light; // Adjust alpha/opacity if needed for hover bg

      return (
        <MuiMenuItem
          {...props}
          ref={ref}
          disabled={disabled}
          // Combine incoming sx with default styles
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2, // theme.spacing(2) assuming 8px base
            transition: theme.transitions.create('background-color', {
              duration: theme.transitions.duration.shortest, // 150ms
            }),
            ...(danger && {
              color: dangerColor,
              '&:hover': {
                backgroundColor: dangerHoverBg,
              },
              // Apply danger color to icon and text if they exist
              '& .MuiListItemIcon-root': { color: dangerColor },
              '& .MuiListItemText-primary': { color: dangerColor },
            }),
            ...(disabled && {
              opacity: 0.5,
              cursor: 'not-allowed',
            }),
            ...(sx || {}), // Apply incoming sx prop last
          }}
        >
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          {primary || secondary ? (
            <ListItemText
              primary={primary}
              secondary={secondary}
              // Danger color applied via parent sx
            />
          ) : (
            children
          )}
        </MuiMenuItem>
      );
    }
  )
);

MenuItem.displayName = 'MenuItem';

export const MenuDivider = () => <Divider sx={{ my: 1 }} />;

export interface MenuProps extends MuiMenuProps {
  children: ReactNode;
  width?: number | string;
}

const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ children, width, PaperProps, ...props }, ref) => {
    const theme = useTheme();
    // Don't use CSS transitions during initial mount
    const TransitionProps = useCallback(
      () => ({
        timeout: {
          appear: 0,
          enter: theme.transitions.duration.enteringScreen, // 225ms
          exit: theme.transitions.duration.leavingScreen, // 195ms
        },
      }),
      [theme]
    );

    return (
      <MuiMenu
        {...props}
        ref={ref}
        TransitionProps={TransitionProps()}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
          ...props.anchorOrigin,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
          ...props.transformOrigin,
        }}
        PaperProps={{
          ...PaperProps,
          elevation: 8,
          sx: {
            borderRadius:
              typeof theme.shape.borderRadius === 'number'
                ? theme.shape.borderRadius * 1.5
                : theme.shape.borderRadius, // rounded-lg equivalent (adjust multiplier)
            boxShadow: theme.shadows[3], // shadow-md equivalent
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            width: width || 'auto',
            minWidth: 180,
            maxHeight: 'calc(100% - 96px)',
            ...(PaperProps?.sx || {}),
          },
        }}
      >
        {children}
      </MuiMenu>
    );
  }
);

Menu.displayName = 'Menu';

// Export the memoized component
export default memo(Menu);
