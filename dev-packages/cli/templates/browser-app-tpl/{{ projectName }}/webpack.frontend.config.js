const merge = require('webpack-merge');
const path = require('path');
const baseWebpackConfig = require('./webpack.base.config');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const outputPath = path.resolve(__dirname, 'dist/frontend');

module.exports = merge(baseWebpackConfig, {
  entry: './src/frontend/index.js',
  target: 'web',
  node: {
    fs: 'empty',
    child_process: 'empty',
    net: 'empty',
    crypto: 'empty'
  },
  devServer: {
    contentBase: outputPath,
    port: 8000
  },
  output: {
    path: outputPath,
    filename: 'index.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Browser App'
    })
  ],
});