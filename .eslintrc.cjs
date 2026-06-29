module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  ignorePatterns: ["**/.next/**", "coverage/**", "playwright-report/**", "test-results/**"],
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }],
    "@next/next/no-img-element": "off",
  },
};
