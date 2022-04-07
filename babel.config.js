module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      'tsconfig-paths-module-resolver',
      {
        root: ['./src'],
        alias: {
          '@core': ['./core'],
          '@util': ['./util'],
          '@domain': ['./domain'],
          '@configs': ['./configs'],
        },
      },
    ],
    'babel-plugin-transform-typescript-metadata',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ],
};
