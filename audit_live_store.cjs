const fs = require('fs');

const htmlContent = fs.readFileSync('live_store.html', 'utf8');

console.log('--- LIVE HTML SIZE ---');
console.log(`Total chars: ${htmlContent.length}`);

console.log('\n--- SCRIPTS ---');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  scriptCount++;
  const scriptContent = match[1];
  console.log(`Script ${scriptCount}: ${scriptContent.length} chars (Inline: ${scriptContent.trim().length > 0})`);
  if (scriptContent.length > 1000) {
    fs.writeFileSync('live_script.js', scriptContent);
    console.log(`Saved long script to live_script.js`);
  }
}

console.log('\n--- PRODUCT CARDS ---');
const productCardRegex = /<article[^>]*class=["'][^"']*product-card[^"']*["'][^>]*>/gi;
let productCardsCount = 0;
while ((match = productCardRegex.exec(htmlContent)) !== null) {
  productCardsCount++;
}
console.log(`Found ${productCardsCount} product cards directly in the HTML.`);

console.log('\n--- IMAGES (local vs absolute) ---');
const imgRegex = /<img\b[^>]*src\s*=\s*['"]([^'"]+)['"]/gi;
let localImgs = 0;
let remoteImgs = 0;
let localPaths = new Set();
while ((match = imgRegex.exec(htmlContent)) !== null) {
  const src = match[1];
  if (src.startsWith('http') || src.startsWith('//')) remoteImgs++;
  else {
    localImgs++;
    localPaths.add(src);
  }
}
console.log(`Local images: ${localImgs}`);
console.log(`Remote images: ${remoteImgs}`);
console.log('Sample local paths:', Array.from(localPaths).slice(0, 5));


