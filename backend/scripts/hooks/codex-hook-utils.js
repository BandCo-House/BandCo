const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function readHookInput() {
  const input = fs.readFileSync(0, 'utf8').trim();

  if (!input) {
    return {};
  }

  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

function collectStrings(value, result = []) {
  if (typeof value === 'string') {
    result.push(value);
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, result);
    }
    return result;
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      collectStrings(item, result);
    }
  }

  return result;
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function findRepoRoot(cwd = process.cwd()) {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }

  return cwd;
}

function getBackendDir(cwd = process.cwd()) {
  const repoRoot = findRepoRoot(cwd);
  const gitRootBackendDir = path.join(repoRoot, 'backend');

  if (fs.existsSync(path.join(gitRootBackendDir, 'package.json'))) {
    return gitRootBackendDir;
  }

  return path.join(repoRoot, 'jamplay', 'backend');
}

function isBackendPath(value) {
  return /(^|[\\/])jamplay[\\/]backend[\\/]/.test(value) || /(^|[\\/])backend[\\/]/.test(value);
}

module.exports = {
  collectStrings,
  findRepoRoot,
  getBackendDir,
  isBackendPath,
  readHookInput,
  run,
  writeJson,
};
