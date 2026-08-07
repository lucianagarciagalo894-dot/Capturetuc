const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'data');

async function ensureFile(fileName) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, fileName);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf-8');
  }
  return filePath;
}

async function readCollection(fileName) {
  const filePath = await ensureFile(fileName);
  const content = await fs.readFile(filePath, 'utf-8');
  return content.trim() ? JSON.parse(content) : [];
}

async function writeCollection(fileName, data) {
  const filePath = await ensureFile(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readCollection, writeCollection };
