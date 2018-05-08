function inject() {

	const btn = document.createElement('button');
	btn.classList.add('unmute');
	btn.style.position = 'fixed';
	btn.style.bottom = '0';
	btn.style.right = '0';
	btn.textContent = 'Enable Audio Context';
	btn.style.fontSize = '5em';
	btn.onclick = e => {
		list.forEach(ctx => {
			console.log('unmuting',ctx);
			ctx.resume()
		});
		btn.remove();
		e.preventDefault();
	};

	window.addEventListener('activate',() => {
		list.forEach(ctx => {
			console.log('unmuting',ctx);
			ctx.resume()
		});
		btn.remove();
	});

	window.Audio = new Proxy(window.Audio, {
		get: function(target, name, receiver) {
			console.log(target, name, receiver);
			if (name in target.__proto__) { // assume methods live on the prototype
				return function(...args) {
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
      const result =  new target(...args);
			list.push(result);
			console.log('Logging', result.state);
			if (result.state !== 'running') {
				console.log('unmute add button');
				const ev = new CustomEvent('alert');
				window.dispatchEvent(ev);
				//document.addEventListener('DOMContentLoaded', _ => {
					//document.body.appendChild(btn);
					//console.log('unmute button added');
				//});
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
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
		if (request.action == "activate"){
			const ev = new CustomEvent('activate');
			window.dispatchEvent(ev);
			sendResponse({farewell: "goodbye"});
		}
  });

	window.addEventListener('alert', () => {
	chrome.runtime.sendMessage({type: "notification", options: {
    type: "basic",
    iconUrl: chrome.extension.getURL("icon-128.png"),
    title: "Test",
    message: "Test",
}});
})
