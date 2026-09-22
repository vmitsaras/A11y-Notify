import {
  A11Y_NOTIFY_EVENTS,
  a11yNotify,
  addA11yNotifyEventListener,
  destroyA11yNotify,
} from './assets/a11y-notify.js';

const statusEl = document.getElementById('api-status');
if (statusEl) {
  if (typeof document.ariaNotify === 'function') {
    statusEl.textContent = 'Available in this browser.';
  } else {
    statusEl.textContent = 'Not available — live-region fallback will be used.';
  }
}

const log = document.querySelector('[data-event-log]');

function addLogEntry(type, detail) {
  if (!log) return;

  const time = new Date().toLocaleTimeString();
  const li = document.createElement('li');
  let text = `${time} ${type.replace('a11y-notify:', '')}`;
  if (detail.transport) {
    text += ` · ${detail.transport}`;
    if (detail.fallback) {
      text += ' · fallback';
    }
  }
  if (detail.priority) {
    text += ` · ${detail.priority}`;
  }
  li.textContent = text;
  log.prepend(li);
}

for (const eventName of Object.values(A11Y_NOTIFY_EVENTS)) {
  addA11yNotifyEventListener(document, eventName, (event) => {
    addLogEntry(eventName, event.detail ?? {});
  });
}

const form = document.getElementById('announce-form');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const message = data.get('message')?.toString().trim();
  const priority = data.get('priority');
  const transport = data.get('transport');
  if (!message) return;
  a11yNotify(message, {
    priority: priority === 'high' ? 'high' : 'normal',
    transport: transport === 'live-region' ? 'live-region' : 'auto',
  });
});

const scenarios = {
  saved: () => a11yNotify('Changes saved.'),
  'error-normal': () => a11yNotify("We couldn't save your preferences. Try again."),
  session: () => a11yNotify('Your session has expired.', { priority: 'high' }),
  repeated: async () => {
    a11yNotify('Item added.');
    await new Promise((resolve) => setTimeout(resolve, 200));
    a11yNotify('Item added.');
  },
  'force-fallback': () => a11yNotify('Forced live-region.', { transport: 'live-region' }),
  destroy: () => {
    destroyA11yNotify();
    a11yNotify('Notifier recreated.');
  },
};

document.querySelectorAll('[data-scenario]').forEach((button) => {
  button.addEventListener('click', () => {
    const scenario = button.getAttribute('data-scenario');
    if (scenario && scenario in scenarios) {
      void scenarios[scenario]();
    }
  });
});
