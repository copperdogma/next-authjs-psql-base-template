'use client';

import {
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  MenuProps as MuiMenuProps,
  MenuItemProps as MuiMenuItemProps,
} from '@mui/material';
import { forwardRef, ReactNode } from 'react';

export interface MenuItemProps extends MuiMenuItemProps {
  icon?: ReactNode;
}

export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>(
  ({ icon, children, className = '', ...props }, ref) => {
    return (
      <MuiMenuItem
        {...props}
        ref={ref}
        className={`flex items-center gap-2 ${className}`}
      >
        {icon && <span className="text-xl">{icon}</span>}
        {children}
      </MuiMenuItem>
    );
  }
);

MenuItem.displayName = 'MenuItem';

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

export default Menu; 