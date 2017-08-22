const _ = require('lodash');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VersionFilePlugin = require('webpack-version-file-plugin');
const ChromeExtensionReloader  = require('webpack-chrome-extension-reloader');

const config = require('./config.js');


module.exports = _.merge({}, config, {
  output: {
    path: path.resolve(__dirname, '../build/dev'),
  },

  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin([
      { from: './src' }
    ], {
      ignore: ['js/**/*', 'manifest.json'],
      copyUnmodified: false
    }),
    new VersionFilePlugin({
      packageFile: path.resolve(__dirname, '../package.json'),
      template: path.resolve(__dirname, '../src/manifest.json'),
      outputFile: path.resolve(__dirname, '../build/dev/manifest.json'),
    }),
    // new ChromeExtensionReloader() // ONLY USE IT IN DEVELOPMENT BUILD!
  ],
  watch: true
});
