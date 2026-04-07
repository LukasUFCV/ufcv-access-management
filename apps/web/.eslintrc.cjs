module.exports = {
  root: true,
  extends: ['../../packages/config/eslint/react.cjs'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};

