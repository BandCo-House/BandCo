const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { findRepoRoot, getBackendDir, readHookInput, run, writeJson } = require('./codex-hook-utils');

const isWin = process.platform === 'win32';
const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';

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

// Windows: Git Bash 절대 경로 사용. Mac/Linux: sh 사용.
const shellCmd = isWin && fs.existsSync(gitBash) ? gitBash : 'sh';
const shellArgs = isWin && fs.existsSync(gitBash) ? ['./scripts/verify.sh'] : ['./scripts/verify.sh'];

const shellStep = spawnSync(shellCmd, shellArgs, {
  cwd: backendDir,
  encoding: 'utf8',
  shell: false,
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (shellStep.status === 0) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: 'JamPlay backend verification passed.',
    },
  });
  process.exit(0);
}

process.stderr.write(shellStep.stdout || '');
process.stderr.write(shellStep.stderr || '');
writeJson({
  decision: 'block',
  reason: 'JamPlay backend verify.sh failed. 위 출력을 확인하세요.',
});
process.exit(shellStep.status || 1);
