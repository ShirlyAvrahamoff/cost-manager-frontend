// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup_tests.js'], 
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/style_mock.js',
    '\\.(gif|ttf|eot|svg|png|jpe?g)$': '<rootDir>/__mocks__/file_mock.js',
    '^@mui/icons-material/(.*)$': '<rootDir>/__mocks__/mui_icon_mock.js',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.[jt]s?(x)'],
};
