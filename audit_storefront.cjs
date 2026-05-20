const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'rio-groove-cloudflare-final-corrigido', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log('--- HTML SIZE ---');
console.log(`Total chars: ${htmlContent.length}`);

console.log('\n--- SCRIPTS ---');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  scriptCount++;
  const scriptTag = match[0];
  const scriptContent = match[1];
  console.log(`Script ${scriptCount}: ${scriptContent.length} chars (Inline: ${scriptContent.trim().length > 0})`);
  if (scriptContent.length > 1000) {
    console.log(`Preview: ${scriptContent.substring(0, 200)}...`);
    
    // Look for any large arrays or product-like objects
    const arrayRegex = /const\s+(\w+)\s*=\s*\[/g;
    let arrMatch;
    while ((arrMatch = arrayRegex.exec(scriptContent)) !== null) {
      console.log(`Array declaration found: ${arrMatch[1]}`);
    }
    
    const hardcodedProductsRegex = /id:\s*['"](prod_[^'"]+)['"]/g;
    let pMatch;
    let pCount = 0;
    while ((pMatch = hardcodedProductsRegex.exec(scriptContent)) !== null) {
      pCount++;
    }
    console.log(`Found ${pCount} hardcoded product IDs in script.`);
  }
}

console.log('\n--- FETCH CALLS ---');
const fetchRegex = /fetch\s*\(\s*['"]([^'"]+)['"]/g;
while ((match = fetchRegex.exec(htmlContent)) !== null) {
  console.log(`API Call: ${match[1]}`);
}

console.log('\n--- IMAGES (local vs absolute) ---');
const imgRegex = /<img\b[^>]*src\s*=\s*['"]([^'"]+)['"]/gi;
let localImgs = 0;
let remoteImgs = 0;
while ((match = imgRegex.exec(htmlContent)) !== null) {
  const src = match[1];
  if (src.startsWith('http')) remoteImgs++;
  else localImgs++;
}
console.log(`Local images: ${localImgs}`);
console.log(`Remote images: ${remoteImgs}`);

console.log('\n--- HTML STRUCTURE ---');
const sectionsRegex = /<section\b[^>]*id\s*=\s*['"]([^'"]+)['"]/gi;
while ((match = sectionsRegex.exec(htmlContent)) !== null) {
  console.log(`Section: #${match[1]}`);
}
