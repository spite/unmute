function inject() {

	let list = [];
	let audioElements = [];
  const testAudioContext = new AudioContext();
  if (testAudioContext.state !== 'running') {

	let unmuted = false

	const realPlay = window.Audio.prototype.play;
	window.Audio.prototype.play = function() {
		if (unmuted) {
			// Can call play() without raising an exception.
			realPlay.call(this);
		}
	};

	const origCreateElement = window.document.createElement;
		window.document.createElement = function(type) {
		if (type != 'audio') {
			return origCreateElement.call(this, type);
		}
		// Intercept creation of Audio element so that the proxy
                // below gets created instead.
		return new Audio();
	};

	window.addEventListener('unmute-activate', () => {
		list.forEach(ctx => {
			console.log('unmuting', ctx);
			ctx.resume()
		});
		list = [];
		audioElements.forEach(el => {
			console.log('playing', el);
			realPlay.call(el);
		});
		audioElements = [];
		unmuted = true;
		const ev = new CustomEvent('unmute-executed');
		window.dispatchEvent(ev);
	});

	window.Audio = new Proxy(window.Audio, {
		construct(target, args) {
			console.log('Saw Audio construction');
			const result = new target(...args);
			audioElements.push(result);
			const ev = new CustomEvent('unmute-alert', { detail: { count: list.length + audioElements.length } });
			window.dispatchEvent(ev);
			return result;
		}
  });

	window.AudioContext = new Proxy(window.AudioContext, {
		construct(target, args) {
			const result = new target(...args);
			list.push(result);
			if (result.state !== 'running') {
				const ev = new CustomEvent('unmute-alert', { detail: { count: list.length + audioElements.length } });
				window.dispatchEvent(ev);
			}
			return result;
		}
	});

}
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
