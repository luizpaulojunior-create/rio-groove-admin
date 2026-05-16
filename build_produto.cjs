const fs = require('fs');

const indexHtml = fs.readFileSync('../rio-groove-cloudflare-final-corrigido/index.html', 'utf-8');

// Extract head and header
const headAndHeaderMatch = indexHtml.match(/([\s\S]*?)<main>/);
let headAndHeader = headAndHeaderMatch[1] + '<main>\n';

// Replace index.html internal links in the header to point to index.html#...
headAndHeader = headAndHeader.replace(/<nav class="header-nav">([\s\S]*?)<\/nav>/, (match, navInner) => {
  return '<nav class="header-nav">\n' + navInner.replace(/href="#/g, 'href="index.html#') + '\n</nav>';
});
headAndHeader = headAndHeader.replace(/<a href="#inicio" class="header-logo">/, '<a href="index.html#inicio" class="header-logo">');

// Extract footer
const footerMatch = indexHtml.match(/<\/main>([\s\S]*?)<script data-cfasync="false"/);
let footer = '\n</main>\n' + footerMatch[1];
// Fix footer links
footer = footer.replace(/href="#/g, 'href="index.html#');

// Custom CSS for product page
const customStyles = `
    <style>
      .product-single {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        margin-top: 2rem;
      }
      .product-single-image img {
        width: 100%;
        border-radius: var(--radius-md);
        border: 1px solid var(--surface-line);
        background-color: var(--bg-surface);
      }
      .product-single-info {
        display: flex;
        flex-direction: column;
      }
      @media (max-width: 768px) {
        .product-single {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
      }
    </style>
`;

headAndHeader = headAndHeader.replace('</head>', customStyles + '</head>');

// Main content
const mainContent = `
      <section id="produto-detalhes" class="page-section section-padding active" style="display: block; animation: none;">
        <div class="container">
          <div id="product-container">
            <p class="text-center text-muted">Carregando produto...</p>
          </div>
        </div>
      </section>
`;

const scripts = `
    <script type="module" src="./js/productPage.js"></script>
</body></html>
`;

const produtoHtml = headAndHeader + mainContent + footer + scripts;

fs.writeFileSync('../rio-groove-cloudflare-final-corrigido/produto.html', produtoHtml);
console.log('produto.html criado com sucesso!');