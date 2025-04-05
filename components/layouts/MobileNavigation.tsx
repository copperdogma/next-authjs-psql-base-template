'use client';

import { useState } from 'react';
import { Drawer, IconButton } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { NavItem, useNavigation } from './NavItems';
import MobileDrawerContent from './MobileDrawerContent';

interface MobileNavigationProps {
  /**
   * Array of navigation items to display
   */
  navItems: NavItem[];
}

/**
 * Mobile navigation drawer component
 *
 * Provides hamburger menu button and slide-out drawer with navigation items
 */
export default function MobileNavigation({ navItems }: MobileNavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isActive } = useNavigation(navItems);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleItemClick = () => {
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label={drawerOpen ? 'close menu' : 'open menu'}
        edge="end"
        onClick={toggleDrawer}
        sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
        data-testid="mobile-menu-button"
      >
        {drawerOpen ? <CloseIcon /> : <MenuIcon />}
      </IconButton>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: '70%', maxWidth: 300, boxSizing: 'border-box' },
        }}
      >
        <MobileDrawerContent
          navItems={navItems}
          isActive={isActive}
          onItemClick={handleItemClick}
        />
      </Drawer>
    </>
  );
}
