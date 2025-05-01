'use client';

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from 'next/link'; // Use Next.js Link for navigation
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // To highlight active link
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoIcon from '@mui/icons-material/Info';
import UserProfile from '@/components/auth/UserProfile'; // Restore import
import ThemeToggle from '@/components/ui/ThemeToggle'; // Import ThemeToggle
import LoginIcon from '@mui/icons-material/Login'; // Import LoginIcon

// Define navigation links including public/private status
const navItems = [
  { name: 'Home', path: '/', icon: <HomeIcon />, public: true },
  { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, public: false },
  { name: 'Profile', path: '/profile', icon: <AccountCircleIcon />, public: false },
  { name: 'About', path: '/about', icon: <InfoIcon />, public: true },
];

const Header: React.FC = () => {
  const { status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === 'authenticated';

  const displayedNavItems = navItems.filter(item => item.public || isAuthenticated);

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* App Name */}
          <Typography variant="h6" noWrap component="div" sx={{ mr: 2 }}>
            {'{YOUR_APP_NAME}'}
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            {displayedNavItems.map(item => (
              <Button
                key={item.name}
                component={Link}
                href={item.path}
                startIcon={item.icon}
                sx={{
                  color: 'inherit',
                  textTransform: 'none',
                  border: pathname === item.path ? '1px solid' : 'none',
                  borderColor: theme => theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Right side: Theme Toggle and Auth Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle />
            {status === 'loading' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Optional loading indicator */}
              </Box>
            )}
            {status === 'authenticated' && <UserProfile />} {/* Restore UserProfile */}
            {status === 'unauthenticated' && (
              <Button
                component={Link}
                href="/login"
                color="inherit"
                startIcon={<LoginIcon />}
                sx={{ textTransform: 'none' }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
