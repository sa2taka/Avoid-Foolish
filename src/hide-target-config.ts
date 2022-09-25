export type Config = {
  url: string;
  targetCssSelector: string;
  repeat?: boolean;
  disable?: boolean;
};

export const ConfigKey = "hide-target-config";
