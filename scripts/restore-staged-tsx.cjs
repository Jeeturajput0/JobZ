const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.tsx')) {
      const relative = path.relative(process.cwd(), file).replace(/\\/g, '/');
      try { fs.writeFileSync(file, execFileSync('git', ['show', `:${relative}`])); }
      catch { /* Untracked source files are left as-is. */ }
    }
  }
}

walk(path.join(process.cwd(), 'app'));
walk(path.join(process.cwd(), 'components'));
