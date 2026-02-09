/**
 * Accordion Content – Save Component
 *
 * Wraps inner blocks in a region element with role="region".
 * The frontend script manages visibility and animation.
 */

import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function contentSave({ attributes }) {
	const { overrideAnimation } = attributes;

	const blockProps = useBlockProps.save({
		className: 'wp-block-accordion-content',
		role: 'region',
		'data-override-animation': overrideAnimation ? 'true' : 'false',
	});

	const innerBlocksProps = useInnerBlocksProps.save(blockProps);

	return <div {...innerBlocksProps} />;
}
