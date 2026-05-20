const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'rio-groove-cloudflare-final-corrigido', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

console.log('=== STOREFRONT AUDIT ===\n');

// 1. Where are products defined / cards rendered?
const productCardRegex = /<article[^>]*class=["'][^"']*product-card[^"']*["'][^>]*>/gi;
let match;
let productCardsCount = 0;
while ((match = productCardRegex.exec(htmlContent)) !== null) {
  productCardsCount++;
}
console.log(`1. Product Cards: Found ${productCardsCount} product cards directly in the HTML (static).`);

// Let's get the first product card to see its structure
const firstCardRegex = /<article[^>]*class=["'][^"']*product-card[^"']*["'][^>]*>([\s\S]*?)<\/article>/i;
const firstCardMatch = firstCardRegex.exec(htmlContent);
if (firstCardMatch) {
  console.log('\n2. Example Product Card Structure (Extracted from HTML):');
  console.log(firstCardMatch[0].substring(0, 500) + '...');
}

// 3. Where are the images mounted?
const imgRegex = /<img\b[^>]*src\s*=\s*['"]([^'"]+)['"]/gi;
const images = [];
while ((match = imgRegex.exec(htmlContent)) !== null) {
  images.push(match[1]);
}
console.log(`\n3. Images: Found ${images.length} <img> tags.`);
console.log('Sample image sources:');
images.slice(0, 5).forEach(src => console.log(` - ${src}`));

// 4. API Calls
const fetchRegex = /fetch\s*\(\s*['"]([^'"]+)['"]/g;
const apiCalls = [];
while ((match = fetchRegex.exec(htmlContent)) !== null) {
  apiCalls.push(match[1]);
}
console.log(`\n4. API Calls inside script: Found ${apiCalls.length} distinct endpoints.`);
apiCalls.forEach(url => console.log(` - ${url}`));

// 5. Hardcoded JS Data
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let inlineScript = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 1000) inlineScript = match[1];
}

console.log('\n5. Inspecting JS Script for data arrays:');
const arrayRegex = /(const|let|var)\s+(\w+)\s*=\s*\[([\s\S]*?)\];/g;
while ((match = arrayRegex.exec(inlineScript)) !== null) {
    if (match[3].length > 50) {
        console.log(` - Array: ${match[2]} (Length: ~${match[3].length} chars)`);
    }
}
const objectRegex = /(const|let|var)\s+(\w+)\s*=\s*\{([\s\S]*?)\};/g;
while ((match = objectRegex.exec(inlineScript)) !== null) {
    if (match[3].length > 50 && match[2] !== 'RIO_GROOVE_CONFIG') {
        console.log(` - Object: ${match[2]} (Length: ~${match[3].length} chars)`);
    }
}
