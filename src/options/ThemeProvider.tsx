import React, { ReactNode } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
};
