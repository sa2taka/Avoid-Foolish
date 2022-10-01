import { Config, ConfigKey } from "./hide-target-config";

chrome.storage.sync.get().then((configData) => {
  const configList: Config[] = Array.isArray(configData[ConfigKey]) ? configData[ConfigKey] : [];

  const urls = configList.map((config) => `*://${config.url}*`);

  // @ts-ignore because registerContentScripts is not in @types/chrome
  chrome.scripting.registerContentScripts([{ id: "hide-target", matches: urls, js: ["js/hide-target.js"], css: ["css/hide-target.css"] }]);
});
