# a11y-notify

A tiny, framework-independent accessibility utility for announcing dynamic application feedback with `document.ariaNotify()` when available and a live-region fallback everywhere else.

## Features

- Zero runtime dependencies
- ESM-first package with TypeScript declarations
- Uses `document.ariaNotify()` automatically when supported
- Falls back to hidden live regions with separate normal/high priority channels
- Emits lifecycle events for diagnostics and demos
- No visual notification UI, focus changes, or framework coupling

## Installation

```bash
npm install a11y-notify
```

## Basic usage

```ts
import { a11yNotify } from 'a11y-notify';

a11yNotify('Changes saved.');
a11yNotify('Your session has expired.', { priority: 'high' });
a11yNotify('Saved with fallback only.', { transport: 'live-region' });
```

## API

### `a11yNotify(message, options?)`
Announces a message using the default notifier for the current global `document`.

**Options**
- `priority?: 'normal' | 'high'` — defaults to `'normal'`
- `transport?: 'auto' | 'live-region'` — defaults to `'auto'`

### `destroyA11yNotify()`
Destroys the default notifier for the current global `document` and removes generated fallback live regions.

### `createA11yNotifier(document)`
Creates a dedicated notifier instance for a specific `Document`.

```ts
import { createA11yNotifier } from 'a11y-notify';

const notifier = createA11yNotifier(document);
notifier.notify('Draft saved.');
notifier.destroy();
```

### `A11yNotifier`
Class for explicit instance management.

#### `new A11yNotifier(document)`
Creates an instance and dispatches the `a11y-notify:init` event.

#### `notifier.notify(message, options?)`
Announces a trimmed non-empty string. Empty or whitespace-only values throw a `TypeError`.

#### `notifier.destroy()`
Cancels pending fallback writes, removes generated nodes, and dispatches `a11y-notify:destroy`.

## Events

Events are dispatched on the `Document` used by the notifier.

- `a11y-notify:init`
- `a11y-notify:request`
- `a11y-notify:announce`
- `a11y-notify:error`
- `a11y-notify:destroy`

Use the helper for typed listeners:

```ts
import {
  A11Y_NOTIFY_EVENTS,
  addA11yNotifyEventListener,
} from 'a11y-notify';

const remove = addA11yNotifyEventListener(
  document,
  A11Y_NOTIFY_EVENTS.announce,
  (event) => {
    console.log(event.detail.transport, event.detail.priority);
  },
);

remove();
```

## Transport behavior

### Native path
When `transport` is `'auto'` and `document.ariaNotify` exists, the package calls:

```ts
document.ariaNotify(message, { priority });
```

### Fallback path
When native support is unavailable, or when `transport: 'live-region'` is provided, the package:

- lazily creates hidden live regions in `document.body`
- maps `normal` → `role="status"`
- maps `high` → `role="alert"`
- clears previous text before the next scheduled write to help repeated announcements

## Accessibility notes

- This package does not move focus.
- This package does not render visual toast UI.
- `ariaNotify()` support does not guarantee assistive technology delivery.
- Live-region behavior still depends on browser and screen-reader combinations.
- Use this for meaningful dynamic feedback, not as a replacement for labels, validation semantics, or focus management.

## Exports

Package root exports:
- runtime API from `a11y-notify`
- documentation metadata from `a11y-notify/docs`

```ts
import { docs } from 'a11y-notify/docs';
```

## Development

```bash
npm install
npm run build
npm test
npm run docs:build
npm run typecheck
```

Additional checks:

```bash
npm run test:package
npm run pack:check
npm run docs:check
```

## Demo and examples

- GitHub Pages demo: `docs/index.html`
- Basic example: `examples/basic/index.html`

## License

MIT
