import { fetchConfigList } from "./helpers/fetch-config-list";

fetchConfigList().then((configList) => {
  const urls = configList.map((config) => `*://${config.url}*`);

  // @ts-ignore because registerContentScripts is not in @types/chrome
  chrome.scripting.registerContentScripts([{ id: "hide-target", matches: urls, js: ["js/hide-target.js"], css: ["css/hide-target.css"] }]);
});
