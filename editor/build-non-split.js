const rewire = require('rewire');
const defaults = rewire('react-scripts/scripts/build.js');
const config = defaults.__get__('config');

// Consolidate chunk files instead
config.optimization.splitChunks = {
  cacheGroups: {
    default: false,
  },
};
// Move runtime into bundle instead of separate file
config.optimization.runtimeChunk = false;

// JS
config.output.filename = 'static/js/main.js';

// CSS. "5" is MiniCssPlugin
config.plugins[5].options.filename = 'static/css/main.css';

// Fix the file size embedding limit
config.module.rules[2].oneOf[0].options.limit = 50000;
