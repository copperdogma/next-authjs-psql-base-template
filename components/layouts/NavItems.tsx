'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, ListItem, ListItemText, SxProps, Theme } from '@mui/material';

/**
 * Navigation item definition
 */
export interface NavItem {
  /**
   * Display name in the navigation
   */
  name: string;
  /**
   * Path to navigate to
   */
  href: string;
  /**
   * Optional icon to display
   */
  icon?: ReactNode;
  /**
   * Function to determine if this item should be shown
   */
  isVisible?: () => boolean;
}

/**
 * Props for MobileNavItem component
 */
interface MobileNavItemProps {
  /**
   * The navigation item to render
   */
  item: NavItem;
  /**
   * Whether the item is currently active
   */
  isActive: boolean;
  /**
   * Function to call when clicked
   */
  onClick?: () => void;
}

/**
 * Props for DesktopNavItem component
 */
interface DesktopNavItemProps {
  /**
   * The navigation item to render
   */
  item: NavItem;
  /**
   * Whether the item is currently active
   */
  isActive: boolean;
  /**
   * Optional custom styling
   */
  sx?: SxProps<Theme>;
}

/**
 * Navigation item component for mobile view
 */
export function MobileNavItem({ item, isActive, onClick }: MobileNavItemProps) {
  return (
    <ListItem
      key={item.name}
      component={Link}
      href={item.href}
      onClick={onClick}
      sx={{
        color: isActive ? 'primary.main' : 'text.primary',
        fontWeight: isActive ? 'bold' : 'normal',
        textDecoration: 'none',
      }}
    >
      {item.icon && (
        <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </span>
      )}
      <ListItemText primary={item.name} />
    </ListItem>
  );
}

/**
 * Navigation item component for desktop view
 */
export function DesktopNavItem({ item, isActive, sx }: DesktopNavItemProps) {
  return (
    <Button
      key={item.name}
      component={Link}
      href={item.href}
      color={isActive ? 'primary' : 'inherit'}
      startIcon={item.icon}
      sx={{
        mx: 1,
        fontWeight: isActive ? 'bold' : 'normal',
        ...sx,
      }}
    >
      {item.name}
    </Button>
  );
}

/**
 * Custom hook that provides active state checking for navigation
 */
export function useNavigation(items: NavItem[]) {
  const pathname = usePathname();

  // Check if a path is currently active
  const isActive = (path: string) => pathname === path;

  // Filter items by visibility (if applicable)
  const visibleItems = items.filter(item => {
    if (item.isVisible) {
      return item.isVisible();
    }
    return true;
  });

  return {
    visibleItems,
    isActive,
  };
}
