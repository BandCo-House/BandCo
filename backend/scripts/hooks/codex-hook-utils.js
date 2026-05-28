const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

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

function run(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

module.exports = {
  collectStrings,
  readHookInput,
  run,
  writeJson,
};
