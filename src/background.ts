import { fetchConfigList } from "./helpers/config-list-operation";

chrome.storage.onChanged.addListener(() => {
  // @ts-ignore because unregisterContentScripts is not in @types/chrome
  chrome.scripting.unregisterContentScripts().then(() => {
    fetchConfigList().then((configList) => {
      const urls = configList.map((config) => `*://${config.url}*`);

      if (urls.length === 0) {
        return;
      }

      // @ts-ignore because registerContentScripts is not in @types/chrome
      chrome.scripting.registerContentScripts([
        { id: "hide-target", matches: urls, js: ["js/hide-target.js"], css: ["css/hide-target.css"] },
      ]);
    });
  });
});
