'use client';

import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { DarkMode, LightMode, BrightnessAuto } from '@mui/icons-material';

interface ThemeMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  currentTheme: string | undefined;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Theme selection menu component
 */
export default function ThemeMenu({
  anchorEl,
  open,
  onClose,
  currentTheme,
  onThemeChange,
}: ThemeMenuProps) {
  // Menu options configuration
  const menuOptions = [
    { value: 'light', label: 'Light', icon: <LightMode fontSize="small" /> },
    { value: 'dark', label: 'Dark', icon: <DarkMode fontSize="small" /> },
    { value: 'system', label: 'System', icon: <BrightnessAuto fontSize="small" /> },
  ] as const;

  return (
    <Menu
      id="theme-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      MenuListProps={{
        'aria-labelledby': 'theme-button',
        dense: true,
      }}
    >
      {menuOptions.map(option => (
        <MenuItem
          key={option.value}
          onClick={() => onThemeChange(option.value)}
          selected={currentTheme === option.value}
          data-testid={`theme-${option.value}`}
        >
          <ListItemIcon>{option.icon}</ListItemIcon>
          <ListItemText>{option.label}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
}
