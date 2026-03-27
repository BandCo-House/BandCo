import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierPlugin from 'eslint-plugin-prettier';
import { builtinModules } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default [
  // ------------------------------------------------------------
  // 0) 제외 경로
  // ------------------------------------------------------------
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'logs/**',
      'src/generated/**',
      '**/*.config.*',
      '**/eslint.config.*',
      // Nest 기본 test 폴더를 린트에서 제외하고 싶으면 활성화
      // "test/**",
    ],
  },

  // ------------------------------------------------------------
  // 1) 기본 추천 룰 (JS)
  // ------------------------------------------------------------
  js.configs.recommended,

  // ------------------------------------------------------------
  // 2) TypeScript 추천 룰
  // ------------------------------------------------------------
  ...tseslint.configs.recommended,

  // ------------------------------------------------------------
  // 3) TS/Node 공통 설정
  // ------------------------------------------------------------
  {
    plugins: {
      prettier: prettierPlugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tseslint.plugin,
    },

    languageOptions: {
      // 백엔드: Node globals
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',

      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: currentDirectory,
      },
    },

    settings: {
      'import/resolver': {
        typescript: true,
      },
    },

    rules: {
      // --------------------------------------------------------
      // Prettier
      // --------------------------------------------------------
      'prettier/prettier': 'error',

      // --------------------------------------------------------
      // Import 정렬
      // - node:fs 같은 built-in + node: prefix까지 처리
      // --------------------------------------------------------
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1) Node builtins (node: 포함)
            [`^(node:)?(${builtinModules.join('|')})(/.*|$)`],

            // 2) 외부 패키지
            ['^@?\\w'],

            // 3) 내부 alias (있으면 여기에 추가)
            // 예: ["^@/"]
            ['^@/'],

            // 4) Side-effect
            ['^\\u0000'],

            // 5) 상위 경로
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

            // 6) 같은 레벨/하위 경로
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // 7) 스타일(거의 없겠지만)
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // --------------------------------------------------------
      // TypeScript
      // --------------------------------------------------------
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // --------------------------------------------------------
      // Nest/Node 현실적인 운영 규칙
      // --------------------------------------------------------
      // 백엔드는 운영 로그가 필요해서 console 완전 금지하지 않음.
      'no-console': 'off',

      // 스타일
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',

      // import 품질
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
    },
  },
];
