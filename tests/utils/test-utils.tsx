'use client';

import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode, useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';
import { TestRenderResult, MockUser } from './test-types';
import { SessionFixtures } from './test-fixtures';

type WrapperProps = {
  children: ReactNode;
};

type CustomRenderOptions = RenderOptions & {
  wrapper?: (props: WrapperProps) => ReactElement;
};

type SessionWithUser = Session;

export const renderWithProviders = (
  ui: ReactElement,
  session: SessionWithUser | null = null,
  options?: Omit<CustomRenderOptions, 'wrapper'>
): TestRenderResult => {
  const Wrapper = ({ children }: WrapperProps) => {
    const testTheme = useMemo(() => createAppTheme('light'), []);

    return (
      <MuiThemeProvider theme={testTheme}>
        <CssBaseline />
        <SessionProvider session={session}>{children}</SessionProvider>
      </MuiThemeProvider>
    );
  };

  const result = render(ui, { wrapper: Wrapper, ...options });
  const user = userEvent.setup();

  return {
    ...result,
    user,
  } as TestRenderResult;
};

export const renderWithSession = (
  ui: ReactElement,
  session: SessionWithUser | null = null
): TestRenderResult => {
  return renderWithProviders(ui, session);
};

export const renderWithAuth = (
  ui: ReactElement,
  mockUser: Partial<MockUser> = {}
): TestRenderResult => {
  const session = SessionFixtures.authenticated(mockUser) as SessionWithUser;
  return renderWithSession(ui, session);
};

export const renderWithAuthenticatedSession = (
  ui: ReactElement,
  mockUser: Partial<MockUser> = {}
): TestRenderResult => {
  const session = SessionFixtures.authenticated(mockUser) as SessionWithUser;
  return renderWithSession(ui, session);
};

export * from '@testing-library/react';
export { renderWithProviders as render };
