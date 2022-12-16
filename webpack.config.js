const webpack			= require('webpack');
const TerserPlugin		= require("terser-webpack-plugin");

const WEBPACK_MODE		= process.env.WEBPACK_MODE || "production";
const FILENAME			= process.env.FILENAME || "holochain-client.prod.js";


module.exports = {
    target: 'web',
    mode: WEBPACK_MODE,
    entry: [ './src/bootstrap.js' ],
    experiments: {
	asyncWebAssembly: true,
    },
    resolve: {
	mainFields: ["module", "main"],
    },
    output: {
	filename:	FILENAME,
	globalObject:	"this",
	libraryTarget: "window",
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
