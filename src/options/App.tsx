import { Loadable } from "@/helpers/loadable";
import { Config, ConfigKey } from "@/hide-target-config";
import React, { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { uniqBy } from "lodash-es";
import { ThemeProvider } from "./ThemeProvider";
import { Box, Button, TextField, Table, TableBody, Checkbox, TableCell, TableHead, TableRow, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuid } from "uuid";
import { useDebounce } from "@/helpers/use-debounce";

const fetchConfigList = async (): Promise<Config[]> => {
  const data = await chrome.storage.sync.get();
  return data[ConfigKey];
};

const saveConfigList = async (newConfig: Config[]) => {
  return chrome.storage.sync.set({ [ConfigKey]: newConfig });
};

const validateCssSelector = ((dummyElement: DocumentFragment) => (selector: string) => {
  try {
    dummyElement.querySelector(selector);
  } catch (e) {
    console.log(e);
    return false;
  }
  return true;
})(document.createDocumentFragment());

const validateConfig = (config: Config): { [T in keyof Config]?: string | null } => {
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

const isValidConfig = (config: Config): boolean => {
  return Object.values(validateConfig(config)).every((value) => !Boolean(value));
};

const ConfigRow: React.FC<{
  config: Config;
  index: number;
  updateConfig: (newConfig: Config, index: number) => void;
  deleteConfig: (index: number) => void;
}> = ({ config, index, updateConfig, deleteConfig }) => {
  const deleteConfigNoArgs = useCallback(() => deleteConfig(index), [deleteConfig, index]);

  const [newUrl, setNewUrl] = useState(config.url);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [newTargetCssSelector, setNewTargetCssSelector] = useState(config.targetCssSelector);
  const [targetCssSelectorError, setCssSelectorError] = useState<string | null>(null);
  const [newEnable, setNewEnable] = useState(!config.disable);

  const onChangeNewUrl: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewUrl(e.target.value);
  const onChangeNewTargetCssSelector: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewTargetCssSelector(e.target.value);
  const onChangeEnable = () => setNewEnable(!newEnable);

  useEffect(() => {
    const newConfig: Config = {
      id: config.id,
      url: newUrl,
      targetCssSelector: newTargetCssSelector,
      disable: !newEnable,
    };
    const error = validateConfig(newConfig);
    setUrlError(error.url ?? null);
    setCssSelectorError(error.targetCssSelector ?? null);

    updateConfig(newConfig, index);
  }, [newUrl, newTargetCssSelector, newEnable]);

  return (
    <TableRow>
      <TableCell>
        <TextField
          variant="standard"
          value={config.url}
          onChange={onChangeNewUrl}
          fullWidth
          error={Boolean(urlError)}
          helperText={urlError ?? undefined}
        />
      </TableCell>
      <TableCell>
        <TextField
          variant="standard"
          value={config.targetCssSelector}
          onChange={onChangeNewTargetCssSelector}
          fullWidth
          error={Boolean(targetCssSelectorError)}
          helperText={targetCssSelectorError ?? undefined}
        />
      </TableCell>
      <TableCell>
        <Checkbox checked={!config.disable} onChange={onChangeEnable} />
      </TableCell>
      <TableCell>
        <IconButton size="small" onClick={deleteConfigNoArgs}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const ConfigList: React.FC<{ configList: Config[]; updateConfigList: (configList: Config[]) => void }> = ({
  configList,
  updateConfigList,
}) => {
  const updateConfig = useCallback(
    (newConfig: Config, targetIndex: number) => {
      const newConfigList = configList.map((config, i) => {
        if (i !== targetIndex) {
          return config;
        }

        return newConfig;
      });
      updateConfigList(newConfigList);
    },
    [configList]
  );

  const deleteConfig = useCallback(
    (targetIndex: number) => {
      const newConfigList = configList.filter((_, i) => i !== targetIndex);
      updateConfigList(newConfigList);
    },
    [configList]
  );

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell component="th">URL</TableCell>
          <TableCell component="th">target css selector</TableCell>
          <TableCell component="th">enable</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {configList.map((config, i) => (
          <ConfigRow config={config} key={config.id} index={i} updateConfig={updateConfig} deleteConfig={deleteConfig} />
        ))}
      </TableBody>
    </Table>
  );
};

const ConfigForm: React.FC<{ addConfig: (config: Config) => void }> = ({ addConfig }) => {
  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [newTargetCssSelector, setNewTargetCssSelector] = useState("");
  const [targetCssSelectorError, setCssSelectorError] = useState<string | null>(null);

  const onChangeNewUrl: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewUrl(e.target.value);
  const onChangeNewTargetCssSelector: React.ChangeEventHandler<HTMLInputElement> = (e) => setNewTargetCssSelector(e.target.value);

  const onSubmit = useCallback(
    (event: FormEvent) => {
      const newConfig: Config = {
        id: uuid(),
        url: newUrl,
        targetCssSelector: newTargetCssSelector,
      };
      const error = validateConfig(newConfig);
      setUrlError(error.url ?? null);
      setCssSelectorError(error.targetCssSelector ?? null);

      if (isValidConfig(newConfig)) {
        addConfig(newConfig);
        setNewUrl("");
        setNewTargetCssSelector("");
        setUrlError(null);
        setCssSelectorError(null);
      }

      event.preventDefault();
    },
    [newUrl, newTargetCssSelector]
  );

  return (
    <Box component="form" display="flex" onSubmit={onSubmit} width="100%" mt="1em" alignItems="center">
      <TextField
        variant="standard"
        id="url"
        name="url"
        label="URL (Partial Match, not RegExp)"
        placeholder="google.com/search"
        onChange={onChangeNewUrl}
        value={newUrl}
        sx={{ marginX: "0.5em", width: "100%" }}
        fullWidth
        error={Boolean(urlError)}
        helperText={urlError ?? undefined}
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
        fullWidth
        error={Boolean(targetCssSelectorError)}
        helperText={targetCssSelectorError ?? undefined}
      />
      <Box mx={1}>
        <Button type="submit">Add</Button>
      </Box>
    </Box>
  );
};

export const ConfigArea: React.FC<{ configListLoader: Loadable<Config[]> }> = ({ configListLoader }) => {
  const [isFirst, setIsFirst] = useState(true);
  const [configList, setConfigList] = useState(configListLoader.getOrThrow());

  const addConfig = useCallback(
    (config: Config) => {
      const newConfigList = uniqBy(configList.concat(config), (config) => `${config.url}--${config.targetCssSelector}`);
      setConfigList(newConfigList);
    },
    [configList]
  );

  const debounceSaveConfigList = useDebounce(saveConfigList, 300);
  useEffect(() => {
    if (isFirst) {
      setIsFirst(false);
      return;
    }

    if (!configList.every(isValidConfig)) {
      return;
    }
    debounceSaveConfigList(configList);
  }, [configList]);

  return (
    <Box minWidth={640}>
      <ConfigList configList={configList} updateConfigList={setConfigList} />
      <ConfigForm addConfig={addConfig} />
    </Box>
  );
};

export const App: React.FC = () => {
  const configListLoader = useMemo(() => new Loadable(fetchConfigList()), []);

  return (
    <ThemeProvider>
      <Suspense fallback={"loading"}>
        <ConfigArea configListLoader={configListLoader} />
      </Suspense>
    </ThemeProvider>
  );
};
