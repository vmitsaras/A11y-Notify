export type A11yNotifyPriority = 'normal' | 'high';
export type A11yNotifyTransport = 'auto' | 'live-region';

export interface A11yNotifyOptions {
  priority?: A11yNotifyPriority;
  transport?: A11yNotifyTransport;
}

export interface A11yNotifierOptions {
  // Reserved for future use
}
