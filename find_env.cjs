const fs = require('fs');
const path = require('path');

function findEnv(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git')) {
      findEnv(full);
    } else if (file.includes('.env')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('DATABASE_URL')) {
        console.log('FOUND IN:', full);
        console.log(content.split('\n').find(l => l.includes('DATABASE_URL')));
      }
    }
  }
}

findEnv('..');