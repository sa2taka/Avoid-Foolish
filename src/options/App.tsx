import { Loadable } from "@/helpers/loadable";
import { Config, ConfigKey } from "@/hide-target-config";
import React, { Suspense, useCallback, useState } from "react";
import { uniqBy } from "lodash-es";
import { ThemeProvider } from "./ThemeProvider";
import { Box, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

const fetchConfigList = async (): Promise<Config[]> => {
  const data = await chrome.storage.sync.get();
  return data[ConfigKey];
};

const saveConfigList = async (newConfig: Config[]) => {
  return chrome.storage.sync.set({ [ConfigKey]: newConfig });
};

const ConfigRow: React.FC<{ config: Config }> = ({ config }) => {
  return (
    <TableRow>
      <TableCell>{config.url}</TableCell>
      <TableCell>{config.targetCssSelector}</TableCell>
    </TableRow>
  );
};

const ConfigList: React.FC<{ configLoader: Loadable<Config[]> }> = ({ configLoader }) => {
  const configList = configLoader.getOrThrow();

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell component="th">URL</TableCell>
          <TableCell component="th">target css selector</TableCell>
        </TableRow>
      </TableHead>
      <tbody>
        {configList.map((config) => (
          <ConfigRow config={config} key={`${config.url}--${config.targetCssSelector}`} />
        ))}
      </tbody>
    </Table>
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
    <Box component="form" display="flex" onSubmit={onSubmit} width="100%" mt="2" alignItems="center">
      <TextField
        variant="standard"
        id="url"
        name="url"
        label="URL (Partial Match, not RegExp)"
        placeholder="gojogle.com/search"
        onChange={onChangeNewUrl}
        value={newUrl}
        sx={{ marginX: "0.5em", width: "100%" }}
      />
      <TextField
        variant="standard"
        id="targetCssSelector"
        name="targetCssSelector"
        label="Target, specify with CSS selector"
        placeholder="button#search"
        onChange={onChangeNewTargetCssSelector}
        value={newTargetCssSelector}
        sx={{ marginX: "0.5em", width: "100%" }}
      />
      <Box mx={1}>
        <Button>Add</Button>
      </Box>
    </Box>
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
    <ThemeProvider>
      <div style={{ width: "100%", position: "relative" }}>
        <Suspense fallback={"loading"}>
          <ConfigList configLoader={configLoader} />
        </Suspense>
        <ConfigForm saveConfig={saveConfig} />
      </div>
    </ThemeProvider>
  );
};
