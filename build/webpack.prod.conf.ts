/**
 * @file webpack 开发配置
 */

import merge from 'webpack-merge';
import webpack from 'webpack';
import base from './webpack.base.conf';

const PROD_CONF: webpack.Configuration = merge(base, {
  mode: 'production',

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
  ],

  optimization: {
    minimize: true,
    noEmitOnErrors: true,
  },
});

export default PROD_CONF;
