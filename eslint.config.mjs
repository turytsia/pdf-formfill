import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist', 'node_modules', 'coverage'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTaggedTemplates: true },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'react/jsx-curly-brace-presence': [
        'warn',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/prop-types': 'off',
      'react/no-danger': 'error',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-nested-ternary': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='React'][property.name='createElement']",
          message: 'Use JSX instead of React.createElement.',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
    },
  },
]);
