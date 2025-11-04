module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    project: ['./tsconfig.base.json'],
  },
  ignorePatterns: ['node_modules', 'dist', 'build'],
  extends: ['@bulliun/eslint-config/base'],
};
