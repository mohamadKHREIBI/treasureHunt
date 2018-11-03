const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    node: {
        fs: 'empty'
      },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000
      },
    entry: { main: './src/js/main.js' },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    resolve: {
      extensions: [".ts", ".js", ".txt", ".json", ".css", ".less", ".scss", ".saas"],
      alias: {
          "myjqPlugin": path.resolve("./src/js/jquery-1.4.2.js"),
          "jquery": require.resolve("jquery"), // --> node_modules\jquery\dist\jquery.js   
      },
    },
  module: {
    rules: [
      {
        use: "exports-loader?window['jQuery']",
        test: /jQuery.1.4.2.js$/
    },  
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract(
          {
            fallback: 'style-loader',
            use: ['css-loader']
          })
      }
    ]
  },
  plugins: [ 
    new ExtractTextPlugin({filename: 'style.css'}),
    new HtmlWebpackPlugin(
        {
            template: 'src/index.html'
        }
    )
  ]
};