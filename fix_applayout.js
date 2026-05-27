const fs = require('fs');

const path = './src/components/layout/AppLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('refreshKey')) {
  // Add useRef to imports
  content = content.replace("import { useState, useEffect }", "import { useState, useEffect, useRef }");

  // Inside AppLayout function:
  const target = 'const { user, loading, initialized } = useAuth()';
  
  const injection = `
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const lastHiddenTime = useRef(Date.now())

  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenTime.current = Date.now()
      } else {
        const awayTime = Date.now() - lastHiddenTime.current
        // If away for more than 2 minutes, force remount the active page
        if (awayTime > 2 * 60 * 1000) {
          setRefreshKey(Date.now())
        }
      }
    }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [])
`;

  content = content.replace(target, target + '\n' + injection);
  
  // Replace <Outlet /> with <Outlet key={refreshKey} />
  content = content.replace('<Outlet />', '<Outlet key={refreshKey} />');
  
  fs.writeFileSync(path, content);
  console.log('AppLayout.tsx patched successfully');
} else {
  console.log('AppLayout.tsx already patched');
}
