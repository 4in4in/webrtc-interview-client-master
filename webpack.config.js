const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  mode: 'development',

  output: {
    path: path.resolve(__dirname, 'build'),
  },

  plugins: [new webpack.ProgressPlugin()],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'babel-loader',
      },
      {
        test: /.css$/,

        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',

            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },

  devServer: {
    https: {
        key: fs.readFileSync('certs/privkey.pem'),
        cert: fs.readFileSync('certs/tmp/cert.pem')
    },
    host: '0.0.0.0',
    port: 6971,
  },
  devtool: 'source-map',
};
