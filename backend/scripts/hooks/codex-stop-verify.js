const fs = require('node:fs');
const path = require('node:path');
const { findRepoRoot, getBackendDir, readHookInput, run, writeJson } = require('./codex-hook-utils');

const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
const steps = [
  ['pnpm.cmd', ['run', 'lint']],
  ['pnpm.cmd', ['run', 'format:check']],
  ['pnpm.cmd', ['run', 'build']],
  ['pnpm.cmd', ['run', 'test']],
];

const input = readHookInput();

if (input.stop_hook_active) {
  writeJson({});
  process.exit(0);
}

const backendDir = getBackendDir(input.cwd);
const repoRoot = findRepoRoot(input.cwd);
const packageJsonPath = path.join(backendDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  writeJson({});
  process.exit(0);
}

const changedFiles = run('git', ['diff', '--name-only', 'HEAD'], { cwd: repoRoot });
const changedText = `${changedFiles.stdout || ''}\n${changedFiles.stderr || ''}`;
const hasBackendChanges = changedText
  .split(/\r?\n/)
  .some(
    filePath =>
      filePath === 'backend' || filePath.startsWith('backend/') || filePath === 'jamplay/backend' || filePath.startsWith('jamplay/backend/'),
  );

if (!hasBackendChanges) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: 'No backend changes detected; JamPlay backend verification was skipped.',
    },
  });
  process.exit(0);
}

const shellStep = run('sh', ['./scripts/verify.sh'], { cwd: backendDir });

if (shellStep.status === 0) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: 'JamPlay backend verification passed: sh ./scripts/verify.sh',
    },
  });
  process.exit(0);
}

if (process.platform !== 'win32') {
  process.stderr.write(shellStep.stdout || '');
  process.stderr.write(shellStep.stderr || '');
  writeJson({
    decision: 'block',
    reason: 'JamPlay backend verification failed: sh ./scripts/verify.sh',
  });
  process.exit(shellStep.status || 1);
}

const gitBashStep = run(gitBash, ['-lc', './scripts/verify.sh'], { cwd: backendDir });

if (gitBashStep.status === 0) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: 'JamPlay backend verification passed with Git Bash: sh ./scripts/verify.sh',
    },
  });
  process.exit(0);
}

for (const [command, args] of steps) {
  const result = run(command, args, { cwd: backendDir });

  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    writeJson({
      decision: 'block',
      reason: `JamPlay verification failed at: ${command} ${args.join(' ')}`,
    });
    process.exit(result.status || 1);
  }
}

writeJson({
  hookSpecificOutput: {
    hookEventName: 'Stop',
    additionalContext: 'JamPlay backend verification passed with Windows pnpm.cmd fallback.',
  },
});
