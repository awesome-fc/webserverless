const merge = require('webpack-merge');
const path = require('path');
const baseWebpackConfig = require('./webpack.base');
const outputPath = path.resolve(__dirname, 'dist/backend');

module.exports = merge(baseWebpackConfig, {
  entry: path.resolve(__dirname,`src/backend/${baseWebpackConfig.config.backendType}-index.js`),
  target: 'node',
  output: {
    path: outputPath,
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  plugins: []
});
