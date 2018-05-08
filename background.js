const tabs = {};

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "unmute-activate" }, function (response) {
      console.log(response.farewell);
    });
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "unmute-notification") {
    tabs[sender.tab.id] = request.options.count;
    updateBadge(sender.tab.id);
  }
  if (request.type == "unmute-executed") {
    tabs[sender.tab.id] = 0;
    updateBadge(sender.tab.id);
  }
  //chrome.notifications.create('notification', request.options, function() { });
  sendResponse();
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
