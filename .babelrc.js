module.exports = {
  presets: ['next/babel'],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        ['@babel/plugin-transform-modules-commonjs'],
        ['@babel/plugin-transform-runtime', { regenerator: true }],
      ],
    },
  },
};
