const merge = require('webpack-merge');
const path = require('path');
const baseWebpackConfig = require('./webpack.base');
const outputPath = path.resolve(__dirname, 'dist/backend');
const config = baseWebpackConfig.config;
delete baseWebpackConfig.config;

module.exports = merge(baseWebpackConfig, {
  entry: path.resolve(__dirname,`src/backend/${config.backendType}-index.js`),
  target: 'node',
  output: {
    path: outputPath,
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  plugins: []
});
