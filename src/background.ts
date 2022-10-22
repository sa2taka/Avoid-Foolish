import { fetchConfigList } from "./helpers/config-list-operation";

const load = () => {
  console.log("[avoid-foolish]background load");
  // @ts-ignore because unregisterContentScripts is not in @types/chrome
  chrome.scripting.unregisterContentScripts().then(() => {
    fetchConfigList().then((configList) => {
      const urls = configList.map((config) => `*://${config.url}*`);

      if (urls.length === 0) {
        return;
      }

      // @ts-ignore because registerContentScripts is not in @types/chrome
      chrome.scripting.registerContentScripts([
        { id: "hide-target", matches: ["http://*/*", "https://*/*"], js: ["js/hide-target.js"], css: ["css/hide-target.css"] },
      ]);
    });
  });
};

load();
chrome.storage.onChanged.addListener(load);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === "complete") {
    chrome.tabs.sendMessage(tabId, {
      message: "TabUpdated",
    });
  }
});
