const { collectStrings, readHookInput, writeJson } = require('./codex-hook-utils');

const input = readHookInput();
const text = collectStrings(input).join('\n');

if (/src[\\/].+\.service\.ts/i.test(text) && !/\.spec\.ts/i.test(text)) {
  writeJson({
    systemMessage: 'Harness reminder: when a Service method changes, update the matching .spec.ts with the required cases.',
  });
  process.exit(0);
}

if (/src[\\/]modules[\\/][^\\/]+[\\/].+\.controller\.ts/i.test(text)) {
  writeJson({
    systemMessage: 'Harness reminder: controller responses must use ApiSuccessResponse<T>, and matching API docs may need updates.',
  });
  process.exit(0);
}

writeJson({});
