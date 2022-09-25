import { Loadable } from "@/helpers/loadable";
import { Config, ConfigKey } from "@/hide-target-config";
import React, { Suspense, useCallback, useState } from "react";
import { uniqBy } from "lodash-es";

const fetchConfigList = async (): Promise<Config[]> => {
  const data = await chrome.storage.sync.get();
  return data[ConfigKey];
};

const saveConfigList = async (newConfig: Config[]) => {
  return chrome.storage.sync.set({ [ConfigKey]: newConfig });
};

const ConfigRow: React.FC<{ config: Config }> = ({ config }) => {
  return (
    <tr>
      <td>{config.url}</td>
      <td>{config.targetCssSelector}</td>
    </tr>
  );
};

const ConfigList: React.FC<{ configLoader: Loadable<Config[]> }> = ({ configLoader }) => {
  const configList = configLoader.getOrThrow();

  return (
    <table>
      <thead>
        <th>URL</th>
        <th>target css selector</th>
      </thead>
      <tbody>
        {configList.map((config) => (
          <ConfigRow config={config} />
        ))}
      </tbody>
    </table>
  );
};

const ConfigForm: React.FC<{ saveConfig: (config: Config) => Promise<void> }> = ({ saveConfig }) => {
  const [newUrl, setNewUrl] = useState("");
  const [newTargetCssSelector, setNewTargetCssSelector] = useState("");

  const onChangeNewUrl: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewUrl(e.target.value);
  const onChangeNewTargetCssSelector: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewTargetCssSelector(e.target.value);

  const onSubmit = useCallback(() => {
    if (newUrl === "") {
      return;
    }
    if (newTargetCssSelector === "") {
      return;
    }

    saveConfig({
      url: newUrl,
      targetCssSelector: newTargetCssSelector,
    });
  }, [newUrl, newTargetCssSelector]);

  return (
    <form onSubmit={onSubmit}>
      <input name="url" value={newUrl} onChange={onChangeNewUrl} />
      <input name="targetCssSelector" value={newTargetCssSelector} onChange={onChangeNewTargetCssSelector} />
      <button type="submit">save</button>
    </form>
  );
};

export const App: React.FC = () => {
  const [promisifyConfig, setPromisifyConfig] = useState(fetchConfigList());
  const configLoader = new Loadable(promisifyConfig);
  const saveConfig = useCallback(async (config: Config) => {
    const currentConfigList = await fetchConfigList();
    const newConfig = uniqBy(currentConfigList.concat(config), (config) => `${config.url}--${config.targetCssSelector}`);
    await saveConfigList(newConfig);
    setPromisifyConfig(fetchConfigList());
  }, []);

  return (
    <div>
      <Suspense fallback={"loading"}>
        <ConfigList configLoader={configLoader} />
      </Suspense>
      <ConfigForm saveConfig={saveConfig} />
    </div>
  );
};
