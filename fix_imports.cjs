const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('useStuckLoadingReload(loading)')) {
    // calculate correct relative path to src/hooks/useStuckLoadingReload
    // filePath is like src/pages/admin/DashboardPage.tsx
    // we want to get to src/hooks/useStuckLoadingReload
    const srcDir = path.resolve('./src');
    const fileDir = path.dirname(path.resolve(filePath));
    const hooksDir = path.join(srcDir, 'hooks');
    let relPath = path.relative(fileDir, hooksDir).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    
    const correctImport = `import { useStuckLoadingReload } from '${relPath}/useStuckLoadingReload'`;
    
    // Remove all existing imports of useStuckLoadingReload (however they were written)
    content = content.replace(/import\s*\{\s*useStuckLoadingReload\s*\}\s*from\s*['"][^'"]+['"]\n?/g, '');
    
    // Inject at top
    content = correctImport + '\n' + content;
    fs.writeFileSync(filePath, content);
    console.log('Fixed import in', filePath);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) processFile(p);
  });
}

walk('./src/pages');
