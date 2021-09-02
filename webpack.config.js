const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const extensionConfig = {
	target: "node",
	entry: './src/extension/index.ts',
	output: {
		filename: 'index.js',
		path: path.join(__dirname, 'extension'),
		libraryTarget: 'commonjs2'
	},
	mode: 'production',
	devtool: 'source-map',
	externals: [nodeExternals()],
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: [
								[
									'@babel/preset-env',
									{modules: 'commonjs'}
								]
							],
							plugins: ['add-module-exports']
						}
					},
					'ts-loader',
				],
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								'@babel/preset-env',
								{modules: 'commonjs'}
							]
						],
						plugins: ['add-module-exports']
					}
				}
			}
		]
	},
	performance: {
		hints: false
	}
};

// Add more dashboard panel names here as needed
const dashboardNames = [
	'twitch-auth',
	'twitch-events',
	'test-twitch',
	'twitch-clips',
];

let dashboardEntries = {}, dashboardPlugins = [];
dashboardNames.forEach(name => {
	dashboardEntries[name] = [`./src/dashboard/${name}.tsx`];
	dashboardPlugins.push(new HtmlWebpackPlugin({
		filename: `${name}.html`,
		template: `./src/dashboard/${name}.html`,
		chunks: [name]
	}));
});

const dashboardConfig = {
	entry: dashboardEntries,
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'dashboard')
	},
	plugins: dashboardPlugins,
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.ts(x?)$/,
				use: 'ts-loader',
			},
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	mode: 'production'
};

// Add more graphics names here as needed
const graphicNames = [
	'twitch-clips'
];

let graphicEntries = {}, graphicPlugins = [];
graphicNames.forEach(name => {
	graphicEntries[name] = [`./src/graphics/${name}.tsx`];
	graphicPlugins.push(new HtmlWebpackPlugin({
		filename: `${name}.html`,
		template: `./src/graphics/${name}.html`,
		chunks: [name]
	}));
});

const graphicsConfig = {
	entry: graphicEntries,
	output: {
		filename: '[name].js',
		path: path.join(__dirname, 'graphics')
	},
	plugins: graphicPlugins,
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.ts(x?)$/,
				use: 'ts-loader',
			},
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	mode: 'production'
};

module.exports = [
	extensionConfig,
	dashboardConfig,
	graphicsConfig,
];
