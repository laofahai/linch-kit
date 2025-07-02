module.exports = {
  extends: ['../../eslint.config.js'],
  ignorePatterns: ['**/__tests__/**/*'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};