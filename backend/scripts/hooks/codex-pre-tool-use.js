const { collectStrings, readHookInput, writeJson } = require('./codex-hook-utils');

const input = readHookInput();
const text = collectStrings(input).join('\n');

const blockedPatterns = [
  /DROP\s+TABLE/i,
  /pnpm(?:\.cmd)?\s+run\s+prisma:migrate:deploy/i,
  /git\s+reset\s+--hard/i,
  /git\s+clean\s+-f/i,
  /git\s+push\s+--force/i,
];

if (blockedPatterns.some(pattern => pattern.test(text))) {
  process.stderr.write('BLOCKED: JamPlay harness rejected a dangerous command.\n');
  writeJson({
    decision: 'block',
    reason: 'JamPlay harness blocks production migration deploy, destructive git commands, force push, and DROP TABLE.',
  });
  process.exit(2);
}

writeJson({});
