// PWA 앱 아이콘 생성 스크립트 — src/assets/logo/logo.svg 를 다크 배경 위에 렌더링해 PNG 로 굽는다.
// 실행: pnpm run icons:generate (frontend/ 에서 — Chromium 바이너리 설치까지 포함)
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoSvg = await readFile(join(root, 'src/assets/logo/logo.svg'), 'utf8');

// primary.main(Light) = #171736 — tokens/tokens.json
const BACKGROUND = '#171736';

// maskable 은 중앙 80% 안전 영역만 보장되므로 로고를 더 작게 넣는다
const targets = [
  { file: 'icon-192.png', size: 192, logoWidthRatio: 0.78 },
  { file: 'icon-512.png', size: 512, logoWidthRatio: 0.78 },
  { file: 'icon-512-maskable.png', size: 512, logoWidthRatio: 0.58 },
  { file: 'apple-touch-icon.png', size: 180, logoWidthRatio: 0.72 },
];

const outDir = join(root, 'public');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { file, size, logoWidthRatio } of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html>
    <html><body style="margin:0">
      <div style="width:${size}px;height:${size}px;background:${BACKGROUND};display:flex;align-items:center;justify-content:center">
        <div style="width:${Math.round(size * logoWidthRatio)}px">${logoSvg.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')}</div>
      </div>
    </body></html>`);
  await page.screenshot({ path: join(outDir, file) });
  console.log(`generated public/${file} (${size}x${size})`);
}

await browser.close();
