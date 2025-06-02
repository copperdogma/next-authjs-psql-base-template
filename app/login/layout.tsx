import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | {{YOUR_APP_TITLE}}',
  description: 'Sign in to access your account.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
