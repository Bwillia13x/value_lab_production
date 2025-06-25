module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals"
  ],
  ignorePatterns: [
    "futuristic-dash/**/*",
    "node_modules/**/*",
    "coverage/**/*",
    "dist/**/*"
  ],
  rules: {
    // Place to specify ESLint rules. Can be configured later.
  },
}; 