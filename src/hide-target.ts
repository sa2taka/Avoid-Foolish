import { Config } from "./hide-target-config";

const HIDE_TARGET_CLASS_NAME = "avoid-foolish__hide-target";

const configs: Config[] = [
  {
    id: "hogehoge",
    url: "console.cloud.google.com/cloudtasks/queue",
    targetCssSelector: "button[cfciamcheck='cloudtasks.queues.delete']",
  },
];

const completed: number[] = [];

const inertAttribute = document.createAttribute("inert");

window.addEventListener("load", () => {
  const currentConfig = configs.filter(({ url, disable }) => location.href.match(url) && !disable);
  if (currentConfig.length === 0) {
    return;
  }

  const observer = new MutationObserver(() => {
    currentConfig.forEach((config, i) => {
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

    if (configs.length === completed.length) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
