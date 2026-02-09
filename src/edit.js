/**
 * Advanced Accordion – Container Edit Component
 *
 * Renders the outer wrapper in the editor and exposes all container-level
 * settings in the InspectorControls panel.
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	SelectControl,
	TextControl,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Template inserted when the accordion starts empty.
 */
const TEMPLATE = [
	[
		'asuspended/accordion-item',
		{},
		[
			[ 'asuspended/accordion-toggle', { heading: 'Accordion Item' } ],
			[
				'asuspended/accordion-content',
				{},
				[ [ 'core/paragraph', { placeholder: 'Add content here…' } ] ],
			],
		],
	],
];

const ALLOWED_BLOCKS = [ 'asuspended/accordion-item' ];

const EASING_OPTIONS = [
	{ label: 'Linear', value: 'linear' },
	{ label: 'Ease', value: 'ease' },
	{ label: 'Ease-in', value: 'ease-in' },
	{ label: 'Ease-out', value: 'ease-out' },
	{ label: 'Ease-in-out', value: 'ease-in-out' },
	{ label: 'Custom cubic-bezier', value: 'custom' },
];

export default function ContainerEdit( { attributes, setAttributes, clientId } ) {
	const {
		autoClose,
		allowMultipleOpen,
		animationDuration,
		animationEasing,
		customEasing,
		contentFade,
		contentFadeDuration,
		contentSlideDistance,
		staggerDelay,
		iconPosition,
		iconRotation,
	} = attributes;

	const blockProps = useBlockProps( {
		className: 'wp-block-advanced-accordion',
		'data-auto-close': autoClose ? 'true' : 'false',
		'data-allow-multiple': allowMultipleOpen ? 'true' : 'false',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		template: TEMPLATE,
		renderAppender: () => (
			<div className="aa-appender-wrapper">
				<button
					className="aa-appender-button"
					onClick={ () => {
						const { insertBlock } = useDispatch( 'core/block-editor' );
						const { createBlock } = require( '@wordpress/blocks' );
						const newItem = createBlock( 'asuspended/accordion-item', {}, [
							createBlock( 'asuspended/accordion-toggle', { heading: 'New Item' } ),
							createBlock( 'asuspended/accordion-content', {}, [
								createBlock( 'core/paragraph', { placeholder: 'Add content here…' } ),
							] ),
						] );
						insertBlock( newItem, undefined, clientId );
					} }
				>
					{ __( '+ Add Accordion Item', 'advanced-accordion' ) }
				</button>
			</div>
		),
	} );

	/* ── Toolbar: Expand / Collapse All (editor preview only) ──── */
	const childItemIds = useSelect(
		( select ) => {
			const { getBlockOrder } = select( 'core/block-editor' );
			return getBlockOrder( clientId );
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const expandAll = useCallback( () => {
		childItemIds.forEach( ( id ) =>
			updateBlockAttributes( id, { openByDefault: true } )
		);
	}, [ childItemIds, updateBlockAttributes ] );

	const collapseAll = useCallback( () => {
		childItemIds.forEach( ( id ) =>
			updateBlockAttributes( id, { openByDefault: false } )
		);
	}, [ childItemIds, updateBlockAttributes ] );

	/* ── Inline CSS custom properties for live preview ─────────── */
	const easingValue =
		animationEasing === 'custom' && customEasing
			? customEasing
			: animationEasing;

	const styleVars = {
		'--aa-duration': `${ animationDuration }s`,
		'--aa-easing': easingValue,
		'--aa-fade-duration': `${ contentFadeDuration }s`,
		'--aa-slide-distance': `${ contentSlideDistance }px`,
		'--aa-stagger': `${ staggerDelay }ms`,
	};

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon="arrow-down-alt2"
						label={ __( 'Expand All', 'advanced-accordion' ) }
						onClick={ expandAll }
					/>
					<ToolbarButton
						icon="arrow-up-alt2"
						label={ __( 'Collapse All', 'advanced-accordion' ) }
						onClick={ collapseAll }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				{ /* ── Behavior ───────────────────────────────────── */ }
				<PanelBody
					title={ __( 'Accordion Behavior', 'advanced-accordion' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Auto-close other items', 'advanced-accordion' ) }
						help={ __(
							'When enabled, opening one item closes all others.',
							'advanced-accordion'
						) }
						checked={ autoClose }
						onChange={ ( val ) =>
							setAttributes( {
								autoClose: val,
								allowMultipleOpen: val ? false : allowMultipleOpen,
							} )
						}
					/>
					{ ! autoClose && (
						<ToggleControl
							label={ __( 'Allow multiple open', 'advanced-accordion' ) }
							checked={ allowMultipleOpen }
							onChange={ ( val ) =>
								setAttributes( { allowMultipleOpen: val } )
							}
						/>
					) }
				</PanelBody>

				{ /* ── Animation ──────────────────────────────────── */ }
				<PanelBody
					title={ __( 'Animation Settings', 'advanced-accordion' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Duration (seconds)', 'advanced-accordion' ) }
						value={ animationDuration }
						onChange={ ( val ) =>
							setAttributes( { animationDuration: val } )
						}
						min={ 0.1 }
						max={ 1.0 }
						step={ 0.05 }
					/>
					<SelectControl
						label={ __( 'Easing Function', 'advanced-accordion' ) }
						value={ animationEasing }
						options={ EASING_OPTIONS }
						onChange={ ( val ) =>
							setAttributes( { animationEasing: val } )
						}
					/>
					{ animationEasing === 'custom' && (
						<TextControl
							label={ __( 'Custom cubic-bezier', 'advanced-accordion' ) }
							help={ __(
								'e.g. cubic-bezier(0.4, 0, 0.2, 1)',
								'advanced-accordion'
							) }
							value={ customEasing }
							onChange={ ( val ) =>
								setAttributes( { customEasing: val } )
							}
						/>
					) }
					<ToggleControl
						label={ __( 'Content Fade', 'advanced-accordion' ) }
						checked={ contentFade }
						onChange={ ( val ) =>
							setAttributes( { contentFade: val } )
						}
					/>
					{ contentFade && (
						<>
							<RangeControl
								label={ __(
									'Fade Duration (seconds)',
									'advanced-accordion'
								) }
								value={ contentFadeDuration }
								onChange={ ( val ) =>
									setAttributes( { contentFadeDuration: val } )
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
									setAttributes( { contentSlideDistance: val } )
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
						help={ __(
							'Delay between each child element animating.',
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
				</PanelBody>

				{ /* ── Icon defaults ─────────────────────────────── */ }
				<PanelBody
					title={ __( 'Icon Defaults', 'advanced-accordion' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Icon Position', 'advanced-accordion' ) }
						value={ iconPosition }
						options={ [
							{ label: 'Right', value: 'right' },
							{ label: 'Left', value: 'left' },
							{ label: 'None', value: 'none' },
						] }
						onChange={ ( val ) =>
							setAttributes( { iconPosition: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Rotate icon on open', 'advanced-accordion' ) }
						checked={ iconRotation }
						onChange={ ( val ) =>
							setAttributes( { iconRotation: val } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...innerBlocksProps } style={ { ...blockProps.style, ...styleVars } } />
		</>
	);
}
