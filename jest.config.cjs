module.exports = {
  testEnvironment: "node", // Use Node.js environment for backend tests
  testMatch: ["**/citests/**/*.test.js"], // Only look for test files in the citests folder
  transform: {
    "^.+\\.jsx?$": "babel-jest", // Transform JavaScript files using Babel
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy", // Mock CSS imports
  },
};