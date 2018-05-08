function inject() {

	let list = [];

	window.addEventListener('unmute-activate', () => {
		list.forEach(ctx => {
			console.log('unmuting', ctx);
			ctx.resume()
		});
		list = [];
		const ev = new CustomEvent('unmute-executed');
		window.dispatchEvent(ev);
	});

	window.Audio = new Proxy(window.Audio, {
		get: function (target, name, receiver) {
			console.log(target, name, receiver);
			if (name in target.__proto__) { // assume methods live on the prototype
				return function (...args) {
					var methodName = name;
					// we now have access to both methodName and arguments
				};
			} else { // assume instance vars like on the target
				return Reflect.get(target, name, receiver);
			}
		}
	});

	window.AudioContext = new Proxy(window.AudioContext, {
		construct(target, args) {
			const result = new target(...args);
			list.push(result);
			if (result.state !== 'running') {
				const ev = new CustomEvent('unmute-alert', { detail: { count: list.length } });
				window.dispatchEvent(ev);
			}
			return result;
		}
	});
}

const source = inject.toString();
const script = document.createElement('script');
script.textContent = `${source};inject();`;
script.async = false;
document.documentElement.appendChild(script);

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		if (request.action == "unmute-activate") {
			const ev = new CustomEvent('unmute-activate');
			window.dispatchEvent(ev);
			sendResponse({ farewell: "goodbye" });
		}
	});

window.addEventListener('unmute-alert', (e) => {
	chrome.runtime.sendMessage({
		type: "unmute-notification",
		options: {
			count: e.detail.count
		}
	});
});

window.addEventListener('unmute-executed', () => {
	chrome.runtime.sendMessage({
		type: "unmute-executed"
	});
});
