import { fetchConfigList } from "./helpers/config-list-operation";
import { Config, ConfigKey } from "./hide-target-config";

const HIDE_TARGET_CLASS_NAME = "avoid-foolish__hide-target";

let completed: number[] = [];

const hideTarget = (configList: Config[]): boolean => {
  configList.forEach((config, i) => {
    if (completed.includes(i)) {
      return;
    }
    const targets = window.document.querySelectorAll(config.targetCssSelector);
    targets.forEach((target) => {
      const inertAttribute = document.createAttribute("inert");
      if (target.attributes.getNamedItem("inert") !== null && target.classList.contains(HIDE_TARGET_CLASS_NAME)) {
        return;
      }

      target.attributes.setNamedItem(inertAttribute);
      target.classList.add(HIDE_TARGET_CLASS_NAME);
      console.log("[avoid-foolish]hide", target);
    });
    if (targets.length !== 0 && !config.repeat) {
      completed.push(i);
    }
  });

  return configList.length === completed.length;
};

const load = () => {
  completed = [];
  fetchConfigList().then((configList) => {
    const currentConfig = configList.filter(({ url, disable }) => location.href.match(url) && !disable);
    if (currentConfig.length === 0) {
      return;
    }
    console.log("[avoid-foolish] avoid-foolish is enable.");
    console.table(currentConfig);

    hideTarget(currentConfig);

    const observer = new MutationObserver(() => {
      const allTargetCompleted = hideTarget(currentConfig);
      if (allTargetCompleted) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

window.addEventListener("load", load);

chrome.runtime.onMessage.addListener(function (request) {
  if (request.message === "TabUpdated") {
    load();
  }
});
