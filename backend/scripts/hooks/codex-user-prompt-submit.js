const { readHookInput, writeJson } = require('./codex-hook-utils');

const input = readHookInput();
const prompt = input.prompt || input.user_prompt || input.message || '';
const contexts = [];

if (typeof prompt === 'string' && /prisma:migrate:deploy|git\s+reset\s+--hard|git\s+clean\s+-f|push\s+--force/i.test(prompt)) {
  contexts.push(
    'JamPlay safety policy: production migration deploy, hard reset, git clean, and force push are blocked unless the user explicitly asks for that exact operation and the current task requires it.',
  );
}

if (typeof prompt === 'string' && /(backend|백엔드|api|controller|service|repository|dto|prisma|module|모듈|구현|수정|추가|검증|qa)/i.test(prompt)) {
  contexts.push(
    [
      'Backend docs policy: before backend implementation, use jamplay/backend/AGENTS.md as the local source of truth.',
      'Read only the smallest relevant docs: docs/backend/api-docs for endpoint contracts, docs/backend/conventions.md for architecture rules, docs/backend/testing.md for tests, and prisma/schema.prisma for DB shape.',
      'Claude subagent/skill prompts are reference material only in Codex. Recreate the same flow manually: API docs check -> design in _workspace/design.md when the task is non-trivial -> implementation -> QA/verify.',
      'For Notion API sync, use the installed Notion connector if available; Claude-specific mcp__claude_ai_Notion tool names do not port directly to Codex.',
    ].join(' '),
  );
}

if (contexts.length > 0) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: contexts.join('\n'),
    },
  });
  process.exit(0);
}

writeJson({});
