import { RIO_GROOVE_CONFIG } from './config.js';
import { initCart, initFloatingCart, addToCart } from './cart.js';
import { initShipping } from './shipping.js';
import { initCheckout } from './checkout.js';
import { productsService } from './services/productsService.js';
import { renderProducts } from './renderProducts.js';
import { monitoring } from './services/monitoringService.js';
import { analytics } from './services/analyticsService.js';
import { preload } from './utils/preload.js';
import { seoService } from './services/seoService.js';
import { structuredData } from './seo/structuredData.js';
import { searchService } from './services/searchService.js';
import { recoveryService } from './services/recoveryService.js';

// Phase 6 Imports
import { customerService } from './services/customerService.js';
import { wishlistService } from './crm/wishlist.js';
import { metricsService } from './dashboard/metrics.js';
import { funnelService } from './dashboard/funnels.js';
import { recommendationsService } from './crm/recommendations.js';
import { recentlyViewedService } from './crm/recentlyViewed.js';

import { communityService } from './services/communityService.js';
import { loyaltyService } from './services/loyaltyService.js';
import { campaignService } from './services/campaignService.js';
import { creatorService } from './services/creatorService.js';
import { contentService } from './services/contentService.js';

console.log('APP JS REAL');
alert('APP JS REAL CARREGADO');

const { fetchActiveProducts, fetchCollections, getProductBySlug, fetchCollectionBySlug } = productsService;

let isCollectionsLoaded = false;
let isProductsLoaded = false;
let publicConfig = null;

const body = document.body;
const sections = Array.from(document.querySelectorAll('.page-section'));
const navLinks = Array.from(document.querySelectorAll('.header-nav a'));
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');
const defaultSectionId = 'inicio';

// Initialize state
monitoring.init();
analytics.init();
analytics.trackSessionActivity(); // Phase 6 tracking
preload.init();
seoService.init();
structuredData.init();
structuredData.setOrganization();
campaignService.init();
creatorService.init();

// Expose services to window for easy access
window.analyticsService = analytics;
window.customerService = customerService;
window.wishlistService = wishlistService;
window.metricsService = metricsService;
window.funnelService = funnelService;
window.recommendationsService = recommendationsService;
window.recentlyViewedService = recentlyViewedService;
window.communityService = communityService;
window.loyaltyService = loyaltyService;
window.campaignService = campaignService;
window.creatorService = creatorService;
window.contentService = contentService;

customerService.registerVisit();
funnelService.trackStep('site_visit');

// Initial page load
seoService.setHomepage();

initCart();
initFloatingCart();
initShipping();
initCheckout();
loadPublicConfig();
hydratePaymentStatusFromQuery();

const initialPath = window.location.hash || window.location.pathname;
handleRoute(initialPath, false);

window.addEventListener('routechange', (e) => {
  handleRoute(e.detail.path, false);
});

window.addEventListener('hashchange', () => {
  handleRoute(window.location.hash || window.location.pathname, false);
});

window.addEventListener('navigatetocheckout', () => {
  funnelService.trackStep('checkout_start');
  handleRoute('/checkout', true);
});

// PWA Install Prompt logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const promptEl = document.getElementById('pwa-install-prompt');
  if (promptEl && !localStorage.getItem('pwa_prompt_dismissed')) {
      promptEl.style.setProperty('display', 'flex', 'important');
  }
});

console.log('APP JS NOVO CARREGADO');
alert('APP NOVO');

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');
    const promptEl = document.getElementById('pwa-install-prompt');
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                promptEl.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    analytics.track('pwa_installed');
                }
                deferredPrompt = null;
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            promptEl.style.display = 'none';
            localStorage.setItem('pwa_prompt_dismissed', 'true');
        });
    }
});

window.addEventListener('popstate', function () {
  handleRoute(window.location.hash || window.location.pathname, false);
});

function getTargetSectionId(path) {
  let cleanPath = (path || '').replace('#', '').replace(/^\//, '').replace(/\/$/, '').trim();
  if (!cleanPath) return defaultSectionId;
  
  const routeMap = {
    'products': 'produtos',
    'collections': 'colecoes',
    'sobre': 'sobre',
    'entrega': 'entrega',
    'pagamento': 'pagamento',
    'politicas': 'politicas',
    'politica-trocas': 'politica-trocas',
    'politica-privacidade': 'politica-privacidade',
    'politica-termos': 'politica-termos',
    'contato': 'contato',
    'carrinho': 'carrinho',
    'checkout': 'checkout',
    'pedido-status': 'pedido-status'
  };

  if (cleanPath.startsWith('product/')) return 'produto-detalhe';
  if (cleanPath.startsWith('collection/')) return 'colecao-detalhe';
  
  const mappedId = routeMap[cleanPath] || cleanPath;
  const target = document.getElementById(mappedId);
  return target ? mappedId : defaultSectionId;
}

function showSection(path, updateHistory) {
  const targetId = getTargetSectionId(path);

  body.classList.add('js-ready');

  sections.forEach(function (section) {
    const isActive = section.id === targetId;
    section.classList.toggle('active', isActive);

    if (section.dataset.requiresPaymentStatus === 'true') {
      section.style.display = isActive ? 'block' : 'none';
    }
  });

  navLinks.forEach(function (link) {
    const linkTarget = link.getAttribute('href');
    link.removeAttribute('aria-current');
    
    let normalizedPath = path.replace(/^#\/?/, '/').replace(/\/$/, '') || '/';

    if (normalizedPath === linkTarget || (linkTarget !== '/' && normalizedPath.startsWith(linkTarget))) {
      link.setAttribute('aria-current', 'page');
    }
  });

  if (updateHistory) {
    history.pushState(null, '', path);
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

document.addEventListener('click', function (event) {
  const link = event.target.closest('a[href^="/"]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || href === '#' || href.startsWith('http') || href.startsWith('mailto')) return;
  
  event.preventDefault();
  
  const url = new URL(href, window.location.origin);
  history.pushState(null, '', url.pathname);
  handleRoute(url.pathname, false);
});

async function handleRoute(path, updateHistory = false) {
  let normalizedPath = path.replace(/^#\/?/, '/');
  const cleanPath = normalizedPath.replace(/\/$/, '') || '/';
  
  showSection(path, updateHistory);
  
  const promises = [];
  
  // Default SEO
  if (cleanPath === '/') {
    seoService.setHomepage();
    structuredData.setOrganization();
  }

  if (cleanPath === '/' || cleanPath === '/collections') {
    promises.push(loadCollections());
  }
  
  if (cleanPath === '/' || cleanPath === '/products') {
    promises.push(loadProducts());
    metricsService.trackPageView('products');
  }
  
  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.split('/').pop();
    promises.push(loadProductDetail(slug));
  }
  
  if (cleanPath.startsWith('/collection/')) {
    const slug = cleanPath.split('/').pop();
    promises.push(loadCollectionDetail(slug));
  }
  
  await Promise.all(promises);
}

async function loadCollections() {
  if (isCollectionsLoaded) return;
  const container = document.getElementById('collections-container');
  if (!container) return;
  
  container.innerHTML = '<p class="text-muted">Carregando coleções...</p>';
  
  const data = await fetchCollections();
  const collections = Array.isArray(data) ? data : (data.collections || data.data || []);
  
  console.log("collections", collections);
  
  if (!collections || collections.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhuma coleção encontrada.</p>';
    return;
  }

  container.innerHTML = ''; // Limpar o placeholder

  for (const col of collections) {
    const colDetails = await fetchCollectionBySlug(col.slug);
    const products = colDetails ? (colDetails.products || []) : [];
    
    console.log(`products for ${col.slug}`, products);

    if (products.length > 0) {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'collection-section';
      sectionDiv.style.marginBottom = '4rem';

      const title = document.createElement('h3');
      title.className = 'heading-md';
      title.style.marginBottom = '2rem';
      title.innerHTML = `${col.name} <a href="/collection/${col.slug}" class="collection-link" style="font-size: 0.9rem; margin-left: 1rem; color: var(--color-primary); text-decoration: underline;">Ver coleção completa</a>`;
      
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      
      sectionDiv.appendChild(title);
      sectionDiv.appendChild(grid);
      container.appendChild(sectionDiv);

      // Usar a função existente para renderizar os produtos reais desta coleção
      renderProducts(products, grid);
    }
  }

  isCollectionsLoaded = true;

  // SPA navigation for collection links
  const collectionLinks = container.querySelectorAll('.collection-link');
  collectionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      history.pushState(null, '', href);
      handleRoute(href, false);
    });
  });
}

async function loadProducts() {
  if (isProductsLoaded) return;
  
  const grids = document.querySelectorAll('#products-grid');
  if (!grids.length) return;
  
  grids.forEach(grid => {
    grid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">Carregando produtos...</p>';
  });
  
  const data = await fetchActiveProducts();
  const products = Array.isArray(data) ? data : (data.products || data.data || []);
  
  grids.forEach(grid => {
    renderProducts(products, grid);
  });
  
  isProductsLoaded = true;
}

async function loadProductDetail(slug) {
  const container = document.getElementById('product-detail-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-placeholder">Carregando detalhes do produto...</div>';
  
  const product = await getProductBySlug(slug);
  
  if (!product) {
    container.innerHTML = '<div class="error-placeholder"><h2 class="heading-lg">Produto não <span class="text-red">encontrado</span></h2><p>O produto que você está procurando não existe ou está indisponível.</p><a href="/products" class="btn btn-red" style="margin-top: 2rem;">Ver todos os produtos</a></div>';
    
    // Add router event listener to back button
    const backBtn = container.querySelector('a.btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState(null, '', '/products');
        handleRoute('/products', false);
      });
    }
    return;
  }
  
  seoService.setProduct(product);
  structuredData.setProduct(product);
  analytics.trackViewProduct(product);

  funnelService.trackStep('product_view', { product_id: product.id });
  metricsService.trackProductView(product.id, product.category);

  const productUrl = `${window.location.origin}/product/${product.slug}`;
  const whatsappText = encodeURIComponent(`Olha que peça irada da Rio Groove Store: ${product.name} - ${productUrl}`);

  // Related products
  const relatedProducts = await recommendationsService.getRecommendationsForProduct(product.id, 4);
  let relatedHtml = '';
  if (relatedProducts.length > 0) {
      relatedHtml = `
      <div class="related-products" style="margin-top: 4rem; border-top: 1px solid #eee; padding-top: 2rem;">
          <h3 class="heading-sm text-center" style="margin-bottom: 2rem;">Você também pode <span class="text-red">gostar</span></h3>
          <div id="related-products-grid" class="product-grid"></div>
      </div>`;
  }

  // Create an array with product just for the renderProducts to use
  // We'll wrap it in a special detail layout
  container.innerHTML = `
    <div class="product-detail-layout" style="max-width: 500px; margin: 0 auto;">
      <div id="single-product-grid" class="product-grid" style="grid-template-columns: 1fr;"></div>
      <div class="product-social-share" style="margin-top: 2rem; text-align: center;">
        <p class="text-sm text-muted" style="margin-bottom: 1rem;">Compartilhar peça:</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <a href="https://wa.me/?text=${whatsappText}" target="_blank" class="btn btn-outline" style="padding: 0.5rem 1rem;">WhatsApp</a>
          <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent('Confere essa peça da Rio Groove Store: ' + product.name)}" target="_blank" class="btn btn-outline" style="padding: 0.5rem 1rem;">X / Twitter</a>
        </div>
      </div>
    </div>
  `;
  
  const grid = document.getElementById('single-product-grid');
  renderProducts([product], grid);
  
  if (relatedProducts.length > 0) {
      const relatedGrid = document.getElementById('related-products-grid');
      renderProducts(relatedProducts, relatedGrid);
  }
}

async function loadCollectionDetail(slug) {
  const header = document.getElementById('collection-detail-header');
  const grid = document.getElementById('collection-products-grid');
  
  if (!header || !grid) return;
  
  header.innerHTML = '<p class="text-muted">Carregando detalhes da coleção...</p>';
  grid.innerHTML = '';
  
  const collection = await fetchCollectionBySlug(slug);
  
  if (!collection) {
    header.innerHTML = '<h2 class="heading-lg">Coleção não <span class="text-red">encontrada</span></h2>';
    return;
  }
  
  seoService.setCollection(collection);
  
  const imageUrl = collection.banner_url || collection.image_url || 'https://placehold.co/1200x400/181818/ffffff?text=Rio+Groove';
  
  header.innerHTML = `
    <div class="collection-cover">
      <img src="${imageUrl}" alt="Capa da coleção ${collection.name}">
      <span class="collection-cover-label">Coleção Oficial</span>
    </div>
    <h2 class="heading-lg">${collection.name}</h2>
    <p class="text-muted" style="margin-bottom: 4rem; max-width: 600px">${collection.description || ''}</p>
  `;
  
  metricsService.trackCollectionView(collection.id || slug);

  if (!collection.products || collection.products.length === 0) {
    grid.innerHTML = '<p class="text-muted" style="grid-column: 1 / -1;">Nenhum produto nesta coleção.</p>';
    return;
  }
  
  renderProducts(collection.products, grid);
}

window.setupProductGallery = function setupProductGallery(card) {
  const mainImage = card.querySelector('.product-main-img');
  const thumbnails = Array.from(card.querySelectorAll('.product-thumbnails img'));
  const sizeBoxes = Array.from(card.querySelectorAll('.size-box'));
  const addButton = card.querySelector('button.btn');

  // Adiciona botão de favoritos se não existir
  const productInfo = card.querySelector('.product-info');
  if (productInfo && !card.querySelector('.wishlist-toggle')) {
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'flex-start';
    
    const title = productInfo.querySelector('.product-title');
    if (title) {
      const productId = card.getAttribute('data-id');
      const isWishlisted = window.wishlistService && window.wishlistService.isInWishlist(productId);
      
      const wishlistBtn = document.createElement('button');
      wishlistBtn.className = 'wishlist-toggle';
      wishlistBtn.style.background = 'none';
      wishlistBtn.style.border = 'none';
      wishlistBtn.style.cursor = 'pointer';
      wishlistBtn.style.color = isWishlisted ? 'var(--color-primary)' : 'var(--color-text-muted)';
      wishlistBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
      
      wishlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const productData = {
          id: productId,
          name: card.getAttribute('data-name'),
          price: parseFloat(card.getAttribute('data-price')) || 0,
          image: mainImage ? mainImage.src : '',
          slug: card.getAttribute('data-slug')
        };
        
        if (window.wishlistService) {
          const added = window.wishlistService.toggleItem(productData);
          wishlistBtn.style.color = added ? 'var(--color-primary)' : 'var(--color-text-muted)';
          wishlistBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="${added ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
        }
      });
      
      title.parentNode.insertBefore(headerRow, title);
      headerRow.appendChild(title);
      headerRow.appendChild(wishlistBtn);
    }
  }

  if (!mainImage || !thumbnails.length) return;

  function setActiveThumbnail(activeThumbnail) {
    thumbnails.forEach(function (thumbnail) {
      thumbnail.classList.toggle('is-active', thumbnail === activeThumbnail);
    });
  }

  thumbnails.forEach(function (thumbnail) {
    thumbnail.addEventListener('click', function () {
      const newSrc = thumbnail.getAttribute('src');
      const newAlt = thumbnail.getAttribute('alt') || mainImage.getAttribute('alt');

      mainImage.src = newSrc;
      mainImage.alt = newAlt;
      card.setAttribute('data-image', newSrc);
      setActiveThumbnail(thumbnail);
    });
  });

  sizeBoxes.forEach(function (sizeBox) {
    sizeBox.addEventListener('click', function () {
      sizeBoxes.forEach(function (item) {
        item.classList.remove('selected');
      });
      sizeBox.classList.add('selected');
    });
  });

  if (addButton) {
    addButton.addEventListener('click', function () {
      const productData = {
        id: card.getAttribute('data-id'),
        name: card.getAttribute('data-name'),
        price: parseFloat(card.getAttribute('data-price')) || 0,
        category: card.getAttribute('data-category'),
        slug: card.getAttribute('data-slug')
      };
      const sizeSelected = card.querySelector('.size-box.selected');
      const size = sizeSelected ? sizeSelected.textContent : null;
      
      addToCart(card);
      
      if (productData.id) {
        import('./services/analyticsService.js').then(module => {
          module.analytics.trackAddToCart(productData, size, 1);
        });
        funnelService.trackStep('add_to_cart', { product_id: productData.id });
        
        // Low stock alert verification when adding to cart
        const cartItem = window.getCart ? window.getCart().find(i => i.id === productData.id) : null;
        if (cartItem && cartItem.stock_quantity && cartItem.stock_quantity <= 5) {
            recoveryService.checkLowStockAlerts([cartItem]);
        }
      }
    });
  }

  const initialThumbnail = thumbnails.find(function (thumbnail) {
    return thumbnail.getAttribute('src') === mainImage.getAttribute('src');
  }) || thumbnails[0];

  setActiveThumbnail(initialThumbnail);

  mainImage.addEventListener('click', function () {
    openLightbox(mainImage.getAttribute('src'), mainImage.getAttribute('alt'));
  });
}

function openLightbox(src, alt) {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt || 'Imagem ampliada';
  lightbox.classList.add('active');
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove('active');
  lightboxImage.src = '';
}

if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}

if (lightbox) {
  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeLightbox();
  }
});

async function loadPublicConfig() {
  const { requestManager } = await import('./requestManager.js');
  const { logger } = await import('./logger.js');
  
  try {
    const response = await requestManager.fetch(RIO_GROOVE_CONFIG.publicConfigEndpoint);
    const text = await response.text();
    if (response.ok) {
      publicConfig = text ? JSON.parse(text) : null;
    }
  } catch (error) {
    logger.warn('Configuração pública do backend indisponível.', error);
  }
}

async function hydratePaymentStatusFromQuery() {
  const url = new URL(window.location.href);
  const paymentStatus = url.searchParams.get('payment');
  const externalReference = url.searchParams.get('external_reference');
  
  const paymentStatusPanel = document.getElementById('payment-status-panel');
  const paymentStatusBadge = document.getElementById('payment-status-badge');
  const paymentStatusTitle = document.getElementById('payment-status-title');
  const paymentStatusCopy = document.getElementById('payment-status-copy');
  const paymentOrderNumber = document.getElementById('payment-order-number');
  const paymentStatusList = document.getElementById('payment-status-list');
  const paymentStatusNote = document.getElementById('payment-status-note');
  const paymentMeta = document.getElementById('payment-meta');

  if (!paymentStatus) return;

  handleRoute('/pedido-status', false);

  if (paymentStatusPanel) {
    paymentStatusPanel.className = `payment-status-panel ${paymentStatus}`;
  }

  if (paymentStatus === 'success') {
    if (window.communityService && window.customerService) {
      window.communityService.checkVipEligibility(window.customerService.getProfile());
    }
  }
  if (paymentStatusBadge) {
    paymentStatusBadge.className = `payment-badge ${paymentStatus}`;
    paymentStatusBadge.textContent = paymentStatus === 'success'
      ? 'Pagamento aprovado'
      : paymentStatus === 'pending'
        ? 'Pagamento pendente'
        : 'Pagamento não concluído';
  }
  if (paymentStatusTitle) {
    paymentStatusTitle.innerHTML = paymentStatus === 'success'
      ? 'Pedido <span class="text-red">confirmado</span>'
      : paymentStatus === 'pending'
        ? 'Pagamento em <span class="text-red">análise</span>'
        : 'Pagamento <span class="text-red">não concluído</span>';
  }
  if (paymentStatusCopy) {
    paymentStatusCopy.textContent = 'Consultando os dados mais recentes do seu pedido no backend da Rio Groove Store...';
  }
  if (paymentStatusList) {
    paymentStatusList.innerHTML = '<li>Buscando detalhes do pedido...</li>';
  }
  if (paymentMeta) {
    paymentMeta.innerHTML = '';
  }

  funnelService.trackStep('purchase');

  if (!externalReference) {
    if (paymentStatusCopy) {
      paymentStatusCopy.textContent = 'Não foi possível localizar a referência do pedido no retorno do pagamento.';
    }
    if (paymentStatusList) {
      paymentStatusList.innerHTML = '<li>Entre em contato com a loja para confirmar o pagamento manualmente.</li>';
    }
    return;
  }

  const { requestManager } = await import('./requestManager.js');

  try {
    const response = await requestManager.fetch(`${RIO_GROOVE_CONFIG.ordersEndpoint}/${encodeURIComponent(externalReference)}`);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {} } catch(e) {}

    if (!response.ok || !data.order) {
      throw new Error(data.message || 'Pedido não encontrado no backend.');
    }

    const order = data.order;
    if (paymentOrderNumber) {
      paymentOrderNumber.style.display = 'block';
      paymentOrderNumber.textContent = `Pedido ${order.order_number || externalReference}`;
    }
    if (paymentStatusCopy) {
      paymentStatusCopy.textContent = 'Seu pedido foi sincronizado com o backend real da Rio Groove Store. Confira os detalhes abaixo.';
    }
    if (paymentStatusList) {
      const { formatCurrency, escapeHtml } = await import('./utils.js');
      paymentStatusList.innerHTML = [
        `Status do pedido: ${order.status || 'aguardando atualização'}`,
        `Status do pagamento: ${order.payment_status || 'pendente'}`,
        `Total: ${formatCurrency(order.total_amount || order.total || 0)}`,
        `Frete: ${formatCurrency(order.shipping_amount || order.shipping_price || 0)}`
      ].map(function (item) {
        return `<li>${escapeHtml(item)}</li>`;
      }).join('');
    }
    if (paymentStatusNote) {
      paymentStatusNote.textContent = 'Se precisar de suporte, envie o número do pedido para o atendimento da loja.';
    }
    if (paymentMeta) {
      const { escapeHtml } = await import('./utils.js');
      paymentMeta.innerHTML = `
        <div class="summary-row"><span>Referência</span><span>${escapeHtml(order.external_reference || externalReference)}</span></div>
        <div class="summary-row"><span>E-mail</span><span>${escapeHtml(order.customer_email || '-')}</span></div>
        <div class="summary-row"><span>Pagamento</span><span>${escapeHtml(order.payment_provider || 'Mercado Pago')}</span></div>
        <div class="summary-row"><span>Criado em</span><span>${escapeHtml(new Date(order.created_at).toLocaleString('pt-BR'))}</span></div>
      `;
    }

  } catch (error) {
    if (paymentStatusCopy) {
      paymentStatusCopy.textContent = error.message || 'Não foi possível carregar o status do pedido.';
    }
    if (paymentStatusList) {
      paymentStatusList.innerHTML = '<li>Verifique novamente em alguns instantes ou fale com a loja.</li>';
    }
  }
}
