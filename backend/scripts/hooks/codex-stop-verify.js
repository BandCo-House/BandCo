const { run, writeJson } = require('./codex-hook-utils');

const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
const steps = [
  ['pnpm.cmd', ['run', 'lint']],
  ['pnpm.cmd', ['run', 'format:check']],
  ['pnpm.cmd', ['run', 'build']],
  ['pnpm.cmd', ['run', 'test']],
];

const shellStep = run(gitBash, ['-lc', './scripts/verify.sh']);

if (shellStep.status === 0) {
  writeJson({
    systemMessage: 'JamPlay verification passed with Git Bash: sh ./scripts/verify.sh',
  });
  process.exit(0);
}

for (const [command, args] of steps) {
  const result = run(command, args);

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
  systemMessage: 'JamPlay verification passed with Windows pnpm.cmd fallback.',
});
