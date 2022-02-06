module.exports = {
  extends: ["standard-with-typescript", "plugin:react/recommended"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/restrict-plus-operands": "warn",
    "react/prop-types": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-implied-eval": "warn",
    eqeqeq: "warn",
    "react/display-name": "off",
  },
};
