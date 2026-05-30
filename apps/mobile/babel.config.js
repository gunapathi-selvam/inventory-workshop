/**
 * Babel config for the Expo app. `babel-preset-expo` (SDK 53) already includes
 * the Expo Router transform, so no extra router plugin is needed.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
