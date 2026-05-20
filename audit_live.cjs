const fs = require('fs');

function auditFile(filename) {
  console.log(`\n=== AUDIT: ${filename} ===`);
  const htmlContent = fs.readFileSync(filename, 'utf8');
  console.log(`Total chars: ${htmlContent.length}`);

  let match;
  
  const fetchRegex = /fetch\s*\(\s*['"]([^'"]+)['"]/g;
  let fetches = [];
  while ((match = fetchRegex.exec(htmlContent)) !== null) {
    fetches.push(match[1]);
  }
  console.log(`API Calls (fetch): ${fetches.length}`);

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

  const jsRegex = /<script\b[^>]*src\s*=\s*['"]([^'"]+)['"]/gi;
  let externalJs = [];
  while ((match = jsRegex.exec(htmlContent)) !== null) {
    externalJs.push(match[1]);
  }
  console.log(`External JS:`, externalJs);

  const inlineJsRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineCount = 0;
  while ((match = inlineJsRegex.exec(htmlContent)) !== null) {
    inlineCount++;
    console.log(`Inline script ${inlineCount} size: ${match[1].length}`);
    if (match[1].length > 1000) {
        const prodMatch = /const\s+products\s*=\s*\[([\s\S]*?)\];/i.exec(match[1]);
        console.log(`  - Has hardcoded 'products' array: ${!!prodMatch}`);
    }
  }
}

auditFile('live_store.html');
auditFile('proud_breeze.html');
auditFile('../rio-groove-cloudflare-final-corrigido/index.html');
