const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../rio-groove-cloudflare-final-corrigido/index.html');
const cssDir = path.join(__dirname, '../rio-groove-cloudflare-final-corrigido/styles');
const cssPath = path.join(cssDir, 'store.css');

if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}

let html = fs.readFileSync(htmlPath, 'utf8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);

if (styleMatch) {
  const cssContent = styleMatch[1];
  fs.writeFileSync(cssPath, cssContent);
  html = html.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="./styles/store.css">');
  fs.writeFileSync(htmlPath, html);
  console.log('CSS extracted successfully');
} else {
  console.log('No inline CSS found');
}