const fs = require('node:fs');
const path = require('node:path');

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.tsx')) repair(file);
  }
}

function repair(file) {
  let source = fs.readFileSync(file, 'utf8');
  let cursor = 0;
  let output = '';
  while (true) {
    const start = source.indexOf('className="', cursor);
    if (start < 0) { output += source.slice(cursor); break; }
    output += source.slice(cursor, start);
    const valueStart = start + 'className="'.length;
    let end = valueStart;
    while (end < source.length) {
      if (source[end] === '"' && source[end - 1] !== '\\') break;
      end += 1;
    }
    if (end >= source.length) { output += source.slice(start); break; }
    const value = source.slice(valueStart, end).replace(/\\"/g, '"');
    output += `className={${JSON.stringify(value)}}`;
    cursor = end + 1;
  }
  fs.writeFileSync(file, output);
}

walk(path.join(process.cwd(), 'app'));
walk(path.join(process.cwd(), 'components'));
