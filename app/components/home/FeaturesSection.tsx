'use client';

import Box from '@mui/material/Box';
import FeatureCard from './FeatureCard';

export default function FeaturesSection() {
  const features = [
    {
      title: 'Next.js',
      description:
        'Modern React framework with server-side rendering, file-based routing, and optimized performance.',
    },
    {
      title: 'NextAuth.js',
      description:
        'Secure user authentication with Google sign-in and session management built in.',
    },
    {
      title: 'PostgreSQL',
      description:
        'Powerful relational database integration for robust data storage and management.',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {features.map(feature => (
        <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
      ))}
    </Box>
  );
}
