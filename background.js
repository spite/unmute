const allTabs = {};

// modes
const PLAY_NEW = 'playnew';
const PLAY_ALL = 'playall';
const PAUSE = 'pause';

let mode = PAUSE;

class TabState {
    constructor() {
        this.mode = PAUSE;
        this.count = 0;
    }

    // Clear the count of Audio elements and WebAudio contexts
    // requiring unmuting.
    clearCount() {
        this.count = 0;
        this.mode = PAUSE;
    }

    setCount(count) {
        this.count = count;
        this.mode = PLAY_NEW;
    }

    setPaused() {
        this.mode = PLAY_ALL;
    }
}

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const id = tabs[0].id;
        const state = allTabs[id];
        console.log('Sending: ' + 'unmute-' + state.mode);
        chrome.tabs.sendMessage(id, { action: "unmute-" + state.mode },
                                function (response) { });
        if (state.mode == PAUSE) {
            state.setPaused();
        } else {
            // Doesn't really matter whether we just did a "play-all"
            // or "play-new" operation. Display the pause button until
            // we hear that more audio objects needing unmuting were
            // created.
            state.clearCount();
        }
        updateBadge(id);
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type == "unmute-notification") {
        allTabs[sender.tab.id].setCount(request.options.count);
        updateBadge(sender.tab.id);
    }
    sendResponse();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
    const tabId = activeInfo.tabId;
    if (!allTabs[tabId]) {
        allTabs[tabId] = new TabState();
    }
    updateBadge(tabId);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
        allTabs[tabId] = new TabState();
    }
    updateBadge(tabId);
});

function updateBadge(tabId) {
    const state = allTabs[tabId];
    if (state.mode == PAUSE) {
        chrome.browserAction.setIcon({
            path: "pause_black.png"
        });
        chrome.browserAction.setBadgeText(
            { text: '' }
        );
    } else {
        chrome.browserAction.setIcon({
            path: "play_black.png"
        });
        if (state.count > 0) {
            chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
            chrome.browserAction.setBadgeText(
                { text: `${state.count}` }
            );
        } else {
            chrome.browserAction.setBadgeText(
                { text: '' }
            );
        }
    }
}
