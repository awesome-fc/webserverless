const merge = require('webpack-merge');
const path = require('path');
const yargs = require('yargs');
const baseWebpackConfig = require('./webpack.base');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const outputPath = path.resolve(__dirname, 'dist/frontend');
const { mode } = yargs.option('mode', {
  description: "Mode to use",
  choices: ['development', 'production'],
  default: 'production'
}).argv;

module.exports = merge(baseWebpackConfig, {
  entry: {
    config: path.resolve(__dirname, `src/frontend/config.remote.js`),
    app: path.resolve(__dirname, 'src/frontend/index.js')
  },
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
    filename: '[name].[chunkhash].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Browser App'
    })
  ],
});