/**
 * Advanced Accordion – Frontend View Script
 *
 * Hydrates static accordion markup with interactive behaviour:
 *   - Smooth expand / collapse via maxHeight + requestAnimationFrame
 *   - Linked groups (items with the same data-link-group toggle together)
 *   - Keyboard navigation (Arrow keys, Enter, Space, Home, End)
 *   - ARIA attributes (aria-expanded, aria-controls, role="region")
 *   - Reduced-motion media query support
 *   - Dynamic height recalculation on window resize
 *   - Per-item animation overrides merged with container defaults
 */

(function () {
	'use strict';

	/* ================================================================
	 * Helpers
	 * ================================================================ */

	const prefersReducedMotion = window.matchMedia(
		'(prefers-reduced-motion: reduce)'
	);

	/**
	 * Read a numeric data-attribute, falling back to a default.
	 */
	function dataNum(el, attr, fallback) {
		const raw = el?.getAttribute(`data-${attr}`);
		return raw !== null && raw !== undefined ? parseFloat(raw) : fallback;
	}

	/**
	 * Read a string data-attribute.
	 */
	function dataStr(el, attr, fallback = '') {
		return el?.getAttribute(`data-${attr}`) ?? fallback;
	}

	/**
	 * Read a boolean data-attribute.
	 */
	function dataBool(el, attr, fallback = false) {
		const raw = el?.getAttribute(`data-${attr}`);
		if (raw === null || raw === undefined) return fallback;
		return raw === 'true';
	}

	/* ================================================================
	 * Accordion Class
	 * ================================================================ */

	class AdvancedAccordion {
		/**
		 * @param {HTMLElement} container  The .wp-block-advanced-accordion element.
		 */
		constructor(container) {
			this.container = container;

			// Container-level settings (from data-* attributes).
			this.autoClose = dataBool(container, 'auto-close');
			this.allowMultiple = dataBool(container, 'allow-multiple', true);

			// Defaults for animation (individual items may override).
			this.defaults = {
				duration: dataNum(container, 'duration', 0.4),
				easing: dataStr(container, 'easing', 'ease'),
				contentFade: dataBool(container, 'content-fade', true),
				fadeDuration: dataNum(container, 'fade-duration', 0.3),
				slideDistance: dataNum(container, 'slide-distance', 10),
				stagger: dataNum(container, 'stagger', 0),
			};

			this.items = Array.from(
				container.querySelectorAll(
					':scope > .wp-block-accordion-item'
				)
			);

			this._init();
		}

		/* ── Initialisation ────────────────────────────────────── */

		_init() {
			this.items.forEach((item) => this._initItem(item));

			// Keyboard navigation across toggle buttons in this container.
			this.container.addEventListener('keydown', (e) =>
				this._handleKeyboard(e)
			);

			// Recalculate open heights on resize.
			this._resizeObserver = new ResizeObserver(() =>
				this._recalcOpenHeights()
			);
			this._resizeObserver.observe(this.container);
		}

		/**
		 * Set up a single accordion item: wire ARIA, attach listeners,
		 * and optionally open items marked data-open-default="true".
		 */
		_initItem(item) {
			const toggle = item.querySelector('.aa-toggle-button');
			const content = item.querySelector('.wp-block-accordion-content');
			if (!toggle || !content) return;

			// Generate a deterministic ID for aria-controls.
			const id =
				item.getAttribute('data-item-id') ||
				`aa-${Math.random().toString(36).slice(2, 10)}`;

			content.id = `${id}-content`;
			toggle.setAttribute('aria-controls', content.id);

			const openDefault = dataBool(item, 'open-default');

			if (openDefault) {
				this._openItem(item, true);
			} else {
				toggle.setAttribute('aria-expanded', 'false');
				content.hidden = true;
				content.style.maxHeight = '0';
				content.style.overflow = 'hidden';
			}

			// Click handler.
			toggle.addEventListener('click', () =>
				this._toggle(item)
			);
		}

		/* ── Resolve animation settings for an item ───────────── */

		_getSettings(item) {
			const s = { ...this.defaults };

			// Per-item overrides (set via data attributes by the save component).
			if (item.hasAttribute('data-duration'))
				s.duration = dataNum(item, 'duration', s.duration);
			if (item.hasAttribute('data-easing'))
				s.easing = dataStr(item, 'easing', s.easing);
			if (item.hasAttribute('data-content-fade'))
				s.contentFade = dataBool(item, 'content-fade', s.contentFade);
			if (item.hasAttribute('data-fade-duration'))
				s.fadeDuration = dataNum(item, 'fade-duration', s.fadeDuration);
			if (item.hasAttribute('data-slide-distance'))
				s.slideDistance = dataNum(item, 'slide-distance', s.slideDistance);
			if (item.hasAttribute('data-stagger'))
				s.stagger = dataNum(item, 'stagger', s.stagger);

			// Honour prefers-reduced-motion – instant transitions.
			if (prefersReducedMotion.matches) {
				s.duration = 0;
				s.fadeDuration = 0;
				s.stagger = 0;
			}

			return s;
		}

		/* ── Toggle (open / close) ────────────────────────────── */

		_toggle(item) {
			const isOpen = item.classList.contains('is-open');

			if (isOpen) {
				this._closeItem(item);
			} else {
				this._openItem(item);
			}

			// Linked groups: synchronise other items on the page with
			// the same data-link-group value.
			const groupId = item.getAttribute('data-link-group');
			if (groupId) {
				this._syncLinkedGroup(groupId, item, !isOpen);
			}

			// Auto-close siblings if configured.
			if (!isOpen && this.autoClose) {
				this.items.forEach((sibling) => {
					if (sibling !== item && sibling.classList.contains('is-open')) {
						// Don't auto-close siblings that belong to a different
						// linked group being opened in the same gesture.
						const siblingGroup = sibling.getAttribute('data-link-group');
						if (siblingGroup && siblingGroup === groupId) return;
						this._closeItem(sibling);
					}
				});
			}
		}

		/* ── Open an item ─────────────────────────────────────── */

		_openItem(item, instant = false) {
			console.group('🟢 OPEN ITEM');
			const startTime = performance.now();

			const toggle = item.querySelector('.aa-toggle-button');
			const content = item.querySelector('.wp-block-accordion-content');
			if (!toggle || !content) {
				console.warn('Missing toggle or content');
				console.groupEnd();
				return;
			}

			const s = this._getSettings(item);
			const dur = instant ? 0 : s.duration;
			console.log('⚙️ Settings:', s);
			console.log(`⏱️  Duration: ${dur}s, instant: ${instant}`);

			// DEBUG: Log computed values
			const computed = window.getComputedStyle(content);
			console.log(`🔍 Computed Opacity: ${computed.opacity}`);
			console.log(`🔍 Computed Transition: ${computed.transition}`);

			item.classList.add('is-open');

			toggle.setAttribute('aria-expanded', 'true');
			content.hidden = false;

			// Strict CSS class toggle to enforce no-fade
			if (!s.contentFade) {
				content.classList.add('aa-no-fade');
			} else {
				content.classList.remove('aa-no-fade');
			}

			// Set CSS custom properties on the item for fine-grained control.
			item.style.setProperty('--aa-duration', `${dur}s`);
			item.style.setProperty('--aa-easing', s.easing);

			// Prepare children based on contentFade setting
			const children = Array.from(content.children);
			console.log(`👶 Found ${children.length} children`);

			if (s.contentFade && !instant) {
				console.log('✨ ContentFade ON - preparing children');
				// Prepare children for fade-in BEFORE height animation starts
				children.forEach((child) => {
					child.style.opacity = '0';
					child.style.transform = `translateY(${s.slideDistance}px)`;
				});
			} else {
				console.log('🚫 ContentFade OFF - removing transitions');
				// Remove all transitions to prevent flickering
				children.forEach((child) => {
					child.style.transition = 'none';
					child.style.opacity = '1';
					child.style.transform = 'none';
				});
			}

			// 1. MEASURE PRECISE TARGET HEIGHT
			// Unlock height momentarily to get the exact pixel size the content needs.
			content.style.transition = 'none';
			content.style.maxHeight = 'none';
			content.style.overflow = 'hidden'; // Keep context consistent
			const targetHeight = content.offsetHeight; // precise integer height including borders
			console.log(`📏 Precise target height: ${targetHeight}px`);

			// 2. RESET TO ZERO
			content.style.maxHeight = '0';
			// eslint-disable-next-line no-unused-expressions
			content.offsetHeight; // Force reflow to lock in '0'

			const rafTime = performance.now();
			console.log(`⏱️  Time before RAF: ${(rafTime - startTime).toFixed(2)}ms`);

			requestAnimationFrame(() => {
				const animStartTime = performance.now();
				console.log(`🎬 RAF fired at ${(animStartTime - startTime).toFixed(2)}ms`);

				content.style.transition = `max-height ${dur}s ${s.easing}`;
				content.style.maxHeight = targetHeight + 'px';
				console.log(`📈 Set maxHeight to ${targetHeight}px`);

				// Start fade-in animation SIMULTANEOUSLY with height expand
				if (s.contentFade && !instant) {
					console.log('✨ Fading in children');
					this._fadeInChildren(content, s);
				} else {
					// Force opacity 1 if fade is off, just in case
					children.forEach((child) => {
						child.style.setProperty('opacity', '1', 'important');
						child.style.setProperty('transform', 'none', 'important');
						child.style.setProperty('transition', 'none', 'important');
					});
				}

			});

			// After transition completes, remove maxHeight so content can
			// resize naturally (e.g. images loading, dynamic content).
			const onEnd = (e) => {
				// Only trigger on max-height transition, not child transitions
				if (e && e.propertyName !== 'max-height') {
					console.log(`⏭️  Ignoring transitionend for: ${e.propertyName}`);
					return;
				}
				const endTime = performance.now();
				console.log(`✅ Transition complete at ${(endTime - startTime).toFixed(2)}ms`);

				content.style.maxHeight = 'none';
				// content.style.overflow = ''; // REMOVED: Keep overflow hidden for stability
				content.removeEventListener('transitionend', onEnd);
				console.log('🧹 Cleanup done');

				console.groupEnd();
			};
			if (dur > 0) {
				content.addEventListener('transitionend', onEnd);
			} else {
				console.log('⚡ Instant open (duration = 0)');
				content.style.maxHeight = 'none';
				// content.style.overflow = ''; // REMOVED: Keep overflow hidden for stability
				console.groupEnd();

			}
		}

		/* ── Close an item ────────────────────────────────────── */

		_closeItem(item) {
			console.group('🔴 CLOSE ITEM');
			const startTime = performance.now();

			const toggle = item.querySelector('.aa-toggle-button');
			const content = item.querySelector('.wp-block-accordion-content');
			if (!toggle || !content) {
				console.warn('Missing toggle or content');
				console.groupEnd();
				return;
			}

			const s = this._getSettings(item);
			console.log('⚙️ Settings:', s);

			// Strict CSS class toggle to enforce no-fade
			if (!s.contentFade) {
				content.classList.add('aa-no-fade');
			} else {
				content.classList.remove('aa-no-fade');
			}

			// Remove transitions from children if contentFade is disabled (same as open)
			const children = Array.from(content.children);
			console.log(`👶 Found ${children.length} children`);

			if (!s.contentFade) {
				console.log('🚫 ContentFade OFF - forcing visible');
				// IMMEDIATE visibility force
				content.style.setProperty('opacity', '1', 'important');
				children.forEach((child) => {
					child.style.setProperty('transition', 'none', 'important');
					child.style.setProperty('opacity', '1', 'important');
					child.style.setProperty('transform', 'none', 'important');
				});
			}


			// 2. PREPARE FOR MEASUREMENT
			// We MUST set overflow: hidden AND border-box BEFORE measuring height.
			// This prevents jumping caused by margin collapse differences between
			// overflow: visible and overflow: hidden.
			content.style.transition = 'none';
			content.style.overflow = 'hidden';
			content.style.boxSizing = 'border-box'; // FIX: Enforce border-box to prevent jump
			// eslint-disable-next-line no-unused-expressions
			content.offsetHeight; // Force reflow #1 to apply overflow change


			// 3. MEASURE CURRENT HEIGHT
			// Now that overflow is hidden, this measurement includes any
			// margin/padding adjustments inherent to that state.
			const currentHeight = content.getBoundingClientRect().height;
			console.log(`� Measured height (overflow:hidden): ${currentHeight}px`);

			// 4. LOCK HEIGHT
			content.style.maxHeight = currentHeight + 'px';
			// eslint-disable-next-line no-unused-expressions
			content.offsetHeight; // Force reflow #2 to lock height
			console.log(`� Locked to ${currentHeight}px`);


			const rafTime = performance.now();
			console.log(`⏱️  Time before RAF: ${(rafTime - startTime).toFixed(2)}ms`);

			requestAnimationFrame(() => {
				const animStartTime = performance.now();
				console.log(`🎬 RAF fired at ${(animStartTime - startTime).toFixed(2)}ms`);

				content.style.transition = `max-height ${s.duration}s ${s.easing}`;
				content.style.maxHeight = '0';
				console.log(`📉 Set maxHeight to 0, transition: ${s.duration}s ${s.easing}`);

				// Fade out children SIMULTANEOUSLY with height collapse (only if enabled)
				if (s.contentFade) {
					console.log('✨ Fading out children');
					this._fadeOutChildren(content, s);
				} else {
					// Ensure they stay visible during collapse
					children.forEach((child) => {
						child.style.setProperty('opacity', '1', 'important');
						child.style.setProperty('transform', 'none', 'important');
						child.style.setProperty('transition', 'none', 'important');
					});
					content.style.setProperty('opacity', '1', 'important');
				}

			});

			const onEnd = (e) => {
				// Only trigger on max-height transition, not child transitions
				if (e && e.propertyName !== 'max-height') {
					console.log(`⏭️  Ignoring transitionend for: ${e.propertyName}`);
					return;
				}
				const endTime = performance.now();
				console.log(`✅ Transition complete at ${(endTime - startTime).toFixed(2)}ms`);

				item.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				content.hidden = true;
				content.style.maxHeight = '0';
				content.style.transition = '';
				content.removeEventListener('transitionend', onEnd);
				console.log('🧹 Cleanup done');
				console.groupEnd();
			};

			if (s.duration > 0) {
				content.addEventListener('transitionend', onEnd);
			} else {
				console.log('⚡ Instant close (duration = 0)');
				onEnd();
			}
		}

		/* ── Content fade helpers ─────────────────────────────── */

		_fadeInChildren(content, s) {
			const children = Array.from(content.children);
			children.forEach((child, i) => {
				const delay = s.stagger * i;
				// Set transition (children are already at opacity:0 from _openItem)
				child.style.transition = `opacity ${s.fadeDuration}s ${s.easing} ${delay}ms, transform ${s.fadeDuration}s ${s.easing} ${delay}ms`;

				// Animate to visible state
				child.style.opacity = '1';
				child.style.transform = 'translateY(0)';
			});
		}

		_fadeOutChildren(content, s) {
			const children = Array.from(content.children);
			children.forEach((child) => {
				// Use full fadeDuration to match the collapse animation
				child.style.transition = `opacity ${s.fadeDuration}s ${s.easing}, transform ${s.fadeDuration}s ${s.easing}`;
				child.style.opacity = '0';
				child.style.transform = `translateY(-${s.slideDistance}px)`;
			});
		}

		/* ── Linked group synchronisation ─────────────────────── */

		/**
		 * Find all accordion-item elements on the entire page that share
		 * the given groupId and open/close them to match the trigger.
		 */
		_syncLinkedGroup(groupId, triggerItem, shouldOpen) {
			const allLinked = document.querySelectorAll(
				`.wp-block-accordion-item[data-link-group="${groupId}"]`
			);

			allLinked.forEach((linkedItem) => {
				if (linkedItem === triggerItem) return;
				const isOpen = linkedItem.classList.contains('is-open');

				if (shouldOpen && !isOpen) {
					// Find the AdvancedAccordion instance that owns this item
					// so we can use its resolved settings.
					this._openItemGlobal(linkedItem);
				} else if (!shouldOpen && isOpen) {
					this._closeItemGlobal(linkedItem);
				}
			});
		}

		/**
		 * Open an item that may belong to a different container instance.
		 * Falls back to this container's defaults if no instance is found.
		 */
		_openItemGlobal(item) {
			const instance = AdvancedAccordion.instanceForItem(item);
			if (instance) {
				instance._openItem(item);
			} else {
				this._openItem(item);
			}
		}

		_closeItemGlobal(item) {
			const instance = AdvancedAccordion.instanceForItem(item);
			if (instance) {
				instance._closeItem(item);
			} else {
				this._closeItem(item);
			}
		}

		/* ── Keyboard Navigation ──────────────────────────────── */

		_handleKeyboard(e) {
			const toggles = this.items
				.map((item) => item.querySelector('.aa-toggle-button'))
				.filter(Boolean);

			const index = toggles.indexOf(e.target);
			if (index === -1) return;

			let next;

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					next = toggles[(index + 1) % toggles.length];
					break;
				case 'ArrowUp':
					e.preventDefault();
					next =
						toggles[
						(index - 1 + toggles.length) % toggles.length
						];
					break;
				case 'Home':
					e.preventDefault();
					next = toggles[0];
					break;
				case 'End':
					e.preventDefault();
					next = toggles[toggles.length - 1];
					break;
				case 'Enter':
				case ' ':
					e.preventDefault();
					e.target.click();
					return;
				default:
					return;
			}

			next?.focus();
		}

		/* ── Resize: recalculate open panels' maxHeight ───────── */

		_recalcOpenHeights() {
			this.items.forEach((item) => {
				if (!item.classList.contains('is-open')) return;
				const content = item.querySelector(
					'.wp-block-accordion-content'
				);
				if (content && content.style.maxHeight !== 'none') {
					content.style.maxHeight = content.scrollHeight + 'px';
				}
			});
		}

		/* ── Static registry ──────────────────────────────────── */

		static _instances = new Map();

		static register(container, instance) {
			AdvancedAccordion._instances.set(container, instance);
		}

		/**
		 * Given an accordion-item element, find the AdvancedAccordion
		 * instance whose container owns that item.
		 */
		static instanceForItem(item) {
			const container = item.closest('.wp-block-advanced-accordion');
			return container
				? AdvancedAccordion._instances.get(container)
				: null;
		}
	}

	/* ================================================================
	 * Bootstrap
	 * ================================================================ */

	function init() {
		document
			.querySelectorAll('.wp-block-advanced-accordion')
			.forEach((el) => {
				// Prevent double-initialisation.
				if (el.dataset.aaInit) return;
				el.dataset.aaInit = 'true';

				const instance = new AdvancedAccordion(el);
				AdvancedAccordion.register(el, instance);
			});
	}

	// Run on DOMContentLoaded or immediately if the DOM is already ready.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	// Also observe DOM mutations so accordions injected later (e.g. via
	// AJAX, block themes, or the site-editor) are initialised too.
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== 1) continue;
				if (node.classList?.contains('wp-block-advanced-accordion')) {
					if (!node.dataset.aaInit) {
						node.dataset.aaInit = 'true';
						const instance = new AdvancedAccordion(node);
						AdvancedAccordion.register(node, instance);
					}
				}
				// Also check descendants.
				node.querySelectorAll?.('.wp-block-advanced-accordion').forEach((el) => {
					if (!el.dataset.aaInit) {
						el.dataset.aaInit = 'true';
						const instance = new AdvancedAccordion(el);
						AdvancedAccordion.register(el, instance);
					}
				});
			}
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();
