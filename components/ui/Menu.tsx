'use client';

import {
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuProps as MuiMenuProps,
  MenuItemProps as MuiMenuItemProps,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { forwardRef, ReactNode, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface MenuItemProps extends MuiMenuItemProps {
  icon?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export const MenuItem = memo(
  forwardRef<HTMLLIElement, MenuItemProps>(
    (
      { children, icon, primary, secondary, danger, disabled = false, className = '', ...props },
      ref
    ) => {
      return (
        <MuiMenuItem
          {...props}
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 transition-colors duration-150',
            danger && 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {icon && <ListItemIcon className={cn(danger && 'text-red-600')}>{icon}</ListItemIcon>}
          {primary || secondary ? (
            <ListItemText
              primary={primary}
              secondary={secondary}
              primaryTypographyProps={{
                className: cn(danger && 'text-red-600'),
              }}
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

export const MenuDivider = () => <Divider className="my-1" />;

export interface MenuProps extends MuiMenuProps {
  children: ReactNode;
  width?: number | string;
}

const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ children, className = '', width, ...props }, ref) => {
    // Don't use CSS transitions during initial mount
    const TransitionProps = useCallback(
      () => ({
        timeout: {
          appear: 0,
          enter: 225,
          exit: 195,
        },
      }),
      []
    );

    return (
      <MuiMenu
        {...props}
        ref={ref}
        className={cn(className)}
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
          ...props.PaperProps,
          className: cn(
            'rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 bg-background',
            props.PaperProps?.className
          ),
          elevation: 8,
          sx: {
            width: width || 'auto',
            minWidth: 180,
            maxHeight: 'calc(100% - 96px)',
            ...(props.PaperProps?.sx || {}),
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
