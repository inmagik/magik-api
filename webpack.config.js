const path = require('path')

module.exports = {
  entry: './example/index.ts',
  devServer: {
    contentBase: path.join(__dirname, 'example'),
    port: 9000,
    // hot: true,
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      'magik-api': path.resolve('./src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
}
