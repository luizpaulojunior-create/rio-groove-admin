const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath);
    } else if (filepath.endsWith('.jsx') || filepath.endsWith('.js') || filepath.endsWith('.html')) {
      let content = fs.readFileSync(filepath, 'binary'); // Read as binary to see raw bytes
      // We will look for 0xC3 0x83 which is Ã
      if (content.includes('Ã')) {
        console.log('Found literal Ã in', filepath);
      }
    }
  });
}
walk('./src');