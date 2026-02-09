/**
 * Webpack Configuration for Advanced Accordion
 *
 * Extends the default @wordpress/scripts config to:
 *   - Explicitly define both editor (index) and frontend (view) entries
 *   - Copy child block.json files into build/
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const CopyPlugin = require( 'copy-webpack-plugin' );

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve( __dirname, 'src', 'index.js' ),
		view: path.resolve( __dirname, 'src', 'view.js' ),
	},
	plugins: [
		...( defaultConfig.plugins || [] ),
		new CopyPlugin( {
			patterns: [
				{
					from: path.resolve( __dirname, 'src', 'accordion-item', 'block.json' ),
					to: path.resolve( __dirname, 'build', 'accordion-item', 'block.json' ),
				},
				{
					from: path.resolve( __dirname, 'src', 'accordion-toggle', 'block.json' ),
					to: path.resolve( __dirname, 'build', 'accordion-toggle', 'block.json' ),
				},
				{
					from: path.resolve( __dirname, 'src', 'accordion-content', 'block.json' ),
					to: path.resolve( __dirname, 'build', 'accordion-content', 'block.json' ),
				},
			],
		} ),
	],
};
