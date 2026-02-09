/**
 * Accordion Item – Edit Component
 *
 * Each item wraps a toggle + content pair and exposes per-item settings such
 * as "open by default", link-group ID, and animation overrides.
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const TEMPLATE = [
	[ 'asuspended/accordion-toggle', { heading: 'Accordion Item', lock: { move: true, remove: true } } ],
	[
		'asuspended/accordion-content',
		{ lock: { move: true, remove: true } },
		[ [ 'core/paragraph', { placeholder: 'Add content here…' } ] ],
	],
];

const ALLOWED_BLOCKS = [
	'asuspended/accordion-toggle',
	'asuspended/accordion-content',
];

const EASING_OPTIONS = [
	{ label: 'Linear', value: 'linear' },
	{ label: 'Ease', value: 'ease' },
	{ label: 'Ease-in', value: 'ease-in' },
	{ label: 'Ease-out', value: 'ease-out' },
	{ label: 'Ease-in-out', value: 'ease-in-out' },
	{ label: 'Custom cubic-bezier', value: 'custom' },
];

export default function ItemEdit( { attributes, setAttributes, clientId } ) {
	const {
		openByDefault,
		linkGroupId,
		overrideAnimationDuration,
		animationDuration,
		overrideAnimationEasing,
		animationEasing,
		customEasing,
		overrideContentFade,
		contentFade,
		contentFadeDuration,
		contentSlideDistance,
		staggerDelay,
		customClassName,
		itemId,
	} = attributes;

	// Generate a stable unique ID for this item (used in aria-controls).
	useEffect( () => {
		if ( ! itemId ) {
			setAttributes( {
				itemId: `aa-item-${ clientId.substring( 0, 8 ) }`,
			} );
		}
	}, [ clientId, itemId, setAttributes ] );

	// Determine whether this item is part of a linked group and how many
	// siblings share the same group ID (editor visual feedback).
	const linkedCount = useSelect(
		( select ) => {
			if ( ! linkGroupId ) return 0;
			const { getBlocksByClientId, getBlockOrder } =
				select( 'core/block-editor' );
			const { getBlockParents } = select( 'core/block-editor' );
			// Walk all accordion-item blocks on the page.
			const allBlocks =
				select( 'core/block-editor' ).getBlocks() || [];
			let count = 0;

			const walk = ( blocks ) => {
				for ( const block of blocks ) {
					if (
						block.name === 'asuspended/accordion-item' &&
						block.attributes.linkGroupId === linkGroupId
					) {
						count++;
					}
					if ( block.innerBlocks?.length ) {
						walk( block.innerBlocks );
					}
				}
			};
			walk( allBlocks );
			return count;
		},
		[ linkGroupId ]
	);

	const hasLink = linkGroupId && linkGroupId.length > 0;

	const classNames = [
		'wp-block-accordion-item',
		openByDefault ? 'is-open' : '',
		hasLink ? 'has-link-group' : '',
		customClassName || '',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( {
		className: classNames,
		'data-item-id': itemId,
		'data-link-group': linkGroupId || undefined,
		'data-open-default': openByDefault ? 'true' : 'false',
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			template: TEMPLATE,
			templateLock: false,
		}
	);

	return (
		<>
			<InspectorControls>
				{ /* ── Item Settings ─────────────────────────────── */ }
				<PanelBody
					title={ __( 'Item Settings', 'advanced-accordion' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Open by default', 'advanced-accordion' ) }
						checked={ openByDefault }
						onChange={ ( val ) =>
							setAttributes( { openByDefault: val } )
						}
					/>
					<TextControl
						label={ __( 'Link Group ID', 'advanced-accordion' ) }
						help={
							hasLink
								? `${ linkedCount } item(s) share this group.`
								: __(
										'Items with the same group ID toggle together across the page.',
										'advanced-accordion'
								  )
						}
						value={ linkGroupId }
						onChange={ ( val ) =>
							setAttributes( { linkGroupId: val } )
						}
					/>
					<TextControl
						label={ __( 'Custom CSS Class', 'advanced-accordion' ) }
						value={ customClassName }
						onChange={ ( val ) =>
							setAttributes( { customClassName: val } )
						}
					/>
				</PanelBody>

				{ /* ── Animation Overrides ────────────────────────── */ }
				<PanelBody
					title={ __(
						'Animation Overrides',
						'advanced-accordion'
					) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __(
							'Override duration',
							'advanced-accordion'
						) }
						checked={ overrideAnimationDuration }
						onChange={ ( val ) =>
							setAttributes( {
								overrideAnimationDuration: val,
							} )
						}
					/>
					{ overrideAnimationDuration && (
						<RangeControl
							label={ __(
								'Duration (seconds)',
								'advanced-accordion'
							) }
							value={ animationDuration }
							onChange={ ( val ) =>
								setAttributes( { animationDuration: val } )
							}
							min={ 0.1 }
							max={ 1.0 }
							step={ 0.05 }
						/>
					) }

					<ToggleControl
						label={ __(
							'Override easing',
							'advanced-accordion'
						) }
						checked={ overrideAnimationEasing }
						onChange={ ( val ) =>
							setAttributes( {
								overrideAnimationEasing: val,
							} )
						}
					/>
					{ overrideAnimationEasing && (
						<>
							<SelectControl
								label={ __(
									'Easing Function',
									'advanced-accordion'
								) }
								value={ animationEasing }
								options={ EASING_OPTIONS }
								onChange={ ( val ) =>
									setAttributes( { animationEasing: val } )
								}
							/>
							{ animationEasing === 'custom' && (
								<TextControl
									label={ __(
										'Custom cubic-bezier',
										'advanced-accordion'
									) }
									value={ customEasing }
									onChange={ ( val ) =>
										setAttributes( {
											customEasing: val,
										} )
									}
								/>
							) }
						</>
					) }

					<ToggleControl
						label={ __(
							'Override content fade',
							'advanced-accordion'
						) }
						checked={ overrideContentFade }
						onChange={ ( val ) =>
							setAttributes( {
								overrideContentFade: val,
							} )
						}
					/>
					{ overrideContentFade && (
						<>
							<ToggleControl
								label={ __(
									'Content Fade',
									'advanced-accordion'
								) }
								checked={ contentFade }
								onChange={ ( val ) =>
									setAttributes( { contentFade: val } )
								}
							/>
							{ contentFade && (
								<>
									<RangeControl
										label={ __(
											'Fade Duration (s)',
											'advanced-accordion'
										) }
										value={ contentFadeDuration }
										onChange={ ( val ) =>
											setAttributes( {
												contentFadeDuration: val,
											} )
										}
										min={ 0.1 }
										max={ 0.8 }
										step={ 0.05 }
									/>
									<RangeControl
										label={ __(
											'Slide Distance (px)',
											'advanced-accordion'
										) }
										value={ contentSlideDistance }
										onChange={ ( val ) =>
											setAttributes( {
												contentSlideDistance: val,
											} )
										}
										min={ 0 }
										max={ 50 }
										step={ 1 }
									/>
								</>
							) }
							<RangeControl
								label={ __(
									'Stagger Delay (ms)',
									'advanced-accordion'
								) }
								value={ staggerDelay }
								onChange={ ( val ) =>
									setAttributes( { staggerDelay: val } )
								}
								min={ 0 }
								max={ 200 }
								step={ 10 }
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ hasLink && (
					<span className="aa-link-badge" title={ `Group: ${ linkGroupId }` }>
						🔗 { linkGroupId }
					</span>
				) }
				<div { ...innerBlocksProps } />
			</div>
		</>
	);
}
