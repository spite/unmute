function inject() {

    class AudioList {
        constructor(webAudioPlayFunc, webAudioPauseFunc,
                    audioElPlayFunc, audioElPauseFunc) {
            this._webAudioContexts = [];
            this._audioElements = [];

            this._webAudioPlayFunc = webAudioPlayFunc;
            this._webAudioPauseFunc = webAudioPauseFunc;
            this._audioElPlayFunc = audioElPlayFunc;
            this._audioElPauseFunc = audioElPauseFunc;
        }

        addWebAudioContext(ctx) {
            this._webAudioContexts.push(ctx);
        }

        addAudioElement(el) {
            this._audioElements.push(el);
        }

        takeAll(other) {
            this._webAudioContexts = this._webAudioContexts.concat(other._webAudioContexts);
            this._audioElements = this._audioElements.concat(other._audioElements);
            other._webAudioContexts = [];
            other._audioElements = [];
        }

        length() {
            return this._webAudioContexts.length + this._audioElements.length;
        }

        _runOnAll(webAudioFunc, audioElFunc) {
            this._webAudioContexts.forEach(el => {
                webAudioFunc.call(el);
            });
            this._audioElements.forEach(el => {
                audioElFunc.call(el);
            });
        }

        play() {
            this._runOnAll(this._webAudioPlayFunc, this._audioElPlayFunc);
        }

        pause() {
            this._runOnAll(this._webAudioPauseFunc, this._audioElPauseFunc);
        }
    }

    // Interpose on Audio elements and WebAudio contexts.
    const realPlay = window.Audio.prototype.play;
    const realPause = window.Audio.prototype.pause;
    const realSuspend = window.AudioContext.prototype.suspend;
    const realResume = window.AudioContext.prototype.resume;

    let globalList = new AudioList(realResume, realSuspend, realPlay, realPause);
    let newList = new AudioList(realResume, realSuspend, realPlay, realPause);
    let forciblyMuted = false;

    function raiseBadge() {
        window.dispatchEvent(new CustomEvent(
            'unmute-alert',
            { detail: { count: newList.length() } }
        ));
    }

    window.Audio.prototype.play = function() {
        if (forciblyMuted) {
            return Promise.reject(new DOMException('Audio forcibly muted by unmute extension'));
        }

        return realPlay.call(this).catch(err => {
            // play() raised an exception. Raise the badge and then propagate it.
            raiseBadge();
            throw err;
        });
    };

    window.Audio = new Proxy(window.Audio, {
        construct(target, args) {
            const result = new target(...args);
            newList.addAudioElement(result);
            return result;
        }
    });

    const origCreateElement = window.document.createElement;
    window.document.createElement = function(type) {
        if (type != 'audio') {
            return origCreateElement.call(this, type);
        }
        // Intercept creation of Audio element so that the proxy
        // above gets created instead.
        return new Audio();
    };

    window.AudioContext.prototype.resume = function() {
        if (forciblyMuted) {
            console.log('AudioContexts forcibly muted by unmute extension');
            return Promise.resolve();
        }

        return realResume.call(this);
    };

    window.AudioContext = new Proxy(window.AudioContext, {
        construct(target, args) {
            const result = new target(...args);
            newList.addWebAudioContext(result);
            if (result.state !== 'running') {
                raiseBadge();
            }
            return result;
        }
    });

    window.addEventListener('unmute-playnew', () => {
        forciblyMuted = false;
        newList.play();
        globalList.takeAll(newList);
    });

    window.addEventListener('unmute-playall', () => {
        forciblyMuted = false;
        globalList.play();
    });

    window.addEventListener('unmute-pause', () => {
        globalList.pause();
        newList.pause();
        forciblyMuted = true;
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
        if (request.action.startsWith('unmute-')) {
            const ev = new CustomEvent(request.action);
            window.dispatchEvent(ev);
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
