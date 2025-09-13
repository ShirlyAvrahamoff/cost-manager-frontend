// webpack.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,          // JS & JSX
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // Force presets here so JSX is always transformed
            presets: [
              ['@babel/preset-env', { targets: { browsers: 'defaults' } }],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  devServer: {
    static: [
      { directory: path.join(__dirname, 'public'), publicPath: '/', watch: true },
      { directory: path.join(__dirname, 'dist'),   publicPath: '/', watch: true },
    ],
    compress: true,
    port: 3000,
    allowedHosts: 'all',
    historyApiFallback: true,
    open: false,
  },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: 'public', to: '.' }] }),
  ],
  mode: 'development',
};
