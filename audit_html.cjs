const fs = require('fs');

const html = fs.readFileSync('store_prod_index.html', 'utf-8');

console.log('--- CHECK INLINE SCRIPTS LENGTHS ---');
const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let i = 1;
while ((match = inlineScriptRegex.exec(html)) !== null) {
  console.log(`Script ${i} length: ${match[1].length}`);
  if (match[1].length > 1000) {
      console.log(`\n--- SCRIPT ${i} PREVIEW ---`);
      console.log(match[1].substring(0, 500));
  }
  i++;
}

console.log('\n--- HTML ELEMENTS ---');
console.log('class="product-card":', (html.match(/class="[^"]*product-card[^"]*"/g) || []).length);
console.log('data-product-id:', (html.match(/data-product-id/g) || []).length);
console.log('Local images (again):', (html.match(/<img\b[^>]*src=["']\.\/images\/[^"']+["'][^>]*>/gi) || []).length);
