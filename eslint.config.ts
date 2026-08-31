import gts from 'gts';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '*.min.js',
      '**/.docusaurus/**',
      'eslint.config.ts',
      'apps/web/**',
      'apps/docs/**',
    ],
  },
  ...gts,
  {
    // Point gts's type-aware linting at the backend project that includes
    // src + tests (tsconfig.json itself is build-only and excludes tests).
    files: ['apps/backend/**/*.ts', 'apps/backend/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './apps/backend/tsconfig.test.json',
      },
    },
  },
];
