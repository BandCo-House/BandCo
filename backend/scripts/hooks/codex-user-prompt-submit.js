const { readHookInput, writeJson } = require('./codex-hook-utils');

const input = readHookInput();
const prompt = input.prompt || input.user_prompt || input.message || '';

if (typeof prompt === 'string' && /prisma:migrate:deploy|git\s+reset\s+--hard|git\s+clean\s+-f|push\s+--force/i.test(prompt)) {
  writeJson({
    systemMessage:
      'Harness reminder: production migration deploy, hard reset, git clean, and force push are blocked unless the user explicitly asks for that exact action.',
  });
  process.exit(0);
}

writeJson({});
