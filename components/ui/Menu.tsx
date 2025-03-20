'use client';

import {
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuProps as MuiMenuProps,
  MenuItemProps as MuiMenuItemProps,
} from '@mui/material';
import { forwardRef, ReactNode, memo } from 'react';

export interface MenuItemProps extends MuiMenuItemProps {
  icon?: ReactNode;
}

const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(
  ({ children, icon, ...props }, ref) => {
    return (
      <MuiMenuItem
        {...props}
        ref={ref}
        className={`flex items-center gap-2 ${props.className || ''}`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </MuiMenuItem>
    );
  }
);

MenuItem.displayName = 'MenuItem';

// Memoize MenuItem to prevent unnecessary re-renders
export const MemoMenuItem = memo(MenuItem);

interface MenuProps extends MuiMenuProps {
  children: ReactNode;
}

const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <MuiMenu
        {...props}
        ref={ref}
        className={`${className}`}
        PaperProps={{
          ...props.PaperProps,
          className: `bg-background shadow-lg ${props.PaperProps?.className || ''}`,
        }}
      >
        {children}
      </MuiMenu>
    );
  }
);

Menu.displayName = 'Menu';

// Memoize Menu component to prevent unnecessary re-renders
const MemoMenu = memo(Menu);
export default MemoMenu;
export { MenuItem }; 