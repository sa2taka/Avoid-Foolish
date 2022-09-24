// @ts-ignore because registerContentScripts is not in @types/chrome
chrome.scripting.registerContentScripts([
  { id: "1", matches: ["*://console.cloud.google.com/cloudtasks/queue/*"], js: ["js/hide-target.js"], css: ["css/hide-target.css"] },
]);
