import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "error",
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
];
