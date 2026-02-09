/**
 * Advanced Accordion – Main Entry Point
 *
 * Registers all four blocks that make up the accordion system:
 *   1. advanced-accordion  – outer container
 *   2. accordion-item      – individual collapsible section
 *   3. accordion-toggle    – clickable heading / button
 *   4. accordion-content   – collapsible body
 */

import { registerBlockType } from '@wordpress/blocks';

/* ── Container block ────────────────────────────────────────────── */
import containerMeta from './block.json';
import ContainerEdit from './edit';
import containerSave from './save';

/* ── Item block ─────────────────────────────────────────────────── */
import itemMeta from './accordion-item/block.json';
import ItemEdit from './accordion-item/edit';
import itemSave from './accordion-item/save';

/* ── Toggle block ───────────────────────────────────────────────── */
import toggleMeta from './accordion-toggle/block.json';
import ToggleEdit from './accordion-toggle/edit';
import toggleSave from './accordion-toggle/save';

/* ── Content block ──────────────────────────────────────────────── */
import contentMeta from './accordion-content/block.json';
import ContentEdit from './accordion-content/edit';
import contentSave from './accordion-content/save';
import contentDeprecated from './accordion-content/deprecated';

/* ── Styles ─────────────────────────────────────────────────────── */
import './editor.scss'; // Editor-only styles (via editorStyle in block.json)
import './style.scss';  // Frontend + Editor styles (via style in block.json)

/* ================================================================
 * Register blocks
 * ================================================================ */

registerBlockType( containerMeta.name, {
	...containerMeta,
	edit: ContainerEdit,
	save: containerSave,
	/**
	 * Block variations let users pick a preset template when inserting.
	 */
	variations: [
		{
			name: 'faq',
			title: 'FAQ Accordion',
			description: 'Frequently-asked-questions layout with auto-close enabled.',
			attributes: { autoClose: true, allowMultipleOpen: false },
			innerBlocks: [
				[
					'asuspended/accordion-item',
					{},
					[
						[ 'asuspended/accordion-toggle', { heading: 'Question 1' } ],
						[
							'asuspended/accordion-content',
							{},
							[ [ 'core/paragraph', { placeholder: 'Write your answer here…' } ] ],
						],
					],
				],
				[
					'asuspended/accordion-item',
					{},
					[
						[ 'asuspended/accordion-toggle', { heading: 'Question 2' } ],
						[
							'asuspended/accordion-content',
							{},
							[ [ 'core/paragraph', { placeholder: 'Write your answer here…' } ] ],
						],
					],
				],
				[
					'asuspended/accordion-item',
					{},
					[
						[ 'asuspended/accordion-toggle', { heading: 'Question 3' } ],
						[
							'asuspended/accordion-content',
							{},
							[ [ 'core/paragraph', { placeholder: 'Write your answer here…' } ] ],
						],
					],
				],
			],
			scope: [ 'inserter' ],
			isDefault: false,
		},
		{
			name: 'pricing',
			title: 'Pricing Details',
			description: 'Pricing table accordion with linked groups.',
			attributes: { autoClose: false, allowMultipleOpen: true },
			innerBlocks: [
				[
					'asuspended/accordion-item',
					{ linkGroupId: 'pricing-details' },
					[
						[ 'asuspended/accordion-toggle', { heading: 'Basic Plan' } ],
						[
							'asuspended/accordion-content',
							{},
							[ [ 'core/paragraph', { placeholder: 'Describe the basic plan…' } ] ],
						],
					],
				],
				[
					'asuspended/accordion-item',
					{ linkGroupId: 'pricing-details' },
					[
						[ 'asuspended/accordion-toggle', { heading: 'Pro Plan' } ],
						[
							'asuspended/accordion-content',
							{},
							[ [ 'core/paragraph', { placeholder: 'Describe the pro plan…' } ] ],
						],
					],
				],
			],
			scope: [ 'inserter' ],
			isDefault: false,
		},
	],
} );

registerBlockType( itemMeta.name, {
	...itemMeta,
	edit: ItemEdit,
	save: itemSave,
} );

registerBlockType( toggleMeta.name, {
	...toggleMeta,
	edit: ToggleEdit,
	save: toggleSave,
} );

registerBlockType( contentMeta.name, {
	...contentMeta,
	edit: ContentEdit,
	save: contentSave,
	deprecated: contentDeprecated,
} );
