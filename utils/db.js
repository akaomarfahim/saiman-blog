const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

/**
 * Read a JSON "table" (e.g. 'users', 'posts', 'comments') from disk.
 * Returns an array. If the file is missing or corrupt, returns [].
 */
function readTable(name) {
  try {
    const raw = fs.readFileSync(filePath(name), 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

/**
 * Write an array back to a JSON "table" on disk.
 * Uses a write-to-temp-then-rename approach to avoid corrupting the file
 * if the process is interrupted mid-write.
 */
function writeTable(name, data) {
  const target = filePath(name);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, target);
}

module.exports = { readTable, writeTable, DATA_DIR };
