import { type NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

// Only use bundle analyzer in production
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const config: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Add any custom rules here
      }
    }
  }
};

export default withBundleAnalyzer(config);
