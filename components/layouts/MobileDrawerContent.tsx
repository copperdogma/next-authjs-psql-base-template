'use client';

import { Box, Typography, Divider, List } from '@mui/material';
import { NavItem, MobileNavItem } from './NavItems';

interface MobileDrawerContentProps {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  onItemClick: () => void;
}

export default function MobileDrawerContent({
  navItems,
  isActive,
  onItemClick,
}: MobileDrawerContentProps) {
  const visibleItems = navItems.filter(item => !item.isVisible || item.isVisible());

  return (
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
              onClick={onItemClick}
            />
          ))}
        </List>
      </Box>
    </Box>
  );
}
