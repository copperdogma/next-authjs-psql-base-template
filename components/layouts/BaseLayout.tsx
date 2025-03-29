'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/app/providers/AuthProvider';
import { Home, Dashboard, Person, Info } from '@mui/icons-material';
import { AppBar, Toolbar, Typography, Button, Box, Container, useTheme } from '@mui/material';
import { NavItem } from './NavItems';
import { SkipToContent } from './SkipToContent';
import MobileNavigation from './MobileNavigation';
import DesktopNavigation from './DesktopNavigation';

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
  const theme = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();

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

      <AppBar position="sticky" color="default" elevation={1} component="header">
        <Toolbar>
          <Typography
            variant="h1"
            component={Link}
            href="/"
            sx={{
              fontSize: '1.25rem', // Same size as h6 but semantically correct h1
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 0,
              mr: 2,
            }}
          >
            {'{{YOUR_APP_NAME}}'}
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <DesktopNavigation navItems={NAVIGATION_ITEMS} pathname={pathname} />
          </Box>

          {/* Right-side controls: Theme toggle and User profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <ThemeToggle />
            <UserProfile />
          </Box>

          {/* Mobile Navigation */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <MobileNavigation navItems={NAVIGATION_ITEMS} pathname={pathname} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        id="main-content"
        aria-label="Main content"
        tabIndex={-1}
        sx={{
          flex: 1,
          outline: 'none', // Remove focus outline when skipped to
          p: { xs: 2, sm: 3 }, // Add responsive padding for better spacing
        }}
      >
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          backgroundColor:
            theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[900],
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} {'{{YOUR_COMPANY_NAME}}'} All rights reserved.
          </Typography>
          <Box
            component="nav"
            aria-label="Footer Navigation"
            data-testid="footer-navigation"
            sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}
          >
            <Button component={Link} href="/privacy" color="inherit" size="small">
              Privacy
            </Button>
            <Button component={Link} href="/terms" color="inherit" size="small">
              Terms
            </Button>
            <Button component={Link} href="/contact" color="inherit" size="small">
              Contact
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
