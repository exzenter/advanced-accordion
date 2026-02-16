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

			// Store listener references for cleanup
			this._listeners = new Map();
			this._keydownHandler = null;
			this._resizeObserver = null;

			this._init();
		}

		/* ── Initialisation ────────────────────────────────────── */

		_init() {
			this.items.forEach((item) => this._initItem(item));

			// Keyboard navigation across toggle buttons in this container.
			this._keydownHandler = (e) => this._handleKeyboard(e);
			this.container.addEventListener('keydown', this._keydownHandler);

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

			const toggleId = `${id}-toggle`;
			const contentId = `${id}-content`;

			toggle.id = toggleId;
			content.id = contentId;
			toggle.setAttribute('aria-controls', contentId);
			content.setAttribute('aria-labelledby', toggleId);

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
			const clickHandler = () => this._toggle(item);
			toggle.addEventListener('click', clickHandler);
			// Store for cleanup
			this._listeners.set(toggle, clickHandler);
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
			const toggle = item.querySelector('.aa-toggle-button');
			const content = item.querySelector('.wp-block-accordion-content');
			if (!toggle || !content) return;

			const s = this._getSettings(item);
			const dur = instant ? 0 : s.duration;

			item.classList.add('is-open');
			toggle.setAttribute('aria-expanded', 'true');
			content.hidden = false;

			// Toggle CSS class for no-fade mode
			if (!s.contentFade) {
				content.classList.add('aa-no-fade');
			} else {
				content.classList.remove('aa-no-fade');
			}

			// Set CSS custom properties for animations
			item.style.setProperty('--aa-duration', `${dur}s`);
			item.style.setProperty('--aa-easing', s.easing);

			// Only manipulate children if fade is enabled
			if (s.contentFade && !instant) {
				const elements = this._getAnimatableElements(content);
				elements.forEach((child) => {
					child.style.opacity = '0';
					child.style.transform = `translateY(${s.slideDistance}px)`;
				});
			}

			// Measure target height
			content.style.transition = 'none';
			content.style.maxHeight = 'none';
			content.style.overflow = 'hidden';
			const targetHeight = content.offsetHeight;

			// Reset to zero
			content.style.maxHeight = '0';
			// eslint-disable-next-line no-unused-expressions
			content.offsetHeight; // Force reflow

			requestAnimationFrame(() => {
				// Animate to target height
				content.style.transition = `max-height ${dur}s ${s.easing}`;
				content.style.maxHeight = targetHeight + 'px';

				// Fade in children only if contentFade is enabled
				if (s.contentFade && !instant) {
					this._fadeInChildren(content, s);
				}
			});

			// Cleanup after transition
			const onEnd = (e) => {
				if (e && e.propertyName !== 'max-height') return;
				content.style.maxHeight = 'none';
				content.removeEventListener('transitionend', onEnd);
			};

			if (dur > 0) {
				content.addEventListener('transitionend', onEnd);
			} else {
				content.style.maxHeight = 'none';
			}
		}

		/* ── Close an item ────────────────────────────────────── */

		_closeItem(item) {
			const toggle = item.querySelector('.aa-toggle-button');
			const content = item.querySelector('.wp-block-accordion-content');
			if (!toggle || !content) return;

			// Prevent double-close
			if (content.dataset.isClosing === 'true') return;
			content.dataset.isClosing = 'true';

			const s = this._getSettings(item);
			
			console.log('🔽 Closing accordion item:', {
				contentFade: s.contentFade,
				duration: s.duration,
				fadeDuration: s.fadeDuration,
				easing: s.easing
			});

			// Set CSS custom properties for animations
			item.style.setProperty('--aa-duration', `${s.duration}s`);
			item.style.setProperty('--aa-easing', s.easing);

			// Toggle CSS class for no-fade mode
			if (!s.contentFade) {
				content.classList.add('aa-no-fade');
				console.log('✓ Content fade disabled - no fade animation');
			} else {
				content.classList.remove('aa-no-fade');
				console.log('✓ Content fade enabled - will fade out children');
			}

			// Snapshot current height
			const currentHeight = content.scrollHeight;
			console.log('📏 Current height:', currentHeight + 'px');

			// Lock height before animating
			content.style.transition = 'none';
			content.style.overflow = 'hidden';
			content.style.setProperty('max-height', currentHeight + 'px', 'important');
			console.log('🔒 Locked height:', {
				setTo: currentHeight + 'px',
				styleValue: content.style.maxHeight,
				computedValue: window.getComputedStyle(content).maxHeight,
				priority: content.style.getPropertyPriority('max-height')
			});
			// eslint-disable-next-line no-unused-expressions
			content.offsetHeight; // Force reflow

			let hasCompleted = false;
			const cleanup = () => {
				if (hasCompleted) return;
				hasCompleted = true;

				console.log('🧹 Cleanup called');

				// Cleanup
				item.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
				content.hidden = true;
				content.style.maxHeight = '';
				content.style.transition = '';
				content.style.overflow = '';
				content.style.opacity = '';

				// Clear child inline styles only if fade was used
				if (s.contentFade) {
					const elements = this._getAnimatableElements(content);
					elements.forEach((child) => {
						child.style.transition = '';
						child.style.opacity = '';
						child.style.transform = '';
					});
				}

				content.dataset.isClosing = 'false';
				console.log('✅ Close complete');
			};

			if (s.duration > 0) {
				let fallbackTimeout;
				
				// Debug: listen to ALL transitionend events
				const debugHandler = (e) => {
					console.log('🎯 TransitionEnd event (ANY):', {
						target: e.target.tagName + (e.target.className ? '.' + e.target.className.split(' ').join('.') : ''),
						propertyName: e.propertyName,
						isContent: e.target === content,
						elapsedTime: e.elapsedTime
					});
				};
				content.addEventListener('transitionend', debugHandler, true); // Use capture phase
				
				const transitionEndHandler = (e) => {
					// Only respond to max-height transitions on the content element itself
					if (e.target !== content || e.propertyName !== 'max-height') return;
					console.log('⏱️ TransitionEnd fired for max-height - CLEANUP');
					content.removeEventListener('transitionend', transitionEndHandler);
					content.removeEventListener('transitionend', debugHandler, true);
					clearTimeout(fallbackTimeout);
					cleanup();
				};
				
				content.addEventListener('transitionend', transitionEndHandler);
				
				// Fallback timeout in case transitionend doesn't fire
				fallbackTimeout = setTimeout(() => {
					console.log('⚠️ Fallback timeout triggered');
					content.removeEventListener('transitionend', transitionEndHandler);
					content.removeEventListener('transitionend', debugHandler);
					cleanup();
				}, (s.duration * 1000) + 100);

				requestAnimationFrame(() => {
					console.log('🎬 Starting collapse animation');
					// Set transition first, then animate to 0
					content.style.transition = `max-height ${s.duration}s ${s.easing}`;
					content.style.setProperty('max-height', '0px', 'important');
					
					// Check immediately
					console.log('🔍 Immediately after setting:', {
						styleMaxHeight: content.style.maxHeight,
						computedMaxHeight: window.getComputedStyle(content).maxHeight,
					});
					
					// Check after a tiny delay to see if it updates
					setTimeout(() => {
						console.log('🔍 After 10ms:', {
							styleMaxHeight: content.style.maxHeight,
							computedMaxHeight: window.getComputedStyle(content).maxHeight,
						});
					}, 10);
					
					setTimeout(() => {
						console.log('🔍 After 100ms:', {
							styleMaxHeight: content.style.maxHeight,
							computedMaxHeight: window.getComputedStyle(content).maxHeight,
						});
					}, 100);

					// Fade out children ONLY if contentFade is enabled
					if (s.contentFade) {
						console.log('🌫️ Fading out children');
						this._fadeOutChildren(content, s);
					}
				});
			} else {
				console.log('⚡ Instant close (duration = 0)');
				content.style.maxHeight = '0px';
				cleanup();
			}
		}

		/* ── Content fade helpers ─────────────────────────────── */

		_fadeInChildren(content, s) {
			// Get all descendants that should be animated (direct children + nested list items)
			const elements = this._getAnimatableElements(content);
			elements.forEach((child, i) => {
				const delay = s.stagger * i;
				child.style.transition = `opacity ${s.fadeDuration}s ${s.easing} ${delay}ms, transform ${s.fadeDuration}s ${s.easing} ${delay}ms`;
				child.style.opacity = '1';
				child.style.transform = 'translateY(0)';
			});
		}

		_fadeOutChildren(content, s) {
			// Get all descendants that should be animated (direct children + nested list items)
			const elements = this._getAnimatableElements(content);
			elements.forEach((child) => {
				child.style.transition = `opacity ${s.fadeDuration}s ${s.easing}, transform ${s.fadeDuration}s ${s.easing}`;
				child.style.opacity = '0';
				child.style.transform = `translateY(-${s.slideDistance}px)`;
			});
		}

		/**
		 * Get elements that should be animated with stagger effect.
		 * Includes direct children and nested list items (li).
		 */
		_getAnimatableElements(content) {
			const elements = [];
			
			// Add direct children
			Array.from(content.children).forEach((child) => {
				// Check if this child contains a list (ul or ol)
				const lists = child.querySelectorAll('ul, ol');
				
				if (lists.length > 0) {
					// If it contains lists, animate the list items instead of the parent
					lists.forEach((list) => {
						const listItems = Array.from(list.children).filter(
							(item) => item.tagName === 'LI'
						);
						elements.push(...listItems);
					});
				} else {
					// No lists, animate the direct child
					elements.push(child);
				}
			});
			
			return elements;
		}

		/* ── Linked group synchronisation ─────────────────────── */

		_syncLinkedGroup(groupId, triggerItem, shouldOpen) {
			const allLinked = document.querySelectorAll(
				`.wp-block-accordion-item[data-link-group="${groupId}"]`
			);

			allLinked.forEach((linkedItem) => {
				if (linkedItem === triggerItem) return;
				const isOpen = linkedItem.classList.contains('is-open');

				if (shouldOpen && !isOpen) {
					this._openItemGlobal(linkedItem);
				} else if (!shouldOpen && isOpen) {
					this._closeItemGlobal(linkedItem);
				}
			});
		}

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
					next = toggles[(index - 1 + toggles.length) % toggles.length];
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
				const content = item.querySelector('.wp-block-accordion-content');
				// Don't recalculate if the item is currently closing
				if (content && content.dataset.isClosing === 'true') return;
				if (content && content.style.maxHeight !== 'none') {
					content.style.maxHeight = content.scrollHeight + 'px';
				}
			});
		}

		/* ── Cleanup and destroy ───────────────────────────────── */

		destroy() {
			// Disconnect ResizeObserver
			if (this._resizeObserver) {
				this._resizeObserver.disconnect();
				this._resizeObserver = null;
			}

			// Remove keydown listener
			if (this._keydownHandler) {
				this.container.removeEventListener('keydown', this._keydownHandler);
				this._keydownHandler = null;
			}

			// Remove all click listeners
			this._listeners.forEach((handler, toggle) => {
				toggle.removeEventListener('click', handler);
			});
			this._listeners.clear();

			// Unregister from instances Map
			AdvancedAccordion.unregister(this.container);
		}

		/* ── Static registry ──────────────────────────────────── */

		static _instances = new Map();

		static register(container, instance) {
			AdvancedAccordion._instances.set(container, instance);
		}

		static unregister(container) {
			AdvancedAccordion._instances.delete(container);
		}

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
				if (el.dataset.aaInit) return;
				el.dataset.aaInit = 'true';
				const instance = new AdvancedAccordion(el);
				AdvancedAccordion.register(el, instance);
			});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			// Handle added nodes
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== 1) continue;
				if (node.classList?.contains('wp-block-advanced-accordion')) {
					if (!node.dataset.aaInit) {
						node.dataset.aaInit = 'true';
						const instance = new AdvancedAccordion(node);
						AdvancedAccordion.register(node, instance);
					}
				}
				node.querySelectorAll?.('.wp-block-advanced-accordion').forEach((el) => {
					if (!el.dataset.aaInit) {
						el.dataset.aaInit = 'true';
						const instance = new AdvancedAccordion(el);
						AdvancedAccordion.register(el, instance);
					}
				});
			}

			// Handle removed nodes - cleanup
			for (const node of mutation.removedNodes) {
				if (node.nodeType !== 1) continue;
				if (node.classList?.contains('wp-block-advanced-accordion')) {
					const instance = AdvancedAccordion._instances.get(node);
					if (instance) {
						instance.destroy();
					}
				}
				// Check for nested accordions
				node.querySelectorAll?.('.wp-block-advanced-accordion').forEach((el) => {
					const instance = AdvancedAccordion._instances.get(el);
					if (instance) {
						instance.destroy();
					}
				});
			}
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();
