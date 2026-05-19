module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
            '@providers': './src/providers',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@types': './src/types',
            '@utils': './src/utils',
            '@assets': './assets',
            '@config': './src/config',
            '@native': './src/native',
          },
        },
      ],
    ],
  };
};
