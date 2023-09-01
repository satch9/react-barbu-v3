module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Ajoutez cette règle pour éviter les appels récursifs excessifs
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="handleContractChoice"]',
        message: 'Évitez les appels récursifs excessifs de handleContractChoice.',
      },
    ],
  },
}
