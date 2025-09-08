// webpack.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true, // clean dist on rebuild
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },

  // Serve both /public and /dist in dev, so /rates.json is available at /
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/', // expose public/ at root
        watch: true,
      },
      {
        directory: path.join(__dirname, 'dist'),
        publicPath: '/', // keep bundle served as well
        watch: true,
      },
    ],
    compress: true,
    port: 3000,
    allowedHosts: 'all',
    historyApiFallback: true, // SPA routing
    open: false,
  },

  plugins: [
    // Copy public/* into dist on build so /rates.json exists in production
    new CopyWebpackPlugin({
      patterns: [{ from: 'public', to: '.' }],
    }),
  ],

  mode: 'development',
};
