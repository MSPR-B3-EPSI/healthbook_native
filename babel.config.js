module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated v4 : plugin worklets (remplace l'ancien react-native-reanimated/plugin).
    // DOIT rester en dernier.
    plugins: ['react-native-worklets/plugin'],
  };
};
