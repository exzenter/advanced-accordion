/**
 * Accordion Content – Deprecated Versions
 *
 * Handles blocks saved with previous save formats to prevent validation errors.
 */

import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const deprecated = [
	{
		attributes: {
			overridePadding: {
				type: 'boolean',
				default: false,
			},
			overrideAnimation: {
				type: 'boolean',
				default: false,
			},
		},
		save({ attributes }) {
			const { overrideAnimation } = attributes;

			const blockProps = useBlockProps.save({
				className: 'wp-block-accordion-content',
				role: 'region',
				'data-override-animation': overrideAnimation ? 'true' : 'false',
			});

			const innerBlocksProps = useInnerBlocksProps.save(blockProps);

			return <div {...innerBlocksProps} />;
		},
	},
];

export default deprecated;
