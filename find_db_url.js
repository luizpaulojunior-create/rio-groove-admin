const fs = require('fs');
const path = require('path');

function searchForDbUrl(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchForDbUrl(fullPath);
      }
    } else {
      if (fullPath.endsWith('.env') || fullPath.endsWith('.cjs') || fullPath.endsWith('.js') || fullPath.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('postgresql://') || content.includes('postgres://')) {
            const lines = content.split('\n');
            for (const line of lines) {
              if (line.includes('postgresql://') || line.includes('postgres://')) {
                console.log(`Found in ${fullPath}: ${line.trim()}`);
              }
            }
          }
        } catch (e) {}
      }
    }
  }
}

searchForDbUrl(path.resolve(__dirname, '..'));
