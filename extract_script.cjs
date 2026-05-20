const fs = require('fs');

const html = fs.readFileSync('store_prod_index.html', 'utf-8');
const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
while ((match = inlineScriptRegex.exec(html)) !== null) {
  if (match[1].length > 1000) {
      fs.writeFileSync('prod_script.js', match[1]);
      console.log('Script saved to prod_script.js');
  }
}
