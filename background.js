const tabs = {};
const notifications = {};

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "unmute-activate" }, function (response) { });
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "unmute-notification") {
    tabs[sender.tab.id] = request.options.count;
    chrome.notifications.create('notification', {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Web Audio Context',
      message: `This tab is trying to use audio.
Do you wish to allow it?`,
      buttons: [{
        title: "Yes, enable audio",
        //iconUrl: "/path/to/yesIcon.png"
      }]
    }, function (notificationId) {
      notifications[notificationId] = sender.tab.id;
    });
    updateBadge(sender.tab.id);
  }
  if (request.type == "unmute-executed") {
    tabs[sender.tab.id] = 0;
    updateBadge(sender.tab.id);
  }
  sendResponse();
});

chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
  const n = notifications[notifId];
  if (n) {
    if (btnIdx === 0) {
      chrome.tabs.sendMessage(n, { action: "unmute-activate" }, function (response) { });
    }
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    tabs[tabId] = 0;
  }
  updateBadge(tabId);
});

function updateBadge(tabId) {
  if (tabs[tabId] > 0) {
    chrome.browserAction.setIcon({
      path: "icon-38.png"
    });
    chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
    chrome.browserAction.setBadgeText(
      { text: `${tabs[tabId]}` }
    );
  } else {
    chrome.browserAction.setIcon({
      path: "icon0-38.png"
    });
    chrome.browserAction.setBadgeText(
      { text: '' }
    );
  }
}
