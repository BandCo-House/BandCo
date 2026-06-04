// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildGeneratedTokenCss,
  DEFAULT_ROUND_FULL,
} from '../generate-css-tokens.mjs';

describe('buildGeneratedTokenCss', () => {
  it('ColorSystem/Light 토큰이 주어지면 루트 CSS 변수는 토큰 값을 반영해야 한다', () => {
    const css = buildGeneratedTokenCss({
      'ColorSystem/Light': {
        primary: {
          main: { value: '#111111' },
          light: { value: '#222222' },
          surface: { value: '#333333' },
        },
        secondary: {
          main: { value: '#444444' },
        },
        semantic: {
          success: {
            surface: { value: '#555555' },
            main: { value: '#666666' },
          },
          destructive: {
            surface: { value: '#777777' },
            main: { value: '#888888' },
          },
        },
        surface: {
          1: { value: '#010101' },
          2: { value: '#020202' },
          3: { value: '#030303' },
          'gradient-top': { value: '#999999' },
          'gradient-bottom': { value: '#aaaaaa' },
        },
        greyScale: {
          50: { value: '#bbbbbb' },
          100: { value: '#cccccc' },
          200: { value: '#dddddd' },
          300: { value: '#eeeeee' },
          400: { value: '#121212' },
          500: { value: '#232323' },
          999: { value: '#343434' },
        },
      },
    });

    expect(css).toContain('--primary-light: #222222;');
    expect(css).toContain('--secondary: #444444;');
    expect(css).toContain('--success: #666666;');
    expect(css).toContain('--semantic-success-surface: #555555;');
    expect(css).toContain('--surface-1: #010101;');
    expect(css).toContain('--surface-2: #020202;');
    expect(css).toContain('--surface-3: #030303;');
    expect(css).toContain('--greyScale-600: #343434;');
    expect(css).toContain(`--Round-full: ${DEFAULT_ROUND_FULL};`);
  });

  it('ColorSystem Dark/Dark 토큰이 주어지면 다크 CSS 변수는 다크 토큰 값을 반영해야 한다', () => {
    const css = buildGeneratedTokenCss({
      'ColorSystem/Light': {
        primary: {
          main: { value: '#111111' },
          light: { value: '#222222' },
          surface: { value: '#333333' },
        },
        secondary: { main: { value: '#444444' } },
        semantic: {
          success: {
            surface: { value: '#555555' },
            main: { value: '#666666' },
          },
          destructive: {
            surface: { value: '#777777' },
            main: { value: '#888888' },
          },
        },
        surface: {
          1: { value: '#010101' },
          2: { value: '#020202' },
          3: { value: '#030303' },
          'gradient-top': { value: '#999999' },
          'gradient-bottom': { value: '#aaaaaa' },
        },
        greyScale: {
          50: { value: '#bbbbbb' },
          100: { value: '#cccccc' },
          200: { value: '#dddddd' },
          300: { value: '#eeeeee' },
          400: { value: '#121212' },
          500: { value: '#232323' },
          999: { value: '#343434' },
        },
      },
      'ColorSystem Dark/Dark': {
        main: {
          main: { value: '#ababab' },
          light: { value: '#bcbcbc' },
          surface: { value: '#cdcdcd' },
        },
        secondary: { main: { value: '#dedede' } },
        semantic: {
          success: {
            surface: { value: '#efefef' },
            main: { value: '#101010' },
          },
          destructive: {
            surface: { value: '#202020' },
            main: { value: '#303030' },
          },
        },
        surface: {
          1: { value: '#414141' },
          2: { value: '#424242' },
          3: { value: '#434343' },
          'gradient-top': { value: '#404040' },
          'gradient-bottom': { value: '#505050' },
        },
        greyScale: {
          50: { value: '#606060' },
          100: { value: '#707070' },
          200: { value: '#808080' },
          300: { value: '#909090' },
          400: { value: '#a0a0a0' },
          500: { value: '#b0b0b0' },
          999: { value: '#c0c0c0' },
        },
      },
    });

    expect(css).toContain('.dark {');
    expect(css).toContain('--primary-light: #bcbcbc;');
    expect(css).not.toContain('--main-light:');
    expect(css).toContain('--secondary: #dedede;');
    expect(css).toContain('--surface-1: #414141;');
    expect(css).toContain('--surface-2: #424242;');
    expect(css).toContain('--surface-3: #434343;');
    expect(css).toContain('--gradient-top: #404040;');
  });

  it('ColorSystem/Light 토큰 세트가 없으면 명시적인 오류를 던져야 한다', () => {
    expect(() => buildGeneratedTokenCss({})).toThrow(
      'Missing token set: ColorSystem/Light',
    );
  });

  it('필수 토큰 value가 없으면 누락된 토큰 경로를 포함한 오류를 던져야 한다', () => {
    expect(() =>
      buildGeneratedTokenCss({
        'ColorSystem/Light': {
          primary: {
            main: { value: '#111111' },
            light: {},
            surface: { value: '#333333' },
          },
          secondary: {
            main: { value: '#444444' },
          },
          semantic: {
            success: {
              surface: { value: '#555555' },
              main: { value: '#666666' },
            },
            destructive: {
              surface: { value: '#777777' },
              main: { value: '#888888' },
            },
          },
          surface: {
            1: { value: '#010101' },
            2: { value: '#020202' },
            3: { value: '#030303' },
            'gradient-top': { value: '#999999' },
            'gradient-bottom': { value: '#aaaaaa' },
          },
          greyScale: {
            50: { value: '#bbbbbb' },
            100: { value: '#cccccc' },
            200: { value: '#dddddd' },
            300: { value: '#eeeeee' },
            400: { value: '#121212' },
            500: { value: '#232323' },
            999: { value: '#343434' },
          },
        },
      }),
    ).toThrow(/^Missing token value:/);
  });
});
