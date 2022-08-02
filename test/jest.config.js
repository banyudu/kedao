/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // transformIgnorePatterns: ['<rootDir>/node_modules/'],
  transformIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/../"],
};
