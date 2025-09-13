// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(gif|ttf|eot|svg|png|jpe?g)$": "<rootDir>/__mocks__/fileMock.js",
    "^@mui/icons-material/(.*)$": "<rootDir>/__mocks__/muiIconMock.js"
  },
  testMatch: ["<rootDir>/src/**/__tests__/**/*.[jt]s?(x)"],
};
