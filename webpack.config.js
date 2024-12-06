const path = require("path");

const HTMLWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

module.exports = (env, argv) => {
  const { mode } = argv;
  const prod = mode === "production";

  const target = prod ? "browserslist" : "web";
  const devtool = prod ? false : "source-map";

  return {
    mode,
    target,
    devtool,

    optimization: {
      minimize: false,
    },

    devServer: {
      open: true,
      port: 8080,
      hot: true,
      historyApiFallback: {
        disableDotRule: true,
      },
    },

    context: path.resolve(__dirname, "src"),

    entry: ["@babel/polyfill", "./index.jsx"],

    output: {
      path: path.resolve(__dirname, "build"),
      clean: true,
      filename: "bundle.js",
      assetModuleFilename: "[path][name][ext]",
    },

    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: {
        "@components": path.resolve(__dirname, "src/components"),
        "@pages": path.resolve(__dirname, "src/pages"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@utils": path.resolve(__dirname, "src/utils"),
        "@server": path.resolve(__dirname, "src/server"),
        "@app": path.resolve(__dirname, "src/app"),
        "@context": path.resolve(__dirname, "src/context"),
        "@config": path.resolve(__dirname, "src/config"),
      },
    },

    plugins: [
      new HTMLWebPackPlugin({
        template: "../public/index.html",
      }),
      new MiniCssExtractPlugin(),
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "../public",
            globOptions: {
              ignore: ["**/index.html"],
            },
          },
        ],
      }),
      new webpack.ProvidePlugin({
        React: "react",
      }),
      new Dotenv({
        path: "./.env",
        systemvars: true,
      }),
    ],
    module: {
      rules: [
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 10000,
                name: "[name].[ext]",
              },
            },
          ],
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              plugins: [
                "@babel/plugin-syntax-dynamic-import",
                "@babel/plugin-proposal-class-properties",
              ],
            },
          },
        },
        {
          test: /\.(png|jpg|jpeg|svg|gif)$/i,
          type: "asset/resource",
        },
        {
          test: /\.(css|s[ac]ss)$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 1,
                modules: true,
              },
            },
            "postcss-loader",
            "sass-loader",
          ],
          include: /\.module\.css$/,
        },
        {
          test: /\.(css|s[ac]ss)$/,
          use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"],
          exclude: /\.module\.css$/,
        },
        {
          test: /\.html$/,
          use: ["html-loader"],
        },
      ],
    },
  };
};
