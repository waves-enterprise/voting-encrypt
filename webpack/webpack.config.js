const webpack = require('webpack');
const path = require('path');
const devConfig = require('./webpack.dev.config');
const prodConfig = require('./webpack.prod.config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


const {
  SRC_DIR,
  BUILD_DIR,
  isDevelopment,
  isProduction
} = require('./constants');

const baseConfig = {
  devtool: 'source-map',
  target: 'node',
  node: {
    process: false
  },
  entry: {
    index: path.resolve(SRC_DIR, 'index.ts')
  },
  output: {
    filename: '[name].js',
    path: BUILD_DIR,
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {},
  resolve: {
    extensions: ['.js', '.ts']
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader"
        }
      }
    ]
  }
};

let config = null;

if (isProduction) {
  config = prodConfig(baseConfig);
} else if (isDevelopment) {
  config = devConfig(baseConfig);
}

module.exports = config;
