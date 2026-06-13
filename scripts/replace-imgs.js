import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

let totalChanged = 0;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to find <img ... > that doesn't have loading attribute
  const newContent = content.replace(/<img\s+([^>]+)>/g, (match, attrs) => {
    if (!attrs.includes('loading=')) {
      changed = true;
      return `<img loading="lazy" ${attrs}>`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, newContent);
    totalChanged++;
    console.log(`Updated ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nFinished! Added loading="lazy" to ${totalChanged} files.`);
