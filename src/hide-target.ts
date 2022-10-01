import { Config, ConfigKey } from "./hide-target-config";

const HIDE_TARGET_CLASS_NAME = "avoid-foolish__hide-target";

const completed: number[] = [];

const inertAttribute = document.createAttribute("inert");

const hideTarget = (configList: Config[]): boolean => {
  configList.forEach((config, i) => {
    if (completed.includes(i)) {
      return;
    }
    const targets = window.document.querySelectorAll(config.targetCssSelector);
    targets.forEach((target) => {
      if (target.attributes.getNamedItem("inert") !== null && target.classList.contains(HIDE_TARGET_CLASS_NAME)) {
        return;
      }

      target.attributes.setNamedItem(inertAttribute);
      target.classList.add(HIDE_TARGET_CLASS_NAME);
      console.log("hide", target);
    });
    if (targets.length !== 0 && !config.repeat) {
      completed.push(i);
    }
  });

  return configList.length === completed.length;
};

window.addEventListener("load", () => {
  chrome.storage.sync.get().then((configData) => {
    const configList: Config[] = Array.isArray(configData[ConfigKey]) ? configData[ConfigKey] : [];

    const currentConfig = configList.filter(({ url, disable }) => location.href.match(url) && !disable);

    if (currentConfig.length === 0) {
      return;
    }

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
});
