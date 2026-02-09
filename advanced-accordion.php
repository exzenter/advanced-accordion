<?php
/**
 * Plugin Name:       Advanced Accordion
 * Plugin URI:        https://example.com/advanced-accordion
 * Description:       An advanced accordion block with linked groups, animation controls, keyboard navigation, and full accessibility support.
 * Version:           1.0.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       advanced-accordion
 *
 * @package AdvancedAccordion
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Prevent direct access.
}

/**
 * Register all blocks that make up the Advanced Accordion system.
 *
 * Each block has its own block.json inside src/<block-name>/.
 * The main container block.json lives at src/block.json and
 * references the compiled assets in build/.
 */
function advanced_accordion_register_blocks() {
	// Main container block – its block.json points to the compiled JS/CSS.
	register_block_type( __DIR__ . '/build' );

	// Child blocks are registered from their source block.json files.
	// WordPress will resolve their scripts/styles from the parent build.
	register_block_type( __DIR__ . '/build/accordion-item' );
	register_block_type( __DIR__ . '/build/accordion-toggle' );
	register_block_type( __DIR__ . '/build/accordion-content' );
}
add_action( 'init', 'advanced_accordion_register_blocks' );

/**
 * Register the block category if it doesn't already exist.
 *
 * @param array[]                 $categories Array of block categories.
 * @param WP_Block_Editor_Context $context    Block editor context.
 * @return array[]
 */
function advanced_accordion_block_categories( $categories, $context ) {
	// The block uses the built-in "design" category, so no custom category
	// is strictly necessary. This filter is kept as a hook point in case
	// a custom category is desired in the future.
	return $categories;
}
add_filter( 'block_categories_all', 'advanced_accordion_block_categories', 10, 2 );

/**
 * Enqueue the frontend view script only when the block is present on the page.
 *
 * This is handled automatically by the viewScript field in block.json,
 * but we add a fallback for themes that don't support block asset loading.
 */
function advanced_accordion_enqueue_view_script() {
	if ( has_block( 'asuspended/advanced-accordion' ) ) {
		$asset_file = __DIR__ . '/build/view.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => '1.0.1',
			);

		wp_enqueue_script(
			'advanced-accordion-view',
			plugins_url( 'build/view.js', __FILE__ ),
			$asset['dependencies'],
			$asset['version'],
			true // Load in footer.
		);
	}
}
add_action( 'wp_enqueue_scripts', 'advanced_accordion_enqueue_view_script' );
