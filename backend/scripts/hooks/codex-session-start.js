const { writeJson } = require('./codex-hook-utils');

writeJson({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext:
      'JamPlay Codex harness is active. Use AGENTS.md as the source of truth. For backend work, read jamplay/backend/AGENTS.md, then the smallest relevant docs under jamplay/backend/docs/backend before editing. Use pnpm only. Do not complete backend code changes until verification passes.',
  },
});
