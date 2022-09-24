const path = require("path");

module.exports = {
  entry: {
    background: path.join(__dirname, "src/background.ts"),
    "hide-target": path.join(__dirname, "src/hide-target.ts"),
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
    extensions: [".ts", ".tsx", ".js"],
  },
};
