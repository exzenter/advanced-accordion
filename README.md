# Advanced Accordion – WordPress Block Plugin

An advanced accordion block for WordPress with linked groups, per-item animation overrides, full keyboard navigation, and ARIA accessibility.

## Requirements

- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ (for building)

## Installation

1. **Clone / copy** the `advanced-accordion/` directory into `wp-content/plugins/`.
2. Install dependencies and build:

```bash
cd wp-content/plugins/advanced-accordion
npm install
npm run build
```

3. Activate the plugin in **WP Admin → Plugins**.

### Development

```bash
npm start    # watch mode – rebuilds on file changes
npm run build # production build
```

## Block Architecture

The plugin registers **four** blocks that work together:

| Block | Role |
|---|---|
| `asuspended/advanced-accordion` | Outer container – holds settings for auto-close, default animation, and icon defaults |
| `asuspended/accordion-item` | A single collapsible section – wraps a toggle + content pair |
| `asuspended/accordion-toggle` | The clickable heading / button |
| `asuspended/accordion-content` | The collapsible body (accepts any inner blocks) |

### Example HTML Output

```html
<div class="wp-block-advanced-accordion"
     data-auto-close="false"
     data-allow-multiple="true"
     data-duration="0.4"
     data-easing="ease"
     data-content-fade="true"
     data-fade-duration="0.3"
     data-slide-distance="10"
     data-stagger="0"
     style="--aa-duration:0.4s;--aa-easing:ease;--aa-fade-duration:0.3s;--aa-slide-distance:10px;--aa-stagger:0ms">

  <div class="wp-block-accordion-item"
       data-item-id="aa-item-abc12345"
       data-open-default="false"
       data-link-group="pricing-details">

    <div class="wp-block-accordion-toggle" data-icon-position="right" data-icon-rotation="true">
      <h3 class="aa-toggle-heading">
        <button class="aa-toggle-button" type="button" aria-expanded="false" aria-controls="aa-item-abc12345-content">
          <span class="aa-toggle-text">What is included?</span>
          <span class="aa-toggle-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" ...><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>
      </h3>
    </div>

    <div class="wp-block-accordion-content"
         id="aa-item-abc12345-content"
         role="region"
         hidden>
      <p>Your content here…</p>
    </div>

  </div>
</div>
```

## Features

### Standard Accordion

- Click-to-expand / collapse
- Option to auto-close siblings
- Items can be open by default
- Smooth height transitions using `maxHeight` + `requestAnimationFrame`

### Linked Groups

Add a **Link Group ID** in the item's block inspector. All items across the entire page sharing the same group ID will open and close together.

A visual badge in the editor shows which items are linked.

### Animation Settings

Available at the **container level** (applies to all items) and at the **individual item level** (overrides container settings):

| Setting | Range | Default |
|---|---|---|
| Duration | 0.1 s – 1.0 s | 0.4 s |
| Easing | linear, ease, ease-in, ease-out, ease-in-out, custom cubic-bezier | ease |
| Content Fade | on / off | on |
| Fade Duration | 0.1 s – 0.8 s | 0.3 s |
| Slide Distance | 0 – 50 px | 10 px |
| Stagger Delay | 0 – 200 ms | 0 ms |

### Block Variations

Two built-in variations are available from the inserter:

- **FAQ Accordion** – auto-close enabled, three pre-filled question items
- **Pricing Details** – items pre-linked with a `pricing-details` group ID

### Keyboard Navigation

| Key | Action |
|---|---|
| `Enter` / `Space` | Toggle the focused item |
| `Arrow Down` | Move focus to the next toggle |
| `Arrow Up` | Move focus to the previous toggle |
| `Home` | Move focus to the first toggle |
| `End` | Move focus to the last toggle |

### Accessibility

- `role="region"` on content panels
- `aria-expanded` on toggle buttons
- `aria-controls` linking toggle → content
- Proper heading hierarchy (configurable H2–H6 or `<span>`)
- `prefers-reduced-motion` disables all transitions
- `forced-colors` (high contrast) support
- Focus-visible outline on toggle buttons

## File Structure

```
advanced-accordion/
├── advanced-accordion.php      Main plugin file
├── package.json
├── webpack.config.js
├── README.md
├── src/
│   ├── block.json              Container block metadata
│   ├── index.js                Block registration entry point
│   ├── edit.js                 Container editor component
│   ├── save.js                 Container save component
│   ├── view.js                 Frontend behaviour script
│   ├── style.scss              Frontend styles
│   ├── editor.scss             Editor-only styles
│   ├── accordion-item/
│   │   ├── block.json
│   │   ├── edit.js
│   │   └── save.js
│   ├── accordion-toggle/
│   │   ├── block.json
│   │   ├── edit.js
│   │   └── save.js
│   └── accordion-content/
│       ├── block.json
│       ├── edit.js
│       └── save.js
└── build/                      Generated by `npm run build`
```

## License

GPL-2.0-or-later
