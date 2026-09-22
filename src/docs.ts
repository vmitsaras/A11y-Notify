export const docs = {
  slug: 'a11y-notify',
  name: 'A11y Notify',
  packageName: 'a11y-notify',
  description:
    'A tiny framework-free ariaNotify utility with an accessible live-region fallback.',
  repo: 'https://github.com/vmitsaras/A11y-Notify',
  npm: 'https://www.npmjs.com/package/a11y-notify',
  demo: 'https://vmitsaras.github.io/A11y-Notify/',
  install: {
    npm: 'npm install a11y-notify',
    yarn: 'yarn add a11y-notify',
    pnpm: 'pnpm add a11y-notify',
  },
  usage: `import { a11yNotify } from 'a11y-notify';

// Normal priority (default)
a11yNotify('Changes saved.');

// High priority
a11yNotify('Session expired.', { priority: 'high' });

// Force live-region fallback
a11yNotify('Changes saved.', { transport: 'live-region' });`,
  api: [
    {
      name: 'a11yNotify(message, options?)',
      description:
        'Announce a message. Uses ariaNotify when available, falls back to a live region.',
    },
    {
      name: 'destroyA11yNotify()',
      description: 'Destroy the default notifier for the current document.',
    },
    {
      name: 'createA11yNotifier(document)',
      description: 'Create an explicit notifier instance for the given document.',
    },
  ],
  events: [
    { name: 'a11y-notify:init', description: 'Notifier initialized.' },
    { name: 'a11y-notify:request', description: 'Valid announcement request accepted.' },
    { name: 'a11y-notify:announce', description: 'Browser transport action committed.' },
    { name: 'a11y-notify:error', description: 'Transport or runtime error.' },
    { name: 'a11y-notify:destroy', description: 'Notifier lifecycle ended.' },
  ],
  accessibility: {
    liveRegions: true,
    ariaNotify: true,
    focusUnchanged: true,
    noVisualUI: true,
    note: 'Do not use for every visible text change or in place of proper labels and focus management.',
  },
  limitations: [
    'ariaNotify API availability does not confirm screen-reader delivery.',
    'Permissions Policy may silently block ariaNotify without detectable error.',
    'Live-region announcements depend on assistive technology behavior.',
  ],
} as const;
