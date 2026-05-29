const { collectStrings, readHookInput, writeJson } = require('./codex-hook-utils');

const input = readHookInput();
const text = collectStrings(input).join('\n');
const contexts = [];

if (/(?:jamplay[\\/]backend|backend)[\\/]src[\\/]modules[\\/].+\.service\.ts/i.test(text) && !/\.spec\.ts/i.test(text)) {
  contexts.push(
    'Service edit detected: update the matching .spec.ts when behavior changed. Required coverage is happy path, meaningful exceptions, transaction consistency, and external tx forwarding when applicable.',
  );
}

if (/(?:jamplay[\\/]backend|backend)[\\/]src[\\/]modules[\\/][^\\/]+[\\/].+\.controller\.ts/i.test(text)) {
  contexts.push(
    'Controller edit detected: keep business logic in Service, wrap responses with ApiSuccessResponse<T>, and check docs/backend/api-docs for endpoint contract updates.',
  );
}

if (/(?:jamplay[\\/]backend|backend)[\\/]prisma[\\/]schema\.prisma/i.test(text)) {
  contexts.push('Prisma schema edit detected: run prisma:validate, prisma:format, prisma:generate, and decide whether prisma:migrate:dev is needed.');
}

if (contexts.length > 0) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: contexts.join('\n'),
    },
  });
  process.exit(0);
}

writeJson({});
