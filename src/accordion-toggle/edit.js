/**
 * Accordion Toggle – Edit Component
 *
 * The clickable heading area. Uses RichText for the heading and shows an
 * optional expand/collapse icon. In the editor this also supports per-toggle
 * settings like heading level, icon position, and custom icon upload.
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	RichText,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Button,
} from '@wordpress/components';

const HEADING_OPTIONS = [
	{ label: 'H2', value: 'h2' },
	{ label: 'H3', value: 'h3' },
	{ label: 'H4', value: 'h4' },
	{ label: 'H5', value: 'h5' },
	{ label: 'H6', value: 'h6' },
	{ label: 'Span (no heading)', value: 'span' },
];

const ICON_POSITION_OPTIONS = [
	{ label: 'Inherit from container', value: '' },
	{ label: 'Right', value: 'right' },
	{ label: 'Left', value: 'left' },
	{ label: 'None', value: 'none' },
];

export default function ToggleEdit( { attributes, setAttributes } ) {
	const {
		heading,
		headingTag,
		iconPosition,
		customIcon,
		customIconId,
		iconRotation,
	} = attributes;

	const blockProps = useBlockProps( {
		className: `wp-block-accordion-toggle`,
	} );

	const HeadingTag = headingTag || 'h3';

	const iconMarkup = (
		<span className="aa-toggle-icon" aria-hidden="true">
			{ customIcon ? (
				<img src={ customIcon } alt="" className="aa-toggle-icon-custom" />
			) : (
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			) }
		</span>
	);

	const showIcon = iconPosition !== 'none';
	const isLeft = iconPosition === 'left';

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Toggle Settings', 'advanced-accordion' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Heading Level', 'advanced-accordion' ) }
						value={ headingTag }
						options={ HEADING_OPTIONS }
						onChange={ ( val ) =>
							setAttributes( { headingTag: val } )
						}
					/>
					<SelectControl
						label={ __( 'Icon Position', 'advanced-accordion' ) }
						value={ iconPosition }
						options={ ICON_POSITION_OPTIONS }
						onChange={ ( val ) =>
							setAttributes( { iconPosition: val } )
						}
					/>
					<ToggleControl
						label={ __(
							'Rotate icon on open',
							'advanced-accordion'
						) }
						checked={ iconRotation }
						onChange={ ( val ) =>
							setAttributes( { iconRotation: val } )
						}
					/>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ ( media ) =>
								setAttributes( {
									customIcon: media.url,
									customIconId: media.id,
								} )
							}
							allowedTypes={ [ 'image' ] }
							value={ customIconId }
							render={ ( { open } ) => (
								<div style={ { marginTop: '8px' } }>
									<Button
										onClick={ open }
										variant="secondary"
										isSmall
									>
										{ customIcon
											? __(
													'Replace Custom Icon',
													'advanced-accordion'
											  )
											: __(
													'Upload Custom Icon',
													'advanced-accordion'
											  ) }
									</Button>
									{ customIcon && (
										<Button
											onClick={ () =>
												setAttributes( {
													customIcon: '',
													customIconId: 0,
												} )
											}
											variant="tertiary"
											isDestructive
											isSmall
											style={ { marginLeft: '8px' } }
										>
											{ __( 'Remove', 'advanced-accordion' ) }
										</Button>
									) }
								</div>
							) }
						/>
					</MediaUploadCheck>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps } role="button" tabIndex="0">
				<HeadingTag className="aa-toggle-heading">
					{ showIcon && isLeft && iconMarkup }
					<RichText
						tagName="span"
						className="aa-toggle-text"
						placeholder={ __(
							'Accordion title…',
							'advanced-accordion'
						) }
						value={ heading }
						onChange={ ( val ) =>
							setAttributes( { heading: val } )
						}
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/link',
						] }
					/>
					{ showIcon && ! isLeft && iconMarkup }
				</HeadingTag>
			</div>
		</>
	);
}
