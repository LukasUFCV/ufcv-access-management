module.exports = {
  extends: ['./base.cjs', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};

