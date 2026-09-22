import { A11yNotifier } from './A11yNotifier.js';
import type { A11yNotifyOptions } from './types.js';

export type {
  A11yNotifyOptions,
  A11yNotifierOptions,
  A11yNotifyPriority,
  A11yNotifyTransport,
} from './types.js';
export { A11Y_NOTIFY_EVENTS, addA11yNotifyEventListener } from './events.js';
export type {
  A11yNotifyEventName,
  A11yNotifyEvent,
  A11yNotifyRequestDetail,
  A11yNotifyAnnounceDetail,
  A11yNotifyErrorDetail,
  A11yNotifyDestroyDetail,
  A11yNotifyInitDetail,
} from './events.js';
export { A11yNotifier } from './A11yNotifier.js';

const registry = new WeakMap<Document, A11yNotifier>();

export function createA11yNotifier(doc: Document): A11yNotifier {
  return new A11yNotifier(doc);
}

export function a11yNotify(message: string, options?: A11yNotifyOptions): void {
  let notifier = registry.get(document);
  if (!notifier) {
    notifier = new A11yNotifier(document);
    registry.set(document, notifier);
  }
  notifier.notify(message, options);
}

export function destroyA11yNotify(): void {
  const notifier = registry.get(document);
  if (!notifier) return;
  notifier.destroy();
  registry.delete(document);
}
