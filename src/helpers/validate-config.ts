import { Config } from "@/hide-target-config";

export const validateCssSelector = ((dummyElement: DocumentFragment) => (selector: string) => {
  try {
    dummyElement.querySelector(selector);
  } catch (e) {
    console.log(e);
    return false;
  }
  return true;
})(document.createDocumentFragment());

export const validateConfig = (config: Config): { [T in keyof Config]?: string | null } => {
  const error: { [T in keyof Config]?: string | null } = {};

  if (config.url === "") {
    error.url = "url is required.";
  } else {
    error.url = null;
  }
  if (config.targetCssSelector === "") {
    error.targetCssSelector = "target css selector required.";
  } else if (!validateCssSelector(config.targetCssSelector)) {
    error.targetCssSelector = "target css selector is invalid.";
  } else {
    error.targetCssSelector = null;
  }

  return error;
};

export const isValidConfig = (config: Config): boolean => {
  return Object.values(validateConfig(config)).every((value) => !Boolean(value));
};
