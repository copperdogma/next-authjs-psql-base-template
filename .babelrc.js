module.exports = api => {
  // This conditional check ensures Babel only runs in test environments
  const isTest = api.env('test');

  // This cache statement ensures the configuration is generated only once per environment
  api.cache.using(() => process.env.NODE_ENV);

  if (isTest) {
    // Babel configuration for test environment only
    // This is needed because jest-environment-jsdom requires Babel for JSX transformation
    // SWC is used for all non-test environments
    return {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
        [
          '@babel/preset-typescript',
          {
            isTSX: true,
            allExtensions: true,
            runtime: 'automatic',
          },
        ],
        [
          'next/babel',
          {
            'preset-react': {
              runtime: 'automatic',
              importSource: 'react',
            },
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-typescript',
          {
            allowDeclareFields: true,
            runtime: 'automatic',
          },
        ],
        '@babel/plugin-syntax-jsx',
        '@babel/plugin-syntax-flow',
      ],
      env: {
        test: {
          plugins: ['@babel/plugin-transform-modules-commonjs'],
        },
      },
    };
  }

  // Empty configuration for non-test environments
  // This ensures SWC is used for development and production
  return {
    presets: [],
  };
};
