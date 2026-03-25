module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }], // NativeWind v4 ke liye zaroori hai
    ],
    plugins: [ "react-native-reanimated/plugin",],
  };
};