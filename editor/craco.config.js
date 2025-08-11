const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Disable code splitting for VS Code webview compatibility
      webpackConfig.optimization.splitChunks = {
        cacheGroups: { 
          default: false 
        }
      };
      
      // Move runtime into bundle instead of separate file
      webpackConfig.optimization.runtimeChunk = false;

      // Force static filenames (no hash) for consistent webview loading
      webpackConfig.output.filename = 'static/js/main.js';
      
      // Configure CSS extraction with static filename
      const miniCssPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      if (miniCssPlugin) {
        miniCssPlugin.options.filename = 'static/css/main.css';
        miniCssPlugin.options.chunkFilename = 'static/css/main.css';
      }

      // Increase inline file size limit to reduce separate asset files
      const fileLoaderRule = webpackConfig.module.rules.find(rule => {
        return rule.oneOf && rule.oneOf.find(oneOf => 
          oneOf.type === 'asset/resource' || 
          (oneOf.test && oneOf.test.toString().includes('\\.('))
        );
      });
      
      if (fileLoaderRule && fileLoaderRule.oneOf) {
        const assetRule = fileLoaderRule.oneOf.find(rule => 
          rule.type === 'asset' && rule.parser
        );
        if (assetRule && assetRule.parser && assetRule.parser.dataUrlCondition) {
          assetRule.parser.dataUrlCondition.maxSize = 50000; // 50KB limit
        }
      }

      return webpackConfig;
    }
  }
};
