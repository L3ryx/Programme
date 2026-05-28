module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // En production : obfuscation du code
      ...(process.env.NODE_ENV === 'production'
        ? [
            [
              'babel-plugin-obfuscator',
              {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: true,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                rotateStringArray: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                stringArrayThreshold: 0.75,
              },
            ],
          ]
        : []),
    ],
  };
};
