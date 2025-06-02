import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | {{YOUR_APP_TITLE}}',
  description: 'Create a new account to get started.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
