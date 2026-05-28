/**
 * PreToolUse 훅: 구현 파일 수정 전 _workspace/design.md 존재 확인
 * - 대상: src/modules/ 하위 service, controller, prisma-repository (.spec.ts 제외)
 * - 설계 문서가 없으면 차단 (exit 2)
 */
const fs = require('fs');

let input = {};
try {
  input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
} catch {
  process.exit(0);
}

const filePath = input.file_path || '';

const isImplFile =
  /src[/\\]modules[/\\].+\.(service|controller|prisma-repository)\.ts$/.test(filePath) &&
  !filePath.endsWith('.spec.ts');

if (!isImplFile) process.exit(0);

if (!fs.existsSync('_workspace/design.md')) {
  process.stderr.write(
    '⛔ [설계 가드] _workspace/design.md 가 없습니다.\n' +
    '구현 전 be-design 스킬로 설계를 먼저 완료하세요.\n'
  );
  process.exit(2);
}
