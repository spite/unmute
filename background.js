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
    chrome.browserAction.setBadgeText(
      { text: `${request.options.count}` }
    );
    chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
    chrome.browserAction.setIcon({
      path: "icon-38.png"
    });
  }
  if (request.type == "unmute-executed") {
    tabs[sender.tab.id] = 0;
    chrome.browserAction.setIcon({
      path: "icon0-38.png"
    });
    chrome.browserAction.setBadgeText(
      { text: '' }
    );
  }
  //chrome.notifications.create('notification', request.options, function() { });
  sendResponse();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  console.log(activeInfo.tabId, tabs[activeInfo.tabId]);
  if (tabs[activeInfo.tabId] > 0) {
    chrome.browserAction.setIcon({
      path: "icon-38.png"
    });
    chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
    chrome.browserAction.setBadgeText(
      { text: `${tabs[activeInfo.tabId]}` }
    );
  } else {
    chrome.browserAction.setIcon({
      path: "icon0-38.png"
    });
    chrome.browserAction.setBadgeText(
      { text: '' }
    );
  }
});

