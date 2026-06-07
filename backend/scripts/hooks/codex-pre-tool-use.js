const fs = require('node:fs');
const path = require('node:path');
const { collectStrings, getBackendDir, readHookInput, writeJson } = require('./codex-hook-utils');

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

const isBackendImplementationEdit =
  input.tool_name === 'apply_patch' &&
  /(?:jamplay[\\/]backend|backend)[\\/]src[\\/]modules[\\/].+\.(service|controller|prisma-repository)\.ts/i.test(text) &&
  !/\.spec\.ts/i.test(text);

if (isBackendImplementationEdit) {
  const designPath = path.join(getBackendDir(input.cwd), '_workspace', 'design.md');

  if (!fs.existsSync(designPath)) {
    const reason =
      'Backend implementation edits require jamplay/backend/_workspace/design.md first. Create or update the design document, then retry the implementation edit.';

    process.stderr.write(`${reason}\n`);
    writeJson({
      decision: 'block',
      reason,
    });
    process.exit(2);
  }
}

writeJson({});
