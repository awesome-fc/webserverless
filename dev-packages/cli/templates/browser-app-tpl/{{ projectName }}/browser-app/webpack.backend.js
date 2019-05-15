const merge = require('webpack-merge');
const path = require('path');
const baseWebpackConfig = require('./webpack.base');
const outputPath = path.resolve(__dirname, 'dist/http-backend');

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
