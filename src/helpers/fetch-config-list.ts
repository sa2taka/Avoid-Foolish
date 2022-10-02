import { Config, ConfigKey } from "@/hide-target-config";

export const fetchConfigList = (): Promise<Config[]> => {
  return chrome.storage.sync.get().then((configData) => {
    return Array.isArray(configData[ConfigKey]) ? configData[ConfigKey] : [];
  });
};
