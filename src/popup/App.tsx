import { fetchConfigList, saveConfigList } from "@/helpers/config-list-operation";
import { Loadable } from "@/helpers/loadable";
import { ThemeProvider } from "@/helpers/ThemeProvider";
import { useDebounce } from "@/helpers/use-debounce";
import { isValidConfig, validateConfig } from "@/helpers/validate-config";
import { Config } from "@/hide-target-config";
import { Box, Button, Grid, IconButton, List, ListItem, styled, Switch, TextField as MUITextField } from "@mui/material";
import { groupBy, sortBy, uniqBy } from "lodash-es";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import DeleteIcon from "@mui/icons-material/Delete";

const TextField = styled(MUITextField)({ fontSize: "1em" });

const useCurrentUrlLoader = (): Loadable<string | undefined> => {
  const getCurrentUrlLoader = useCallback(() => {
    const urlPromisify = chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(([tab]) => tab)
      .then((tab) => tab.url);
    return new Loadable(urlPromisify);
  }, []);
  const [currentUrlLoader, setCurrentUrlLoader] = useState(getCurrentUrlLoader);

  useEffect(() => {
    const updateUrl = () => setCurrentUrlLoader(getCurrentUrlLoader());
    chrome.tabs.onMoved.addListener(updateUrl);
    return chrome.tabs.onMoved.removeListener(updateUrl);
  }, []);

  return currentUrlLoader;
};

const useConfigListLoader = (): Loadable<Config[]> => {
  return useMemo(() => {
    return new Loadable(fetchConfigList());
  }, []);
};

const ConfigItem: React.FC<{
  config: Config;
  updateConfig: (newConfig: Config) => void;
  deleteConfig: (id: string) => void;
}> = ({ config, updateConfig, deleteConfig }) => {
  const onChangeTarget: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
    (event) => {
      const newConfig = { ...config, targetCssSelector: event.target.value };
      updateConfig(newConfig);
    },
    [updateConfig, config]
  );

  const toggleDisable = useCallback(() => {
    const newConfig = { ...config, disable: !config.disable };
    updateConfig(newConfig);
  }, [updateConfig, config]);

  return (
    <ListItem disablePadding>
      <Grid container alignItems="center">
        <Grid item xs={8}>
          <TextField value={config.targetCssSelector} fullWidth variant="standard" onChange={onChangeTarget} />
        </Grid>
        <Grid item xs={2}>
          <Switch checked={!(config.disable ?? false)} onChange={toggleDisable} />
        </Grid>
        <Grid item xs={2}>
          <IconButton onClick={() => deleteConfig(config.id)}>
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </ListItem>
  );
};

const AddArea: React.FC<{ currentUrl: string; addConfig: (config: Config) => void }> = ({ currentUrl, addConfig }) => {
  const parsed = new URL(currentUrl);
  const host = parsed.host;
  const defaultPath = parsed.pathname;
  const [path, setPath] = useState(defaultPath);
  const [target, setTarget] = useState("");

  const config: Config = useMemo(() => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return {
      id: uuid(),
      targetCssSelector: target,
      url: `${host}${normalizedPath}`,
      disable: false,
      repeat: false,
    };
  }, [path, target]);

  const onClick = useCallback(() => {
    addConfig(config);
    setTarget("");
    setPath(defaultPath);
  }, [config, addConfig]);

  const validation = useMemo(() => {
    return validateConfig(config);
  }, [config]);

  return (
    <Box>
      <Box>
        <span>{host}</span>
        <TextField
          value={path}
          onChange={(e) => setPath(e.target.value)}
          fullWidth
          sx={{ marginLeft: "0.5em" }}
          error={path !== "" && Boolean(validation.url)}
          helperText={path === "" ? "" : validation.url}
          variant="standard"
        />
      </Box>
      <Box marginTop="0.5em">
        <TextField
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="target css selector(e.g. button#search)"
          error={target !== "" && Boolean(validation.targetCssSelector)}
          helperText={target === "" ? "" : validation.targetCssSelector}
          fullWidth
          variant="standard"
        />
      </Box>
      <Box>
        <Button onClick={onClick} sx={{ display: "block", marginLeft: "auto" }}>
          Add
        </Button>
      </Box>
    </Box>
  );
};

const ConfigArea: React.FC<{ currentUrlLoader: Loadable<string | undefined>; configListLoader: Loadable<Config[]> }> = ({
  currentUrlLoader,
  configListLoader,
}) => {
  const [configList, setConfigList] = useState(configListLoader.getOrThrow());
  const currentUrl = useMemo(() => currentUrlLoader.getOrThrow(), [currentUrlLoader]);
  const currentPageConfigList = useMemo(() => {
    if (!currentUrl) {
      return [];
    }
    return configList.filter((config) => currentUrl.match(/https?:\/\/(.+)/)?.[1].match(new RegExp(`^${config.url}`))) ?? [];
  }, [currentUrl, configList]);

  const addConfig = useCallback(
    (config: Config) => {
      const newConfigList = uniqBy(configList.concat(config), (config) => `${config.url}--${config.targetCssSelector}`);
      setConfigList(newConfigList);
    },
    [configList]
  );

  const updateConfig = useCallback(
    (newConfig: Config) => {
      const newConfigList = configList.map((config) => (config.id === newConfig.id ? newConfig : config));
      setConfigList(newConfigList);
    },
    [configList]
  );

  const deleteConfig = useCallback(
    (id: string) => {
      const newConfigList = configList.filter((config, i) => config.id !== id);
      setConfigList(newConfigList);
    },
    [configList]
  );

  const debounceSaveConfigList = useDebounce(saveConfigList, 300);
  useEffect(() => {
    if (!configList.every(isValidConfig)) {
      return;
    }
    debounceSaveConfigList(configList);
  }, [configList]);

  const configByUrl = useMemo(() => {
    return sortBy(
      Object.entries(groupBy(currentPageConfigList, (config) => config.url)).map(([url, configList]) => ({
        url,
        configList,
      })),
      ({ url }) => url.length
    );
  }, [currentPageConfigList]);

  return (
    <Box width="280px" maxHeight="453px">
      {currentUrl && <AddArea currentUrl={currentUrl} addConfig={addConfig} />}
      <List sx={{ width: "100%" }}>
        {configByUrl.map(({ url, configList }) => {
          return (
            <ListItem key={url} sx={{ display: "flex", flexDirection: "column", alignItems: "start" }}>
              <span>{url}</span>
              <List sx={{ marginLeft: "0.6em", width: "100%" }}>
                {configList.map((config, i) => {
                  return <ConfigItem key={config.id} config={config} updateConfig={updateConfig} deleteConfig={deleteConfig} />;
                })}
              </List>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export const App: React.FC = () => {
  const currentUrlLoader = useCurrentUrlLoader();
  const configListLoader = useConfigListLoader();
  return (
    <ThemeProvider>
      <Suspense fallback={"loading"}>
        <ConfigArea currentUrlLoader={currentUrlLoader} configListLoader={configListLoader} />
      </Suspense>
    </ThemeProvider>
  );
};
