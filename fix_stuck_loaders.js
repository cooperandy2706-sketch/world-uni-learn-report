const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('const [loading, setLoading] = useState(true)') && !content.includes('const [loading, setLoading] = useState<boolean>(true)')) {
    return;
  }
  if (content.includes('useStuckLoadingReload')) {
    return; // already has it
  }

  // 1. Add import
  const importStatement = "import { useStuckLoadingReload } from '../../hooks/useStuckLoadingReload'\n";
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
  }

  // 2. Add hook call after useState
  const regex = /const \[loading,\s*setLoading\]\s*=\s*useState(?:<boolean>)?\((?:true|false)\)/g;
  content = content.replace(regex, (match) => {
    return match + "\n  useStuckLoadingReload(loading)";
  });

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) processFile(p);
  });
}

walk('./src/pages/admin');
