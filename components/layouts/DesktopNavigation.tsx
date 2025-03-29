'use client';

import { Box } from '@mui/material';
import { NavItem, DesktopNavItem, useNavigation } from './NavItems';

interface DesktopNavigationProps {
  /**
   * Array of navigation items to display
   */
  navigationItems: NavItem[];
  /**
   * Whether the current user is authenticated
   */
  isAuthenticated?: boolean;
}

/**
 * Desktop navigation component
 *
 * Displays horizontal navigation links in the app bar for desktop view
 */
export function DesktopNavigation({ navigationItems, isAuthenticated }: DesktopNavigationProps) {
  const { visibleItems, isActive } = useNavigation(navigationItems);

  return (
    <Box
      component="nav"
      aria-label="Main Navigation"
      data-testid="desktop-navigation"
      sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}
    >
      {visibleItems.map(item => (
        <DesktopNavItem key={item.name} item={item} isActive={isActive(item.href)} />
      ))}
    </Box>
  );
}
