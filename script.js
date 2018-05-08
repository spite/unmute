function inject() {

	window.addEventListener('activate', () => {
		list.forEach(ctx => {
			console.log('unmuting', ctx);
			ctx.resume()
		});
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

	const list = [];
	window.AudioContext = new Proxy(window.AudioContext, {
		construct(target, args) {
			const result = new target(...args);
			list.push(result);
			console.log('Logging', result.state);
			if (result.state !== 'running') {
				console.log('unmute add button');
				const ev = new CustomEvent('alert');
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
		if (request.action == "activate") {
			const ev = new CustomEvent('activate');
			window.dispatchEvent(ev);
			sendResponse({ farewell: "goodbye" });
		}
	});

window.addEventListener('alert', () => {
	chrome.runtime.sendMessage({
		type: "notification", options: {
			type: "basic",
			iconUrl: chrome.extension.getURL("icon-128.png"),
			title: "Test",
			message: "Test",
		}
	});
})
