chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    await chrome.tabs
      .sendMessage(tabId, {
        message: "TabUpdated",
      })
      .catch(() => {
        /** ignore */
      });
  }
});
