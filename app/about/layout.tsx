import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | {{YOUR_APP_TITLE}}',
  description: 'Learn more about {{YOUR_PROJECT_NAME}} and its mission.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
