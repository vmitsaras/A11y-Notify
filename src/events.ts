import type { A11yNotifyPriority } from './types.js';

export const A11Y_NOTIFY_EVENTS = Object.freeze({
  init: 'a11y-notify:init',
  request: 'a11y-notify:request',
  announce: 'a11y-notify:announce',
  error: 'a11y-notify:error',
  destroy: 'a11y-notify:destroy',
} as const);

export type A11yNotifyEventName =
  (typeof A11Y_NOTIFY_EVENTS)[keyof typeof A11Y_NOTIFY_EVENTS];

export interface A11yNotifyRequestDetail {
  instance: object;
  message: string;
  priority: A11yNotifyPriority;
  transportPreference: string;
  timestamp: number;
}

export interface A11yNotifyAnnounceDetail {
  instance: object;
  message: string;
  priority: A11yNotifyPriority;
  transport: 'aria-notify' | 'live-region';
  fallback: boolean;
  timestamp: number;
}

export interface A11yNotifyErrorDetail {
  instance: object;
  message: string;
  priority: A11yNotifyPriority;
  transport: string;
  error: unknown;
  timestamp: number;
}

export interface A11yNotifyDestroyDetail {
  instance: object;
  timestamp: number;
}

export interface A11yNotifyInitDetail {
  instance: object;
  timestamp: number;
}

export type A11yNotifyDetailMap = {
  'a11y-notify:init': A11yNotifyInitDetail;
  'a11y-notify:request': A11yNotifyRequestDetail;
  'a11y-notify:announce': A11yNotifyAnnounceDetail;
  'a11y-notify:error': A11yNotifyErrorDetail;
  'a11y-notify:destroy': A11yNotifyDestroyDetail;
};

export type A11yNotifyEvent<K extends A11yNotifyEventName> = CustomEvent<
  A11yNotifyDetailMap[K]
>;

export function addA11yNotifyEventListener<K extends A11yNotifyEventName>(
  target: EventTarget,
  type: K,
  listener: (event: A11yNotifyEvent<K>) => void,
): () => void {
  const handler = listener as EventListener;
  target.addEventListener(type, handler);
  return () => {
    target.removeEventListener(type, handler);
  };
}
