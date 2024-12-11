require('@babel/register')({
	extensions: ['.js', '.mjs'], 
	presets: [["@babel/preset-env", { "modules": "auto" }]],
	plugins: [
		["@babel/plugin-transform-modules-commonjs"],
		["babel-plugin-transform-import-meta"],
	],
	ignore: [/node_modules/],
});

require('./src/cli');
