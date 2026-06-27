// eslint.config.js
export default [
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.{js,jsx,mjs}"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    },
  },
];
