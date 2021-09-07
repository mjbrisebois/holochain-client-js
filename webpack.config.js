const webpack			= require('webpack');
const TerserPlugin		= require("terser-webpack-plugin");

module.exports = {
    target: 'web',
    mode: 'production', // production | development
    entry: [ './src/index.js' ],
    resolve: {
	mainFields: ["main"],
    },
    output: {
	filename: 'holochain-client.bundled.js',
	globalObject: 'this',
	library: {
	    "name": "HolochainClient",
	    "type": "umd",
	},
    },
    stats: {
	colors: true
    },
    devtool: 'source-map',
    optimization: {
	minimizer: [
	    new TerserPlugin({
		terserOptions: {
		    keep_classnames: true,
		},
	    }),
	],
    },
};
