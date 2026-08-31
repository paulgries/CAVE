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
      'clean-architecture-visualizer/frontend/**',
      'docs/**',
    ],
  },
  ...gts,
  {
    // Point gts's type-aware linting at the backend project that includes
    // src + tests (tsconfig.json itself excludes tests).
    files: ['clean-architecture-visualizer/**/*.ts', 'clean-architecture-visualizer/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './clean-architecture-visualizer/tsconfig.eslint.json',
      },
    },
  },
];
