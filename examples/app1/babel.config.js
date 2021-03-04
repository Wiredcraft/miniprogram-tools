"use strict";

function presets(isRollup) {
  return [
    [
      require.resolve("@babel/preset-env"),
      {
        modules: isRollup ? false : "cjs",
        targets: { chrome: 53, ios: 8 },
      },
    ],
    "@babel/preset-typescript",
  ];
}

const plugins = [
  [
    "@wiredcraft/babel-plugin-import-regenerator",
    {
      regeneratorRuntimeFilename: "./src/vendor/regenerator-runtime.js",
    },
  ],
  ["module-resolver", { root: ["."], alias: { src: "./src" } }],
  [
    "transform-inline-environment-variables",
    { include: ["BASE_URL", "APPID"] },
  ],
];

module.exports = (api) => {
  // Rollup requires the Babel configuration to keep the ES6 moduel syntax instact
  // but miniprogram requires cjs
  // So we have to make it conditional
  const isRollup = api.caller((caller) => {
    return caller && caller.name === "@rollup/plugin-babel";
  });
  return {
    sourceType: "unambiguous",
    presets: presets(isRollup),
    plugins,
  };
};
