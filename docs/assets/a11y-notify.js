//#region src/events.ts
const A11Y_NOTIFY_EVENTS = Object.freeze({
	init: "a11y-notify:init",
	request: "a11y-notify:request",
	announce: "a11y-notify:announce",
	error: "a11y-notify:error",
	destroy: "a11y-notify:destroy"
});
function addA11yNotifyEventListener(target, type, listener) {
	const handler = listener;
	target.addEventListener(type, handler);
	return () => {
		target.removeEventListener(type, handler);
	};
}
//#endregion
//#region src/A11yNotifier.ts
const VISUALLY_HIDDEN_STYLE = [
	"position:absolute",
	"width:1px",
	"height:1px",
	"padding:0",
	"margin:-1px",
	"overflow:hidden",
	"clip:rect(0,0,0,0)",
	"white-space:nowrap",
	"border:0"
].join(";");
const WRITE_DELAY_MS = 50;
function hasAriaNotify(doc) {
	return typeof doc.ariaNotify === "function";
}
function dispatch(doc, type, detail) {
	doc.dispatchEvent(new CustomEvent(type, {
		detail,
		bubbles: false
	}));
}
var A11yNotifier = class {
	#doc;
	#normalRegion = null;
	#highRegion = null;
	#destroyed = false;
	constructor(doc) {
		this.#doc = doc;
		dispatch(doc, A11Y_NOTIFY_EVENTS.init, {
			instance: this,
			timestamp: Date.now()
		});
	}
	notify(message, options) {
		if (this.#destroyed) return;
		const trimmed = message.trim();
		if (!trimmed) throw new TypeError("a11y-notify: message must be a non-empty string.");
		const priority = options?.priority ?? "normal";
		const transport = options?.transport ?? "auto";
		dispatch(this.#doc, A11Y_NOTIFY_EVENTS.request, {
			instance: this,
			message: trimmed,
			priority,
			transportPreference: transport,
			timestamp: Date.now()
		});
		if (transport === "auto" && hasAriaNotify(this.#doc)) this.#announceNative(trimmed, priority);
		else this.#announceFallback(trimmed, priority);
	}
	#announceNative(message, priority) {
		try {
			this.#doc.ariaNotify(message, { priority });
			dispatch(this.#doc, A11Y_NOTIFY_EVENTS.announce, {
				instance: this,
				message,
				priority,
				transport: "aria-notify",
				fallback: false,
				timestamp: Date.now()
			});
		} catch (error) {
			dispatch(this.#doc, A11Y_NOTIFY_EVENTS.error, {
				instance: this,
				message,
				priority,
				transport: "aria-notify",
				error,
				timestamp: Date.now()
			});
		}
	}
	#announceFallback(message, priority) {
		const region = this.#ensureRegion(priority);
		if (region.timerId !== null) {
			clearTimeout(region.timerId);
			region.timerId = null;
		}
		region.pendingMessage = message;
		region.node.textContent = "";
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
				transport: "live-region",
				fallback: true,
				timestamp: Date.now()
			});
		}, WRITE_DELAY_MS);
	}
	#ensureRegion(priority) {
		if (priority === "high") {
			if (!this.#highRegion) this.#highRegion = this.#createRegion("high");
			return this.#highRegion;
		}
		if (!this.#normalRegion) this.#normalRegion = this.#createRegion("normal");
		return this.#normalRegion;
	}
	#createRegion(priority) {
		const body = this.#doc.body;
		if (!body) throw new Error("a11y-notify: document.body is required for live-region fallback.");
		const node = this.#doc.createElement("div");
		node.setAttribute("role", priority === "high" ? "alert" : "status");
		node.setAttribute("aria-atomic", "true");
		node.setAttribute("data-a11y-notify-region", priority);
		node.setAttribute("style", VISUALLY_HIDDEN_STYLE);
		body.appendChild(node);
		return {
			node,
			pendingMessage: null,
			timerId: null
		};
	}
	destroy() {
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
			timestamp: Date.now()
		});
	}
};
//#endregion
//#region src/index.ts
const registry = /* @__PURE__ */ new WeakMap();
function createA11yNotifier(doc) {
	return new A11yNotifier(doc);
}
function a11yNotify(message, options) {
	let notifier = registry.get(document);
	if (!notifier) {
		notifier = new A11yNotifier(document);
		registry.set(document, notifier);
	}
	notifier.notify(message, options);
}
function destroyA11yNotify() {
	const notifier = registry.get(document);
	if (!notifier) return;
	notifier.destroy();
	registry.delete(document);
}
//#endregion
export { A11Y_NOTIFY_EVENTS, A11yNotifier, a11yNotify, addA11yNotifyEventListener, createA11yNotifier, destroyA11yNotify };

//# sourceMappingURL=index.js.map