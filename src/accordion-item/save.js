/**
 * Accordion Item – Save Component
 *
 * Outputs the static markup stored in post content.
 * data-* attributes carry settings read by the frontend JS.
 */

import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function itemSave( { attributes } ) {
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

	const dataAttrs = {
		'data-item-id': itemId,
		'data-open-default': openByDefault ? 'true' : 'false',
	};

	if ( linkGroupId ) {
		dataAttrs[ 'data-link-group' ] = linkGroupId;
	}

	// Per-item animation overrides are stored as data attributes so the
	// frontend script can merge them with the container defaults.
	if ( overrideAnimationDuration ) {
		dataAttrs[ 'data-duration' ] = animationDuration;
	}
	if ( overrideAnimationEasing ) {
		const easing =
			animationEasing === 'custom' && customEasing
				? customEasing
				: animationEasing;
		dataAttrs[ 'data-easing' ] = easing;
	}
	if ( overrideContentFade ) {
		dataAttrs[ 'data-content-fade' ] = contentFade ? 'true' : 'false';
		dataAttrs[ 'data-fade-duration' ] = contentFadeDuration;
		dataAttrs[ 'data-slide-distance' ] = contentSlideDistance;
		dataAttrs[ 'data-stagger' ] = staggerDelay;
	}

	const classNames = [
		'wp-block-accordion-item',
		customClassName || '',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps.save( {
		className: classNames,
		...dataAttrs,
	} );

	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
