const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: './gitment.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist/browser'),
    filename: 'gitment.min.js',
    libraryTarget: 'var',
    library: 'Gitment',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /^node_mocules/,
        loaders: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new UglifyJSPlugin()
  ],
}
