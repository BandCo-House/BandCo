import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDirectory, '..');
const defaultTokensPath = resolve(frontendRoot, 'tokens/tokens.json');
const defaultOutputPath = resolve(
  frontendRoot,
  'src/styles/generated-tokens.css',
);

const getValue = (source, path) => {
  const token = path.reduce((target, key) => target?.[key], source);
  return token?.value;
};

const requireValue = (source, path) => {
  const value = getValue(source, path);

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing token value: ${path.join('.')}`);
  }

  return value;
};

const buildThemeVariables = ({
  colorSet,
  primarySet,
  secondaryPath,
  mode = 'light',
}) => {
  const greyScale999 = requireValue(colorSet, ['greyScale', '999']);
  const isDarkMode = mode === 'dark';

  return [
    ['--Round-full', '999px'],
    [
      '--background',
      isDarkMode ? 'var(--primary-main)' : 'var(--gradient-top)',
    ],
    [
      '--foreground',
      isDarkMode ? 'var(--greyScale-200)' : 'var(--greyScale-500)',
    ],
    [
      '--surface-card',
      isDarkMode ? 'var(--overlay-24)' : 'var(--greyScale-50)',
    ],
    [
      '--surface-popover',
      isDarkMode ? 'var(--primary-dark)' : 'var(--greyScale-50)',
    ],
    ['--gradient-top', requireValue(colorSet, ['surface', 'gradient-top'])],
    [
      '--gradient-bottom',
      requireValue(colorSet, ['surface', 'gradient-bottom']),
    ],
    ['--overlay-40', 'rgb(255 255 255 / 0.4)'],
    ['--overlay-24', 'rgb(255 255 255 / 0.24)'],
    ['--greyScale-50', requireValue(colorSet, ['greyScale', '50'])],
    ['--greyScale-100', requireValue(colorSet, ['greyScale', '100'])],
    ['--greyScale-200', requireValue(colorSet, ['greyScale', '200'])],
    ['--greyScale-300', requireValue(colorSet, ['greyScale', '300'])],
    ['--greyScale-400', requireValue(colorSet, ['greyScale', '400'])],
    ['--greyScale-500', requireValue(colorSet, ['greyScale', '500'])],
    ['--greyScale-600', greyScale999],
    ['--greyScale-999', greyScale999],
    ['--primary-surface', requireValue(primarySet, ['surface'])],
    ['--primary-light', requireValue(primarySet, ['light'])],
    ['--primary-main', requireValue(primarySet, ['main'])],
    ['--primary-dark', 'var(--greyScale-999)'],
    [
      '--secondary-surface',
      getValue(colorSet, ['main', 'main']) ?? 'var(--primary-surface)',
    ],
    ['--secondary', requireValue(colorSet, secondaryPath)],
    [
      '--main-surface',
      getValue(colorSet, ['main', 'surface']) ??
        requireValue(primarySet, ['surface']),
    ],
    [
      '--main-light',
      getValue(colorSet, ['main', 'light']) ??
        requireValue(primarySet, ['light']),
    ],
    [
      '--main-main',
      getValue(colorSet, ['main', 'main']) ??
        requireValue(primarySet, ['main']),
    ],
    ['--key', isDarkMode ? 'var(--secondary)' : 'var(--primary-main)'],
    [
      '--key-foreground',
      isDarkMode ? 'var(--primary-dark)' : 'var(--greyScale-50)',
    ],
    [
      '--key-surface',
      isDarkMode ? 'var(--secondary-surface)' : 'var(--primary-surface)',
    ],
    ['--key-muted', isDarkMode ? 'var(--secondary)' : 'var(--primary-light)'],
    [
      '--success-surface',
      requireValue(colorSet, ['semantic', 'success', 'surface']),
    ],
    [
      '--semantic-success-surface',
      requireValue(colorSet, ['semantic', 'success', 'surface']),
    ],
    ['--success', requireValue(colorSet, ['semantic', 'success', 'main'])],
    [
      '--destructive-surface',
      requireValue(colorSet, ['semantic', 'destructive', 'surface']),
    ],
    [
      '--destructive',
      requireValue(colorSet, ['semantic', 'destructive', 'main']),
    ],
  ];
};

const formatVariables = (selector, variables) => {
  const declarations = variables
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `${selector} {\n${declarations}\n}`;
};

/**
 * Token Studio JSON을 앱에서 사용하는 CSS 변수 파일로 변환한다.
 *
 * @param {Record<string, unknown>} tokens Token Studio에서 export한 토큰 객체
 * @returns {string} 생성된 CSS 변수 선언
 */
export const buildGeneratedTokenCss = (tokens) => {
  const lightColorSet = tokens['ColorSystem/Light'];
  const darkColorSet = tokens['ColorSystem Dark/Dark'];

  if (!lightColorSet) {
    throw new Error('Missing token set: ColorSystem/Light');
  }

  const lightVariables = buildThemeVariables({
    colorSet: lightColorSet,
    primarySet: lightColorSet.primary,
    secondaryPath: ['secondary', 'main'],
    mode: 'light',
  });

  const darkVariables = darkColorSet
    ? buildThemeVariables({
        colorSet: darkColorSet,
        primarySet: darkColorSet.primary ?? lightColorSet.primary,
        secondaryPath: ['secondary', 'main'],
        mode: 'dark',
      })
    : lightVariables;

  return [
    '/* This file is generated from tokens/tokens.json. Do not edit manually. */',
    formatVariables(':root', lightVariables),
    '',
    formatVariables('.dark', darkVariables),
    '',
  ].join('\n');
};

/**
 * Token Studio JSON 파일을 읽어 앱 CSS 변수 파일을 생성한다.
 *
 * @param {{ tokensPath?: string; outputPath?: string }} options 파일 경로 옵션
 */
export const generateCssTokens = ({
  tokensPath = defaultTokensPath,
  outputPath = defaultOutputPath,
} = {}) => {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const css = buildGeneratedTokenCss(tokens);

  writeFileSync(outputPath, css, 'utf8');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateCssTokens();
}
