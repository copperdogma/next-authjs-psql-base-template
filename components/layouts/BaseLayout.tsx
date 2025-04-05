'use client';

import { useSession } from 'next-auth/react';
import { Home, Dashboard, Person, Info } from '@mui/icons-material';
import { Box } from '@mui/material';
import { NavItem } from './NavItems';
import { SkipToContent } from './SkipToContent';
import ApplicationHeader from './ApplicationHeader';
import ApplicationFooter from './ApplicationFooter';
import MainContent from './MainContent';

/**
 * Base layout component that provides the main application structure
 *
 * Features:
 * - Responsive navigation header with mobile/desktop views
 * - Main content area
 * - Footer with links
 * - Theme toggle
 * - User profile
 * - Skip to content link for accessibility
 */
export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;

  // Define the navigation links with icons and visibility rules
  const NAVIGATION_ITEMS: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: <Home fontSize="small" />,
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Dashboard fontSize="small" />,
      isVisible: () => Boolean(user),
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: <Person fontSize="small" />,
      isVisible: () => Boolean(user),
    },
    {
      name: 'About',
      href: '/about',
      icon: <Info fontSize="small" />,
    },
  ];

  return (
    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Skip to content link for accessibility */}
      <SkipToContent />
      <ApplicationHeader navItems={NAVIGATION_ITEMS} />
      <MainContent>{children}</MainContent>
      <ApplicationFooter />
    </Box>
  );
}
