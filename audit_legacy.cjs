const fs = require('fs');

const htmlContent = fs.readFileSync('store_prod_index.html', 'utf8');

console.log('=== AUDITORIA DA STOREFRONT (store_prod_index.html) ===\n');

// 1. Onde os produtos são definidos
// 4. Onde existem arrays hardcoded
// 8. O que está dentro do script inline gigante
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  scriptCount++;
  const scriptContent = match[1];
  if (scriptContent.length > 1000) {
    console.log(`[Script Inline Gigante Encontrado] Tamanho: ${scriptContent.length} chars`);
    
    // Buscar arrays de produtos ou dados hardcoded
    const productsMatch = /const\s+products\s*=\s*\[([\s\S]*?)\];/i.exec(scriptContent);
    if (productsMatch) {
      console.log(`=> Array 'products' hardcoded encontrado! Tamanho: ${productsMatch[1].length} chars`);
    } else {
      console.log(`=> Array 'products' não encontrado diretamente com 'const products ='.`);
    }

    // Listar outros arrays ou objetos grandes
    const arrayRegex = /(const|let|var)\s+(\w+)\s*=\s*\[([\s\S]{10,200})\]/g;
    let arrMatch;
    console.log('=> Arrays no script:');
    while ((arrMatch = arrayRegex.exec(scriptContent)) !== null) {
      console.log(`   - ${arrMatch[2]} (Preview: ${arrMatch[3].substring(0, 50).replace(/\n/g, '')}...)`);
    }
  }
}

// 2. Onde os cards são renderizados
const productCardRegex = /<article[^>]*class=["'][^"']*product-card[^"']*["'][^>]*>/gi;
let productCardsCount = 0;
while ((match = productCardRegex.exec(htmlContent)) !== null) {
  productCardsCount++;
}
console.log(`\n[Cards HTML Estáticos] Foram encontrados ${productCardsCount} elementos com classe 'product-card' no HTML.`);

// 3. Onde as imagens são montadas
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
console.log(`\n[Imagens]`);
console.log(`- Imagens locais: ${localImgs}`);
console.log(`- Imagens remotas (API/CDN): ${remoteImgs}`);
console.log('- Amostra de caminhos locais:', Array.from(localPaths).slice(0, 5));

// 7. O que já consome API
const fetchRegex = /fetch\s*\(\s*['"]([^'"]+)['"]/g;
const apiCalls = [];
while ((match = fetchRegex.exec(htmlContent)) !== null) {
  apiCalls.push(match[1]);
}
const fetchVarRegex = /fetch\s*\(\s*([a-zA-Z0-9_$.]+)/g;
while ((match = fetchVarRegex.exec(htmlContent)) !== null) {
    if(!match[1].includes("'") && !match[1].includes('"')) {
        apiCalls.push(`Variavel/Expressao: ${match[1]}`);
    }
}
console.log(`\n[Consumo de API] Foram encontradas ${apiCalls.length} chamadas 'fetch'.`);
apiCalls.forEach(url => console.log(` - ${url}`));

// 6. O que ainda é HTML estático
const sectionsRegex = /<section\b[^>]*id\s*=\s*['"]([^'"]+)['"]/gi;
console.log(`\n[Estrutura Estática (Sections)]`);
while ((match = sectionsRegex.exec(htmlContent)) !== null) {
  console.log(` - #${match[1]}`);
}
