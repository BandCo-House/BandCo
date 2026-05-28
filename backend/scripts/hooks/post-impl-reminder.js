/**
 * PostToolUse 훅: 구현 파일 변경 후 테스트·API 문서 동기화 안내
 * - Service 변경 → 해당 .spec.ts 업데이트 요청
 * - Controller 변경 → 해당 api-docs/{module}.md 업데이트 요청
 */
let input = {};
try {
  input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
} catch {
  process.exit(0);
}

const filePath = input.file_path || '';

// Service 변경 → 테스트 동기화
if (/src[/\\]modules[/\\].+\.service\.ts$/.test(filePath) && !filePath.endsWith('.spec.ts')) {
  const specPath = filePath.replace('.service.ts', '.service.spec.ts');
  process.stdout.write(
    `[테스트 동기화] ${specPath} 가 방금 변경한 Service 메서드를 반영하는지 확인하고 필요하면 업데이트하세요.\n`
  );
}

// Controller 변경 → API 문서 동기화
const ctrlMatch = filePath.match(/src[/\\]modules[/\\]([^/\\]+)[/\\].+\.controller\.ts$/);
if (ctrlMatch) {
  const moduleName = ctrlMatch[1];
  process.stdout.write(
    `[API 문서 동기화] docs/backend/api-docs/${moduleName}.md 가 방금 변경한 Controller를 반영하는지 확인하고 필요하면 업데이트하세요.\n`
  );
}
