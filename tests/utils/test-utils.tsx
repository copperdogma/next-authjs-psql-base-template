'use client';

import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { TestRenderResult, MockUser } from './test-types';
import { SessionFixtures } from './test-fixtures';

type WrapperProps = {
  children: ReactNode;
};

type CustomRenderOptions = RenderOptions & {
  wrapper?: (props: WrapperProps) => ReactElement;
};

type SessionWithUser = Session & {
  user: MockUser & { id: string };
  expires: string;
};

export const withSessionProvider = (
  ui: ReactElement,
  session: SessionWithUser | null = null
): ReactElement => {
  const Wrapper = ({ children }: WrapperProps) => (
    <SessionProvider session={session}>{children}</SessionProvider>
  );

  return <Wrapper>{ui}</Wrapper>;
};

export const renderWithSession = (
  ui: ReactElement,
  session: SessionWithUser | null = null
): TestRenderResult => {
  const wrapper = ({ children }: WrapperProps) => (
    <SessionProvider session={session}>{children}</SessionProvider>
  );

  const result = render(ui, { wrapper } as CustomRenderOptions);
  const user = userEvent.setup();

  return {
    ...result,
    user,
  } as TestRenderResult;
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

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { renderWithSession as render };
