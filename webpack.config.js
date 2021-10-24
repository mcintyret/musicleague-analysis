const webpack = require("webpack");
const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Module loaders for .less files, used in reverse order (compile Less, apply PostCSS, interpret CSS as modules)
const lessLoaders = [
    require.resolve("style-loader"),
    {
        loader: require.resolve("css-loader"),
        options: { minimize: IS_PRODUCTION },
    },
    require.resolve("less-loader"),
];

const config = {
    entry: {
        app: [
            path.resolve(__dirname, "src/index.tsx"),
            path.resolve(__dirname, "src/index.less"),
        ],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "build/"),
        publicPath: "/",
    },
    devtool: IS_PRODUCTION ? false : "source-map",
    devServer: {
        historyApiFallback: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: require.resolve("ts-loader"),
                },
            },
            {
                test: /\.less$/,
                use:  lessLoaders,
            },
            {
                test: /\.(woff|woff2)$/,
                use: {
                    loader: "url-loader",
                    options: {
                        name: "fonts/[hash].[ext]",
                        limit: 5000,
                        mimetype: "application/font-woff",
                    },
                },
            }, {
                test: /\.(ttf|eot|svg)$/,
                use: {
                    loader: "file-loader",
                    options: {
                        name: "fonts/[hash].[ext]",
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx", ".less", ".ts", ".tsx"],
    },
    plugins: IS_PRODUCTION ? [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"),
            },
        }),
        new webpack.LoaderOptionsPlugin({
            debug: false,
            minimize: true,
        }),
        new UglifyJsPlugin({
            parallel: true,
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve("index.html"),
            filename: "musicleague-analysis.html",
        }),
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [".*\.js", ".*\.css"])
    ] : [],
};

module.exports = config;
