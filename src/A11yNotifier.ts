import { A11Y_NOTIFY_EVENTS } from './events.js';
import type { A11yNotifyOptions, A11yNotifyPriority } from './types.js';

const VISUALLY_HIDDEN_STYLE = [
  'position:absolute',
  'width:1px',
  'height:1px',
  'padding:0',
  'margin:-1px',
  'overflow:hidden',
  'clip:rect(0,0,0,0)',
  'white-space:nowrap',
  'border:0',
].join(';');

const WRITE_DELAY_MS = 50;

interface RegionState {
  node: HTMLElement;
  pendingMessage: string | null;
  timerId: ReturnType<typeof setTimeout> | null;
}

function hasAriaNotify(doc: Document): boolean {
  return typeof (doc as unknown as { ariaNotify?: unknown }).ariaNotify === 'function';
}

function dispatch<T>(doc: Document, type: string, detail: T): void {
  doc.dispatchEvent(new CustomEvent(type, { detail, bubbles: false }));
}

export class A11yNotifier {
  readonly #doc: Document;
  #normalRegion: RegionState | null = null;
  #highRegion: RegionState | null = null;
  #destroyed = false;

  constructor(doc: Document) {
    this.#doc = doc;
    dispatch(doc, A11Y_NOTIFY_EVENTS.init, {
      instance: this,
      timestamp: Date.now(),
    });
  }

  notify(message: string, options?: A11yNotifyOptions): void {
    if (this.#destroyed) return;

    const trimmed = message.trim();
    if (!trimmed) {
      throw new TypeError('a11y-notify: message must be a non-empty string.');
    }

    const priority: A11yNotifyPriority = options?.priority ?? 'normal';
    const transport = options?.transport ?? 'auto';

    dispatch(this.#doc, A11Y_NOTIFY_EVENTS.request, {
      instance: this,
      message: trimmed,
      priority,
      transportPreference: transport,
      timestamp: Date.now(),
    });

    const useNative = transport === 'auto' && hasAriaNotify(this.#doc);

    if (useNative) {
      this.#announceNative(trimmed, priority);
    } else {
      this.#announceFallback(trimmed, priority);
    }
  }

  #announceNative(message: string, priority: A11yNotifyPriority): void {
    try {
      (
        this.#doc as unknown as {
          ariaNotify: (msg: string, opts: { priority: string }) => void;
        }
      ).ariaNotify(message, { priority });

      dispatch(this.#doc, A11Y_NOTIFY_EVENTS.announce, {
        instance: this,
        message,
        priority,
        transport: 'aria-notify',
        fallback: false,
        timestamp: Date.now(),
      });
    } catch (error) {
      dispatch(this.#doc, A11Y_NOTIFY_EVENTS.error, {
        instance: this,
        message,
        priority,
        transport: 'aria-notify',
        error,
        timestamp: Date.now(),
      });
    }
  }

  #announceFallback(message: string, priority: A11yNotifyPriority): void {
    const region = this.#ensureRegion(priority);

    if (region.timerId !== null) {
      clearTimeout(region.timerId);
      region.timerId = null;
    }

    region.pendingMessage = message;
    region.node.textContent = '';

    region.timerId = setTimeout(() => {
      if (this.#destroyed) return;
      region.timerId = null;
      const msg = region.pendingMessage;
      region.pendingMessage = null;
      if (msg === null) return;

      region.node.textContent = msg;

      dispatch(this.#doc, A11Y_NOTIFY_EVENTS.announce, {
        instance: this,
        message: msg,
        priority,
        transport: 'live-region',
        fallback: true,
        timestamp: Date.now(),
      });
    }, WRITE_DELAY_MS);
  }

  #ensureRegion(priority: A11yNotifyPriority): RegionState {
    if (priority === 'high') {
      if (!this.#highRegion) {
        this.#highRegion = this.#createRegion('high');
      }
      return this.#highRegion;
    }
    if (!this.#normalRegion) {
      this.#normalRegion = this.#createRegion('normal');
    }
    return this.#normalRegion;
  }

  #createRegion(priority: A11yNotifyPriority): RegionState {
    const body = this.#doc.body;
    if (!body) {
      throw new Error('a11y-notify: document.body is required for live-region fallback.');
    }

    const node = this.#doc.createElement('div');
    node.setAttribute('role', priority === 'high' ? 'alert' : 'status');
    node.setAttribute('aria-atomic', 'true');
    node.setAttribute('data-a11y-notify-region', priority);
    node.setAttribute('style', VISUALLY_HIDDEN_STYLE);
    body.appendChild(node);
    return { node, pendingMessage: null, timerId: null };
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const region of [this.#normalRegion, this.#highRegion]) {
      if (!region) continue;
      if (region.timerId !== null) {
        clearTimeout(region.timerId);
        region.timerId = null;
      }
      region.pendingMessage = null;
      region.node.remove();
    }
    this.#normalRegion = null;
    this.#highRegion = null;

    dispatch(this.#doc, A11Y_NOTIFY_EVENTS.destroy, {
      instance: this,
      timestamp: Date.now(),
    });
  }
}
