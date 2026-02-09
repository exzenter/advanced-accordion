/**
 * Advanced Accordion – Container Save Component
 *
 * Renders the static HTML that is stored in post content.
 * The frontend JS (view.js) hydrates the behaviour at runtime.
 */

import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function containerSave( { attributes } ) {
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

	const easingValue =
		animationEasing === 'custom' && customEasing
			? customEasing
			: animationEasing;

	const blockProps = useBlockProps.save( {
		className: 'wp-block-advanced-accordion',
		'data-auto-close': autoClose ? 'true' : 'false',
		'data-allow-multiple': allowMultipleOpen ? 'true' : 'false',
		'data-duration': animationDuration,
		'data-easing': easingValue,
		'data-content-fade': contentFade ? 'true' : 'false',
		'data-fade-duration': contentFadeDuration,
		'data-slide-distance': contentSlideDistance,
		'data-stagger': staggerDelay,
		'data-icon-position': iconPosition,
		'data-icon-rotation': iconRotation ? 'true' : 'false',
		style: {
			'--aa-duration': `${ animationDuration }s`,
			'--aa-easing': easingValue,
			'--aa-fade-duration': `${ contentFadeDuration }s`,
			'--aa-slide-distance': `${ contentSlideDistance }px`,
			'--aa-stagger': `${ staggerDelay }ms`,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
