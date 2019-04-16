const merge = require('webpack-merge');
const path = require('path');
const baseWebpackConfig = require('./webpack.base.config');
const outputPath = path.resolve(__dirname, 'dist/{{ backendType }}-backend');

module.exports = merge(baseWebpackConfig, {
  entry: './src/{{ backendType }}-backend/index.js',
  target: 'node',
  output: {
    path: outputPath,
    filename: 'index.js',
    libraryTarget: 'umd'
  },
  plugins: []
});
