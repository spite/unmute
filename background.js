chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "activate"}, function(response) {
      console.log(response.farewell);
    });
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type == "notification"){
    chrome.browserAction.setIcon({path:  "icon-38.png"
    });
  }
    //chrome.notifications.create('notification', request.options, function() { });

  sendResponse();
});


chrome.tabs.onActivated.addListener(function(activeInfo) {

console.log(activeInfo.tabId);
});

