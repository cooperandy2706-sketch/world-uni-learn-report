const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const regex = /const\s+\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState(?:<boolean>)?\((?:true|false)\)/g;
  
  if (!regex.test(content)) {
    return;
  }
  if (content.includes('useStuckLoadingReload')) {
    return; // already has it
  }

  const importStatement = "import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'\n";
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
  }

  regex.lastIndex = 0;
  content = content.replace(regex, (match) => {
    return match + "\n  useStuckLoadingReload(loading)";
  });

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) processFile(p);
  });
}

walk(process.argv[2]);
