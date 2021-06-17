// Overriding CreateReactApp settings, ref: https://github.com/arackaf/customize-cra

// also includes settings for creating an extension,
// combining create-react-app + webextension stuff https://www.rubberduck.io/blog/browser-extensions-react/
const path = require('path');
const WebpackExtensionReloader = require('webpack-extension-reloader');
const WriteFilePlugin = require('write-file-webpack-plugin');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const SriPlugin = require('webpack-subresource-integrity');

const fs = require('fs-extra');
const antdTheme = require('./src/theme.js');

const {
  override,
  fixBabelImports,
  addLessLoader,
  //useEslintRc,
  addDecoratorsLegacy,
} = require('customize-cra');

const publicPathPlugin = () => config => {
  let buildPath = './build';

  config.output = {
    path: path.join(__dirname, buildPath)
  };
  config.plugins.push(new WriteFilePlugin());
  fs.removeSync(buildPath);
  fs.copySync('./public/', buildPath);

  return config;
};

const shellPlugin = () => config => {
  config.plugins.push(new WebpackShellPluginNext({
    onBuildStart:{
      scripts:['echo "build starting"'],
      blocking: true,
      parallel: false
    } 
  }));
  return config;
};

const sirPlugin = () => config => {
  config.plugins.push(new SriPlugin({
    hashFuncNames: ['sha512'],
    enabled: process.env.NODE_ENV === 'production',
  }));
  if (!config.output){
    config.output = {};
  }
  config.output.crossOriginLoading = 'anonymous';

  return config;
};

const webExtensionPlugin = () => config => {
  let publicPath = './build';

  config.plugins.push(new WebpackExtensionReloader({
    manifest: path.resolve(__dirname + publicPath, 'manifest.json')
  }));
  return config;
};

module.exports = override(
  addDecoratorsLegacy(),
  //useEslintRc(),
  fixBabelImports('import', {
    libraryName: 'antd', libraryDirectory: 'es', style: true
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: antdTheme
  }),
  publicPathPlugin(),
  shellPlugin(),
  sirPlugin()
);
