/**
 * Accordion Content – Edit Component
 *
 * The collapsible body of an accordion item. Accepts any inner blocks
 * (paragraphs, images, lists, etc.).
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

const TEMPLATE = [
	[ 'core/paragraph', { placeholder: 'Add accordion content…' } ],
];

export default function ContentEdit( { attributes, setAttributes } ) {
	const { overridePadding, overrideAnimation } = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-accordion-content',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateLock: false,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Content Settings', 'advanced-accordion' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __(
							'Override padding from parent',
							'advanced-accordion'
						) }
						help={ __(
							'When enabled, padding set on this block takes precedence.',
							'advanced-accordion'
						) }
						checked={ overridePadding }
						onChange={ ( val ) =>
							setAttributes( { overridePadding: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Override animation from parent',
							'advanced-accordion'
						) }
						help={ __(
							'When enabled, animation settings on the parent item or container are ignored.',
							'advanced-accordion'
						) }
						checked={ overrideAnimation }
						onChange={ ( val ) =>
							setAttributes( { overrideAnimation: val } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...innerBlocksProps } />
		</>
	);
}
