'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoIcon from '@mui/icons-material/Info';
import UserProfile from '@/components/auth/UserProfile';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LoginIcon from '@mui/icons-material/Login';
import MobileNavigation from './MobileNavigation';
import DesktopNavigation from './DesktopNavigation';

// Define navigation links including public/private status
export const navItems = [
  { name: 'Home', path: '/', href: '/', icon: <HomeIcon />, public: true },
  {
    name: 'Dashboard',
    path: '/dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
    public: false,
  },
  {
    name: 'Profile',
    path: '/profile',
    href: '/profile',
    icon: <AccountCircleIcon />,
    public: false,
  },
  { name: 'About', path: '/about', href: '/about', icon: <InfoIcon />, public: true },
];

interface AuthSectionProps {
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

const AuthSection: React.FC<AuthSectionProps> = ({ status }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <ThemeToggle />
    {status === 'loading' && (
      <Box sx={{ width: 100, textAlign: 'center' }}>{/* Optional loading indicator */}</Box>
    )}
    {status === 'authenticated' && <UserProfile />}
    {status === 'unauthenticated' && (
      <Button
        component={Link}
        href="/login"
        variant="outlined"
        color="inherit"
        startIcon={<LoginIcon />}
        sx={{ ml: 1 }}
      >
        Login
      </Button>
    )}
  </Box>
);

/**
 * Header component providing navigation and authentication UI.
 */
const Header: React.FC = () => {
  const { status } = useSession();
  const _pathname = usePathname();
  const isAuthenticated = status === 'authenticated';

  // Filter navigation items based on authentication status
  const filteredNavItems = navItems.map(item => ({
    ...item,
    isVisible: () => item.public || isAuthenticated,
  }));

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Link
            href="/"
            passHref
            legacyBehavior={false}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', mr: 2, '&:hover': { opacity: 0.8 } }}
            >
              {'{YOUR_APP_NAME}'}
            </Typography>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <DesktopNavigation navItems={filteredNavItems} />

          {/* Auth section with theme toggle and profile/login */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AuthSection status={status} />

            {/* Mobile Navigation - Hidden on desktop */}
            <MobileNavigation navItems={filteredNavItems} />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
