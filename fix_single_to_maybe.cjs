/**
 * fix_single_to_maybe.cjs
 * Converts .single() → .maybeSingle() on pure SELECT Supabase chains.
 * INSERT/UPDATE/UPSERT chains keep .single() since they're guaranteed to return 1 row.
 */
const fs = require('fs');
const path = require('path');

let totalFixed = 0;

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let changed = false;

  const result = lines.map((line, idx) => {
    // Only process lines that end with .single() (possibly with whitespace)
    if (!line.includes('.single()')) return line;

    // Look backwards up to 20 lines to find the chain start
    const startIdx = Math.max(0, idx - 20);
    const chunk = lines.slice(startIdx, idx + 1).join('\n');

    // If this chain has insert/update/upsert before .single(), it's SAFE — leave it
    const isMutation = /\.(insert|update|upsert)\s*\(/.test(chunk.split('.select()').slice(-1)[0])
      || /\.(insert|update|upsert)\s*\(/.test(chunk);

    if (isMutation) {
      // Still check: if it's insert/update/upsert THEN select THEN single,
      // the mutation is before select, so we can leave it
      return line;
    }

    // It's a pure SELECT chain — convert .single() to .maybeSingle()
    const newLine = line.replace(/\.single\(\)/g, '.maybeSingle()');
    if (newLine !== line) {
      changed = true;
      totalFixed++;
    }
    return newLine;
  });

  if (changed) {
    fs.writeFileSync(filePath, result.join('\n'));
    console.log(`Fixed: ${filePath}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory() && !p.includes('node_modules')) walk(p);
    else if (p.endsWith('.ts') || p.endsWith('.tsx')) processFile(p);
  }
}

walk('./src');
console.log(`\nDone. Fixed ${totalFixed} .single() → .maybeSingle() conversions.`);
