import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  A11Y_NOTIFY_EVENTS,
  A11yNotifier,
  a11yNotify,
  addA11yNotifyEventListener,
  createA11yNotifier,
  destroyA11yNotify,
} from '../src/index.js';

function waitForDom(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100));
}

describe('exports', () => {
  it('exports a11yNotify function', () => {
    expect(typeof a11yNotify).toBe('function');
  });

  it('exports destroyA11yNotify function', () => {
    expect(typeof destroyA11yNotify).toBe('function');
  });

  it('exports createA11yNotifier function', () => {
    expect(typeof createA11yNotifier).toBe('function');
  });

  it('exports A11yNotifier class', () => {
    expect(typeof A11yNotifier).toBe('function');
  });

  it('exports A11Y_NOTIFY_EVENTS', () => {
    expect(A11Y_NOTIFY_EVENTS.init).toBe('a11y-notify:init');
    expect(A11Y_NOTIFY_EVENTS.announce).toBe('a11y-notify:announce');
    expect(A11Y_NOTIFY_EVENTS.request).toBe('a11y-notify:request');
    expect(A11Y_NOTIFY_EVENTS.error).toBe('a11y-notify:error');
    expect(A11Y_NOTIFY_EVENTS.destroy).toBe('a11y-notify:destroy');
  });
});

describe('input validation', () => {
  beforeEach(() => destroyA11yNotify());
  afterEach(() => destroyA11yNotify());

  it('throws TypeError for empty string', () => {
    expect(() => a11yNotify('')).toThrow(TypeError);
  });

  it('throws TypeError for whitespace-only string', () => {
    expect(() => a11yNotify('   ')).toThrow(TypeError);
  });

  it('accepts a valid message', () => {
    expect(() => a11yNotify('Hello')).not.toThrow();
  });

  it('normal priority is the default', async () => {
    const requests: Array<{ priority: string }> = [];
    const unsub = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.request, (event) => {
      requests.push({ priority: event.detail.priority });
    });

    a11yNotify('Hello', { transport: 'live-region' });
    await waitForDom();
    unsub();

    expect(requests).toHaveLength(1);
    expect(requests[0]?.priority).toBe('normal');
  });

  it('whitespace is normalized before announcing', async () => {
    const announces: string[] = [];
    const unsub = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.announce, (event) => {
      announces.push(event.detail.message);
    });

    a11yNotify('  Hello world  ', { transport: 'live-region' });
    await waitForDom();
    unsub();

    expect(announces).toEqual(['Hello world']);
  });
});

describe('A11yNotifier: fallback', () => {
  let notifier: A11yNotifier;

  beforeEach(() => {
    notifier = createA11yNotifier(document);
  });

  afterEach(() => {
    notifier.destroy();
  });

  it('creates a normal region lazily', () => {
    notifier.notify('Changes saved.', { transport: 'live-region' });
    const region = document.querySelector('[data-a11y-notify-region="normal"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('role')).toBe('status');
  });

  it('creates a high region lazily', () => {
    notifier.notify('Session expired.', {
      transport: 'live-region',
      priority: 'high',
    });
    const region = document.querySelector('[data-a11y-notify-region="high"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('role')).toBe('alert');
  });

  it('creates regions only once', () => {
    notifier.notify('Msg 1', { transport: 'live-region' });
    notifier.notify('Msg 2', { transport: 'live-region' });
    const regions = document.querySelectorAll('[data-a11y-notify-region="normal"]');
    expect(regions.length).toBe(1);
  });

  it('normal and high regions are independent', () => {
    notifier.notify('Normal', { transport: 'live-region', priority: 'normal' });
    notifier.notify('High', { transport: 'live-region', priority: 'high' });
    expect(document.querySelectorAll('[data-a11y-notify-region]').length).toBe(2);
  });

  it('commits message after delay', async () => {
    notifier.notify('Committed.', { transport: 'live-region' });
    const region = document.querySelector('[data-a11y-notify-region="normal"]');
    expect(region?.textContent).toBe('');
    await waitForDom();
    expect(region?.textContent).toBe('Committed.');
  });

  it('repeated identical message causes a new mutation', async () => {
    notifier.notify('Saved.', { transport: 'live-region' });
    await waitForDom();
    const region = document.querySelector('[data-a11y-notify-region="normal"]');
    expect(region?.textContent).toBe('Saved.');
    notifier.notify('Saved.', { transport: 'live-region' });
    expect(region?.textContent).toBe('');
    await waitForDom();
    expect(region?.textContent).toBe('Saved.');
  });
});

describe('A11yNotifier: native transport', () => {
  let notifier: A11yNotifier;
  let ariaNotifyMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ariaNotifyMock = vi.fn();
    (document as unknown as { ariaNotify?: typeof ariaNotifyMock }).ariaNotify = ariaNotifyMock;
    notifier = createA11yNotifier(document);
  });

  afterEach(() => {
    notifier.destroy();
    delete (document as unknown as { ariaNotify?: typeof ariaNotifyMock }).ariaNotify;
  });

  it('calls ariaNotify with normal priority', () => {
    notifier.notify('Test.', { transport: 'auto' });
    expect(ariaNotifyMock).toHaveBeenCalledWith('Test.', { priority: 'normal' });
  });

  it('calls ariaNotify with high priority', () => {
    notifier.notify('Test.', { transport: 'auto', priority: 'high' });
    expect(ariaNotifyMock).toHaveBeenCalledWith('Test.', { priority: 'high' });
  });

  it('does not create live regions when using native', () => {
    notifier.notify('Test.');
    expect(document.querySelector('[data-a11y-notify-region]')).toBeNull();
  });

  it('forced fallback bypasses native API', () => {
    notifier.notify('Test.', { transport: 'live-region' });
    expect(ariaNotifyMock).not.toHaveBeenCalled();
    expect(document.querySelector('[data-a11y-notify-region]')).not.toBeNull();
  });

  it('emits error event when native throws', () => {
    ariaNotifyMock.mockImplementation(() => {
      throw new Error('Permissions Policy');
    });
    const errors: unknown[] = [];
    const unsub = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.error, (event) => {
      errors.push(event.detail.error);
    });

    notifier.notify('Test.');
    unsub();

    expect(errors).toHaveLength(1);
  });
});

describe('A11yNotifier: destroy', () => {
  it('removes generated nodes on destroy', async () => {
    const notifier = createA11yNotifier(document);
    notifier.notify('Hi.', { transport: 'live-region' });
    await waitForDom();
    notifier.destroy();
    expect(document.querySelector('[data-a11y-notify-region]')).toBeNull();
  });

  it('destroy is idempotent', () => {
    const notifier = createA11yNotifier(document);
    expect(() => {
      notifier.destroy();
      notifier.destroy();
    }).not.toThrow();
  });

  it('destroy cancels pending writes', async () => {
    const notifier = createA11yNotifier(document);
    notifier.notify('Pending.', { transport: 'live-region' });
    notifier.destroy();
    await waitForDom();
    expect(document.querySelector('[data-a11y-notify-region]')).toBeNull();
  });
});

describe('default notifier: WeakMap per document', () => {
  beforeEach(() => destroyA11yNotify());
  afterEach(() => destroyA11yNotify());

  it('reuses default notifier per document', () => {
    const initEvents: unknown[] = [];
    const unsub = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.init, (event) => {
      initEvents.push(event.detail);
    });

    a11yNotify('First', { transport: 'live-region' });
    a11yNotify('Second', { transport: 'live-region' });
    unsub();

    expect(initEvents).toHaveLength(1);
  });

  it('reinitializes after destroy', () => {
    const initEvents: unknown[] = [];
    const unsub = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.init, (event) => {
      initEvents.push(event.detail);
    });

    a11yNotify('Hello.', { transport: 'live-region' });
    destroyA11yNotify();
    a11yNotify('Hello again.', { transport: 'live-region' });
    unsub();

    expect(initEvents).toHaveLength(2);
  });
});

describe('lifecycle events', () => {
  let notifier: A11yNotifier;

  beforeEach(() => {
    notifier = createA11yNotifier(document);
  });

  afterEach(() => {
    notifier.destroy();
  });

  it('emits request event before announce', async () => {
    const events: string[] = [];
    const offRequest = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.request, () => {
      events.push('request');
    });
    const offAnnounce = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.announce, () => {
      events.push('announce');
    });

    notifier.notify('Order test.', { transport: 'live-region' });
    await waitForDom();
    offRequest();
    offAnnounce();

    expect(events[0]).toBe('request');
    expect(events[1]).toBe('announce');
  });

  it('emits destroy event on destroy', () => {
    const events: string[] = [];
    const offDestroy = addA11yNotifyEventListener(document, A11Y_NOTIFY_EVENTS.destroy, () => {
      events.push('destroy');
    });

    notifier.destroy();
    offDestroy();

    expect(events).toContain('destroy');
  });
});
