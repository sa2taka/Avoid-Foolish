import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  const container = document.getElementById("options");
  const root = createRoot(container!);
  root.render(<App />);
});
