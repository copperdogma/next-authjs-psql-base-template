'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UserProfile from '@/components/auth/UserProfile';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import { NavItem } from './NavItems';

interface ApplicationHeaderProps {
  navItems: NavItem[];
}

export default function ApplicationHeader({ navItems }: ApplicationHeaderProps) {
  return (
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
          <DesktopNavigation navItems={navItems} />
        </Box>

        {/* Right-side controls: Theme toggle and User profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <ThemeToggle />
          <UserProfile />
        </Box>

        {/* Mobile Navigation */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <MobileNavigation navItems={navItems} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
