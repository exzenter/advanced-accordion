/**
 * Accordion Toggle – Save Component
 *
 * Outputs a semantic <button> wrapped in the chosen heading tag.
 * ARIA attributes are added by the frontend script after hydration, but we
 * set aria-expanded="false" as a safe default in the static markup.
 */

import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function toggleSave( { attributes } ) {
	const { heading, headingTag, iconPosition, customIcon, iconRotation } =
		attributes;

	const HeadingTag = headingTag || 'h3';
	const showIcon = iconPosition !== 'none';
	const isLeft = iconPosition === 'left';

	const blockProps = useBlockProps.save( {
		className: 'wp-block-accordion-toggle',
		'data-icon-position': iconPosition || '',
		'data-icon-rotation': iconRotation ? 'true' : 'false',
	} );

	const iconHtml = customIcon ? (
		<span className="aa-toggle-icon" aria-hidden="true">
			<img src={ customIcon } alt="" className="aa-toggle-icon-custom" />
		</span>
	) : (
		<span className="aa-toggle-icon" aria-hidden="true">
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
		</span>
	);

	return (
		<div { ...blockProps }>
			<HeadingTag className="aa-toggle-heading">
				<button
					className="aa-toggle-button"
					type="button"
					aria-expanded="false"
				>
					{ showIcon && isLeft && iconHtml }
					<RichText.Content
						tagName="span"
						className="aa-toggle-text"
						value={ heading }
					/>
					{ showIcon && ! isLeft && iconHtml }
				</button>
			</HeadingTag>
		</div>
	);
}
