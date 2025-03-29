'use client';

import { useState } from 'react';
import { Drawer, Box, IconButton, Typography, Divider, List } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { NavItem, MobileNavItem, useNavigation } from './NavItems';

interface MobileNavigationProps {
  /**
   * Array of navigation items to display
   */
  navItems: NavItem[];
  pathname: string | null;
}

/**
 * Mobile navigation drawer component
 *
 * Provides hamburger menu button and slide-out drawer with navigation items
 */
export default function MobileNavigation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { navItems, pathname }: MobileNavigationProps
) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { visibleItems, isActive } = useNavigation(navItems);

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
        <Box sx={{ width: '100%', pt: 2, px: 2 }} role="presentation">
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
            Menu
          </Typography>
          <Divider />
          <Box component="nav" aria-label="Mobile Navigation" data-testid="mobile-navigation">
            <List>
              {visibleItems.map(item => (
                <MobileNavItem
                  key={item.name}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={handleItemClick}
                />
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
