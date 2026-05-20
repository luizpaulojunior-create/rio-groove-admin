
      document.addEventListener('DOMContentLoaded', function () {
        const RIO_GROOVE_CONFIG = {
          backendUrl: 'https://rio-groove-backend.onrender.com',
          checkoutEndpoint: 'https://rio-groove-backend.onrender.com/api/checkout',
          ordersEndpoint: 'https://rio-groove-backend.onrender.com/api/orders',
          publicConfigEndpoint: 'https://rio-groove-backend.onrender.com/api/config/public',
          frontendUrl: window.location.origin || 'https://proud-breeze-a824.luizpaulojunior.workers.dev'
        };

        window.RIO_GROOVE_CONFIG = RIO_GROOVE_CONFIG;

        const STORAGE_KEYS = {
          cart: 'rioGrooveCart',
          shipping: 'rioGrooveShipping',
          checkout: 'rioGrooveCheckoutForm'
        };

        const body = document.body;
        const sections = Array.from(document.querySelectorAll('.page-section'));
        const internalLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
        const navLinks = Array.from(document.querySelectorAll('.header-nav a'));
        const productCards = Array.from(document.querySelectorAll('.product-card'));
        const lightbox = document.getElementById('lightbox');
        const lightboxImage = document.getElementById('lightbox-img');
        const lightboxClose = document.querySelector('.lightbox-close');
        const defaultSectionId = 'inicio';

        const cartItemsElement = document.getElementById('cart-items');
        const cartSubtotalElement = document.getElementById('cart-subtotal');
        const cartShippingElement = document.getElementById('cart-shipping');
        const cartTotalElement = document.getElementById('cart-total');
        const cartContinueButton = document.getElementById('cart-continue-button');
        const cartBadgeElement = document.getElementById('cart-badge');
        const shippingCepInput = document.getElementById('shipping-cep');
        const shippingStatusElement = document.getElementById('shipping-status');
        const shippingResultsElement = document.getElementById('shipping-results');
        const calculateShippingButton = document.getElementById('calculate-shipping-button');

        const checkoutSubmitButton = document.getElementById('checkout-submit');
        const checkoutMessageElement = document.getElementById('checkout-message');
        const checkoutReviewItemsElement = document.getElementById('checkout-review-items');
        const checkoutReviewSubtotalElement = document.getElementById('checkout-review-subtotal');
        const checkoutReviewShippingElement = document.getElementById('checkout-review-shipping');
        const checkoutReviewTotalElement = document.getElementById('checkout-review-total');

        const checkoutFields = {
          name: document.getElementById('checkout-name'),
          email: document.getElementById('checkout-email'),
          phone: document.getElementById('checkout-phone'),
          cpf: document.getElementById('checkout-cpf'),
          cep: document.getElementById('checkout-cep'),
          street: document.getElementById('checkout-street'),
          number: document.getElementById('checkout-number'),
          complement: document.getElementById('checkout-complement'),
          neighborhood: document.getElementById('checkout-neighborhood'),
          city: document.getElementById('checkout-city'),
          state: document.getElementById('checkout-state'),
          notes: document.getElementById('checkout-notes'),
          terms: document.getElementById('checkout-terms'),
          updates: document.getElementById('checkout-updates'),
          pickupTerms: document.getElementById('checkout-pickup-terms')
        };

        const paymentStatusPanel = document.getElementById('payment-status-panel');
        const paymentStatusBadge = document.getElementById('payment-status-badge');
        const paymentStatusTitle = document.getElementById('payment-status-title');
        const paymentStatusCopy = document.getElementById('payment-status-copy');
        const paymentOrderNumber = document.getElementById('payment-order-number');
        const paymentStatusList = document.getElementById('payment-status-list');
        const paymentStatusNote = document.getElementById('payment-status-note');
        const paymentMeta = document.getElementById('payment-meta');

        const initialCart = loadStorage(STORAGE_KEYS.cart, []);
        const initialSelectedShipping = loadStorage(STORAGE_KEYS.shipping, null);

        const state = {
          cart: Array.isArray(initialCart)
            ? initialCart.map(function (item) {
                return normalizeCartItem(item);
              }).filter(function (item) {
                return item.quantity > 0 && item.unitPrice > 0;
              })
            : [],
          selectedShipping: normalizeShippingOption(initialSelectedShipping),
          shippingOptions: [],
          publicConfig: null,
          isCheckoutLoading: false
        };

        function loadStorage(key, fallbackValue) {
          try {
            const rawValue = window.localStorage.getItem(key);
            return rawValue ? JSON.parse(rawValue) : fallbackValue;
          } catch (error) {
            return fallbackValue;
          }
        }

        function saveStorage(key, value) {
          try {
            window.localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn('Não foi possível salvar no navegador:', key, error);
          }
        }

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function normalizeMoneyValue(value) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            const absoluteText = String(Math.abs(value));
            if (Number.isInteger(value) && Math.abs(value) >= 1000 && absoluteText.length >= 4) {
              const sign = value < 0 ? '-' : '';
              const cents = absoluteText.slice(-2);
              const integerPart = absoluteText.slice(0, -2) || '0';
              return Number(`${sign}${integerPart}.${cents}`);
            }
            return Number(value.toFixed(2));
          }

          const rawValue = String(value || '').trim();
          if (!rawValue) return 0;

          const sanitizedValue = rawValue.replace(/[^\d,.-]/g, '');
          const hasComma = sanitizedValue.includes(',');
          const hasDot = sanitizedValue.includes('.');
          let normalizedText = sanitizedValue;

          if (hasComma && hasDot) {
            const commaParts = sanitizedValue.split(',');
            const integerPart = commaParts.shift().split('.').join('');
            const decimalPart = commaParts.join('');
            normalizedText = `${integerPart}.${decimalPart}`;
          } else if (hasComma) {
            normalizedText = sanitizedValue.split(',').join('.');
          } else if (!hasDot && /^-?\d{4,}$/.test(sanitizedValue)) {
            const sign = sanitizedValue.startsWith('-') ? '-' : '';
            const digitsOnly = sanitizedValue.replace('-', '');
            normalizedText = `${sign}${digitsOnly.slice(0, -2) || '0'}.${digitsOnly.slice(-2)}`;
          }

          const parsedValue = Number.parseFloat(normalizedText);
          if (!Number.isFinite(parsedValue)) return 0;

          return Number(parsedValue.toFixed(2));
        }

        function normalizeQuantity(value) {
          return Math.max(1, Number.parseInt(value, 10) || 1);
        }

        function normalizeShippingOption(option) {
          if (!option || typeof option !== 'object') return null;
          return {
            id: option.id || '',
            label: option.label || 'Entrega',
            price: normalizeMoneyValue(option.price),
            deadline: option.deadline || ''
          };
        }

        function normalizeCartItem(item) {
          return {
            key: item.key || [item.name || 'Produto', item.color || 'Padrão', item.size || 'Único'].join('|'),
            slug: item.slug || slugify(item.name || 'produto'),
            name: item.name || 'Produto',
            image: item.image || '',
            color: item.color || 'Padrão',
            size: item.size || 'Único',
            unitPrice: normalizeMoneyValue(item.unitPrice != null ? item.unitPrice : (item.unit_price != null ? item.unit_price : item.price)),
            quantity: normalizeQuantity(item.quantity),
            weight: Number(item.weight) || 0.35,
            height: Number(item.height) || 5,
            width: Number(item.width) || 30,
            length: Number(item.length) || 25
          };
        }

        function formatCurrency(value) {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(normalizeMoneyValue(value));
        }

        function toCents(value) {
          return Math.round(normalizeMoneyValue(value) * 100);
        }

        function onlyDigits(value) {
          return String(value || '').replace(/\D+/g, '');
        }

        function slugify(value) {
          return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        function inferColorFromImage(src) {
          const normalized = String(src || '').toLowerCase();
          if (normalized.includes('off-white')) return 'Off White';
          if (normalized.includes('branca') || normalized.includes('branco')) return 'Branco';
          if (normalized.includes('preta') || normalized.includes('preto')) return 'Preto';
          if (normalized.includes('vermelha') || normalized.includes('vermelho')) return 'Vermelho';
          return 'Padrão';
        }

        function getCartSubtotal() {
          return Number(state.cart.reduce(function (total, item) {
            return total + normalizeMoneyValue(item.unitPrice) * normalizeQuantity(item.quantity);
          }, 0).toFixed(2));
        }

        function getShippingAmount() {
          return state.selectedShipping ? normalizeMoneyValue(state.selectedShipping.price) : 0;
        }

        function getCartTotal() {
          return getCartSubtotal() + getShippingAmount();
        }

        function setCheckoutLoading(isLoading, message) {
          state.isCheckoutLoading = isLoading;
          if (checkoutSubmitButton) {
            checkoutSubmitButton.disabled = isLoading;
            checkoutSubmitButton.textContent = isLoading ? 'Redirecionando...' : 'Ir para pagamento';
          }
          if (message) {
            setCheckoutMessage(message, isLoading ? '' : 'error');
          }
        }

        function setCheckoutMessage(message, type) {
          if (!checkoutMessageElement) return;
          checkoutMessageElement.textContent = message || '';
          checkoutMessageElement.classList.remove('error');
          if (type === 'error') {
            checkoutMessageElement.classList.add('error');
          }
        }

        function setShippingStatus(message, type) {
          if (!shippingStatusElement) return;
          shippingStatusElement.textContent = message || '';
          shippingStatusElement.classList.remove('error');
          if (type === 'error') {
            shippingStatusElement.classList.add('error');
          }
        }

        function setProductFeedback(element, message, type) {
          if (!element) return;
          element.textContent = message || '';
          element.classList.remove('error');
          if (type === 'error') {
            element.classList.add('error');
          }
        }

        function getTargetSectionId(hash) {
          const cleanHash = (hash || '').replace('#', '').trim();
          if (!cleanHash) return defaultSectionId;
          const target = document.getElementById(cleanHash);
          return target ? cleanHash : defaultSectionId;
        }

        function showSection(sectionId, updateHistory) {
          if (typeof paymentFinalized !== 'undefined' && paymentFinalized && sectionId !== 'pedido-status' && sectionId !== '#pedido-status') return;
          const targetId = getTargetSectionId(sectionId);

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

            if (linkTarget === '#' + targetId) {
              link.setAttribute('aria-current', 'page');
            }
          });

          if (updateHistory) {
            history.pushState(null, '', '#' + targetId);
          }

          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }

        internalLinks.forEach(function (link) {
          link.addEventListener('click', function (event) {
            const href = link.getAttribute('href');

            if (!href || href === '#') return;

            const targetId = getTargetSectionId(href);
            const targetSection = document.getElementById(targetId);

            if (!targetSection) return;

            event.preventDefault();
            showSection(targetId, true);
          });
        });

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

        function saveCart() {
          state.cart = state.cart.map(function (item) {
            return normalizeCartItem(item);
          });
          saveStorage(STORAGE_KEYS.cart, state.cart);
          updateCartBadge();
        }

        function updateCartBadge() {
          if (!cartBadgeElement) return;
          const totalCount = state.cart.reduce(function (sum, item) {
            return sum + normalizeQuantity(item.quantity);
          }, 0);
          cartBadgeElement.textContent = totalCount;
        }

        function saveSelectedShipping() {
          state.selectedShipping = normalizeShippingOption(state.selectedShipping);
          saveStorage(STORAGE_KEYS.shipping, state.selectedShipping);
        }

        async function fetchShippingOptionsFromAPI(cepDigits) {
          const subtotal = getCartSubtotal();
          const packageData = calculatePackageDimensions();

          try {
            const payload = Object.assign({ cep: cepDigits }, packageData);
            console.log('[MelhorEnvio] Payload enviado', payload);

            const response = await fetch(`${RIO_GROOVE_CONFIG.backendUrl}/api/shipping/quote`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`Erro ao consultar frete: ${response.status} ${errorBody}`);
            }

            const data = await response.json();
            console.log('[MelhorEnvio] Resposta completa da API', data);

            const shippingOptions = Array.isArray(data)
              ? data.map(function (option) {
                  const days = parseInt(option.custom_delivery_time) || parseInt(option.delivery_time) || 0;
                  const deadlineText = days > 0 ? (days === 1 ? '1 dia útil' : `${days} dias úteis`) : 'A calcular';
                  
                  console.log(`[Shipping] Prazo recebido da API para ${option.name}: delivery_time=${option.delivery_time}, custom_delivery_time=${option.custom_delivery_time}`);
                  console.log(`[Shipping] Prazo renderizado no frontend:`, deadlineText);

                  return {
                    id: option.id,
                    label: `${option.company} - ${option.name}`,
                    price: option.price,
                    deadline: deadlineText,
                    company: option.company
                  };
                })
              : [];

            const pickupOption = buildPickupOption(cepDigits);
            if (pickupOption) {
              shippingOptions.push(pickupOption);
            }

            const freeShippingOption = buildFreeShippingOption(shippingOptions);
            if (freeShippingOption) {
              shippingOptions.unshift(freeShippingOption);
            }

            if (!shippingOptions.length) {
              throw new Error('Nenhuma opção de frete retornada pela API.');
            }

            console.log('[MelhorEnvio] Serviços renderizados no frontend', shippingOptions);
            return shippingOptions;
          } catch (error) {
            console.error('[MelhorEnvio] Erro ao buscar opções de frete:', error);
            throw error;
          }
        }

        function calculatePackageDimensions() {
          if (!state.cart.length) {
            return {
              weight: 0.35,
              height: 5,
              width: 30,
              length: 25
            };
          }

          let totalWeight = 0;
          let maxHeight = 0;
          let maxWidth = 0;
          let maxLength = 0;

          state.cart.forEach(function (item) {
            const qty = normalizeQuantity(item.quantity);
            totalWeight += (item.weight || 0.35) * qty;
            maxHeight = Math.max(maxHeight, item.height || 5);
            maxWidth = Math.max(maxWidth, item.width || 30);
            maxLength = Math.max(maxLength, item.length || 25);
          });

          const totalItems = state.cart.reduce(function (sum, item) {
            return sum + normalizeQuantity(item.quantity);
          }, 0);

          if (totalItems > 3) {
            maxWidth = Math.max(maxWidth, 40);
            maxLength = Math.max(maxLength, 35);
          }

          return {
            weight: Math.max(totalWeight, 0.35),
            height: Math.max(maxHeight, 3),
            width: Math.max(maxWidth, 20),
            length: Math.max(maxLength, 20)
          };
        }

        function isRioCep(cepDigits) {
          return /^2[0-8]\d{6}$/.test(cepDigits);
        }

        function buildFreeShippingOption(options) {
          const subtotal = getCartSubtotal();
          const threshold = 799.9;

          if (subtotal < threshold) {
            return null;
          }

          const bestCarrier = options.find(function (option) {
            return /pac/i.test(option.label) || /correios/i.test(option.company);
          }) || options[0] || null;

          if (!bestCarrier) {
            return {
              id: 'free-shipping',
              label: 'Frete Grátis',
              price: 0,
              deadline: '5 a 8 dias úteis',
              company: 'Correios',
              badge: 'Frete grátis'
            };
          }

          return {
            id: 'free-shipping',
            label: `Frete Grátis · ${bestCarrier.company} ${bestCarrier.name || bestCarrier.label}`,
            price: 0,
            deadline: bestCarrier.deadline || '5 a 8 dias úteis',
            company: bestCarrier.company,
            badge: 'Frete grátis'
          };
        }

        function buildPickupOption(cepDigits) {
          if (!isRioCep(cepDigits)) {
            return null;
          }

          return {
            id: 'pickup-rio',
            label: 'Retirada presencial no Rio de Janeiro',
            price: 0,
            deadline: 'Após confirmação do pagamento',
            company: 'Retirada Local',
            badge: 'Sem custo'
          };
        }

        function buildShippingOptions(cepDigits) {
          return fetchShippingOptionsFromAPI(cepDigits);
        }

        function renderShippingOptions(isLoading) {
          if (typeof paymentFinalized !== 'undefined' && paymentFinalized) return;
          if (!shippingResultsElement) return;

          if (isLoading) {
            shippingResultsElement.innerHTML = `
              <div class="shipping-skeleton">
                <div class="shipping-loading">
                  <div class="loading-spinner"></div>
                  <p>Calculando opções de frete...</p>
                </div>
                <div class="shipping-skeleton-line"></div>
                <div class="shipping-skeleton-line short"></div>
              </div>
            `;
            return;
          }

          if (!state.shippingOptions.length) {
            shippingResultsElement.innerHTML = '<p class="text-muted">Informe o CEP e calcule o frete para ver as opções disponíveis.</p>';
            return;
          }

          const optionsHtml = state.shippingOptions.map(function (option) {
            const checked = state.selectedShipping && String(state.selectedShipping.id) === String(option.id);
            const badge = option.badge ? `<span class="shipping-badge">${escapeHtml(option.badge)}</span>` : '';
            return `
              <label class="shipping-option ${checked ? 'is-selected' : ''}">
                <input type="radio" name="shipping-option" value="${escapeHtml(option.id)}" ${checked ? 'checked' : ''}>
                <div>
                  <strong>${escapeHtml(option.label)} ${badge}</strong>
                  <div><small>${escapeHtml(option.deadline)} · ${formatCurrency(option.price)}</small></div>
                </div>
              </label>
            `;
          }).join('');

          const preparationNoteHtml = `
            <div style="margin-top: 1rem; padding: 0.875rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-left: 3px solid #ff3c30; border-radius: 6px; font-size: 0.85rem; color: #ccc; display: flex; gap: 0.75rem; align-items: flex-start; line-height: 1.5;">
              <svg style="width: 20px; height: 20px; color: #ff3c30; flex-shrink: 0; margin-top: 0.1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <div>
                <strong style="color: #fff; display: block; margin-bottom: 0.25rem;">Prazo Operacional</strong>
                Prazo de até 2 dias úteis para preparação e envio à transportadora.<br>
                <small style="opacity: 0.7;">(O prazo da transportadora escolhida conta a partir da postagem)</small>
              </div>
            </div>
          `;

          shippingResultsElement.innerHTML = optionsHtml + preparationNoteHtml;
        }

        function syncShippingSelection(optionId) {
          console.log('[Shipping] Opção clicada', optionId);
          const nextOption = state.shippingOptions.find(function (option) {
            return String(option.id) === String(optionId);
          });

          state.selectedShipping = nextOption || null;
          console.log('[Shipping] Frete selecionado', state.selectedShipping);
          saveSelectedShipping();

          // Handle pickup consent display
          const pickupConsentWrapper = document.getElementById('pickup-consent-wrapper');
          if (pickupConsentWrapper) {
            const isPickup = state.selectedShipping && String(state.selectedShipping.label).toLowerCase().includes('retirada');
            pickupConsentWrapper.style.display = isPickup ? 'flex' : 'none';
          }

          renderShippingOptions();
          renderCart();
          renderCheckoutReview();
          console.log('[Shipping] Total atualizado', getCartTotal());
        }

        async function calculateShipping(options) {
          if (typeof paymentFinalized !== 'undefined' && paymentFinalized) return;
          const settings = options || {};
          const cepDigits = onlyDigits(shippingCepInput ? shippingCepInput.value : checkoutFields.cep ? checkoutFields.cep.value : '');

          if (!state.cart.length) {
            state.shippingOptions = [];
            state.selectedShipping = null;
            saveSelectedShipping();
            renderShippingOptions();
            renderCart();
            renderCheckoutReview();
            setShippingStatus('Adicione produtos ao carrinho antes de calcular o frete.', 'error');
            return;
          }

          if (cepDigits.length !== 8) {
            if (!settings.silent) {
              setShippingStatus('Digite um CEP válido com 8 números para calcular o frete.', 'error');
            }
            return;
          }

          if (!settings.silent) {
            setShippingStatus('Calculando frete...', '');
            renderShippingOptions(true); // Show loading state
          }

          try {
            state.shippingOptions = await buildShippingOptions(cepDigits);

            const keptOption = settings.keepSelection && state.selectedShipping
              ? state.shippingOptions.find(function (option) { return String(option.id) === String(state.selectedShipping.id); })
              : null;

            state.selectedShipping = keptOption || state.shippingOptions[0] || null;
            saveSelectedShipping();
            renderShippingOptions(false); // Hide loading state
            renderCart();
            renderCheckoutReview();
            setShippingStatus('Frete calculado. Escolha a opção desejada para concluir o checkout.');
          } catch (error) {
            console.error('Erro ao calcular frete:', error);
            state.shippingOptions = [];
            state.selectedShipping = null;
            saveSelectedShipping();
            renderShippingOptions(false); // Hide loading state
            renderCart();
            renderCheckoutReview();
            setShippingStatus('Erro ao calcular frete. Tente novamente.', 'error');
          }
        }

        function renderCart() {
          if (typeof paymentFinalized !== 'undefined' && paymentFinalized) return;
          if (!cartItemsElement) return;

          if (!state.cart.length) {
            cartItemsElement.innerHTML = '<p class="cart-empty">Seu carrinho está vazio. Escolha a peça, selecione o tamanho e adicione ao carrinho para continuar.</p>';
          } else {
            cartItemsElement.innerHTML = state.cart.map(function (item, index) {
              return `
                <article class="cart-item">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
                  <div class="cart-item-meta">
                    <strong class="heading-sm" style="margin-bottom: 0.5rem">${escapeHtml(item.name)}</strong>
                    <p class="text-muted">Cor: ${escapeHtml(item.color)} · Tamanho: ${escapeHtml(item.size)}</p>
                    <p class="text-muted">Valor unitário: ${formatCurrency(item.unitPrice)}</p>
                    <div class="cart-actions">
                      <div class="cart-qty-control" data-index="${index}">
                        <button type="button" data-action="decrease">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-action="increase">+</button>
                      </div>
                      <button type="button" class="cart-remove" data-remove-index="${index}">Remover</button>
                    </div>
                  </div>
                  <strong>${formatCurrency(item.unitPrice * item.quantity)}</strong>
                </article>
              `;
            }).join('');
          }

          const subtotal = getCartSubtotal();
          const shippingAmount = getShippingAmount();
          const total = getCartTotal();

          if (cartSubtotalElement) cartSubtotalElement.textContent = formatCurrency(subtotal);
          if (cartShippingElement) {
            cartShippingElement.textContent = state.selectedShipping
              ? `${state.selectedShipping.label} · ${formatCurrency(shippingAmount)}`
              : 'A calcular';
          }
          if (cartTotalElement) cartTotalElement.textContent = formatCurrency(total);

          if (cartContinueButton) {
            cartContinueButton.disabled = !state.cart.length;
          }
          updateCartBadge();
        }

        function renderCheckoutReview() {
          if (typeof paymentFinalized !== 'undefined' && paymentFinalized) return;
          if (!checkoutReviewItemsElement) return;

          if (!state.cart.length) {
            checkoutReviewItemsElement.innerHTML = '<p class="checkout-review-empty">Seu resumo aparecerá aqui após a seleção dos produtos no carrinho.</p>';
          } else {
            checkoutReviewItemsElement.innerHTML = state.cart.map(function (item) {
              return `
                <article class="checkout-review-item">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.color)} · Tam ${escapeHtml(item.size)}</span>
                    <span>Qtd. ${item.quantity}</span>
                    <span>${formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                </article>
              `;
            }).join('');
          }

          if (checkoutReviewSubtotalElement) checkoutReviewSubtotalElement.textContent = formatCurrency(getCartSubtotal());
          if (checkoutReviewShippingElement) {
            checkoutReviewShippingElement.textContent = state.selectedShipping
              ? `${state.selectedShipping.label} · ${formatCurrency(getShippingAmount())}`
              : 'A calcular';
          }
          if (checkoutReviewTotalElement) checkoutReviewTotalElement.textContent = formatCurrency(getCartTotal());
        }

        function persistCheckoutForm() {
          saveStorage(STORAGE_KEYS.checkout, {
            name: checkoutFields.name ? checkoutFields.name.value : '',
            email: checkoutFields.email ? checkoutFields.email.value : '',
            phone: checkoutFields.phone ? checkoutFields.phone.value : '',
            cpf: checkoutFields.cpf ? checkoutFields.cpf.value : '',
            cep: checkoutFields.cep ? checkoutFields.cep.value : '',
            street: checkoutFields.street ? checkoutFields.street.value : '',
            number: checkoutFields.number ? checkoutFields.number.value : '',
            complement: checkoutFields.complement ? checkoutFields.complement.value : '',
            neighborhood: checkoutFields.neighborhood ? checkoutFields.neighborhood.value : '',
            city: checkoutFields.city ? checkoutFields.city.value : '',
            state: checkoutFields.state ? checkoutFields.state.value : '',
            notes: checkoutFields.notes ? checkoutFields.notes.value : '',
            updates: checkoutFields.updates ? checkoutFields.updates.checked : false
          });
        }

        function restoreCheckoutForm() {
          const data = loadStorage(STORAGE_KEYS.checkout, {});
          if (checkoutFields.name) checkoutFields.name.value = data.name || '';
          if (checkoutFields.email) checkoutFields.email.value = data.email || '';
          if (checkoutFields.phone) checkoutFields.phone.value = data.phone || '';
          if (checkoutFields.cpf) checkoutFields.cpf.value = data.cpf || '';
          if (checkoutFields.cep) checkoutFields.cep.value = data.cep || '';
          if (checkoutFields.street) checkoutFields.street.value = data.street || '';
          if (checkoutFields.number) checkoutFields.number.value = data.number || '';
          if (checkoutFields.complement) checkoutFields.complement.value = data.complement || '';
          if (checkoutFields.neighborhood) checkoutFields.neighborhood.value = data.neighborhood || '';
          if (checkoutFields.city) checkoutFields.city.value = data.city || '';
          if (checkoutFields.state) checkoutFields.state.value = data.state || '';
          if (checkoutFields.notes) checkoutFields.notes.value = data.notes || '';
          if (checkoutFields.updates) checkoutFields.updates.checked = Boolean(data.updates);
        }

        function bindCheckoutFormPersistence() {
          Object.keys(checkoutFields).forEach(function (key) {
            const field = checkoutFields[key];
            if (!field || key === 'terms') return;
            const eventName = field.type === 'checkbox' ? 'change' : 'input';
            field.addEventListener(eventName, persistCheckoutForm);
          });
        }

        function parseResponseJson(response) {
          return response.text().then(function (text) {
            try {
              return text ? JSON.parse(text) : {};
            } catch (error) {
              return { message: text || 'Resposta inválida do servidor.' };
            }
          });
        }

        function buildCheckoutPayload() {
          if (!state.cart.length) {
            throw new Error('Seu carrinho está vazio. Adicione produtos antes de continuar.');
          }

          if (!state.selectedShipping) {
            throw new Error('Selecione uma opção de frete antes de seguir para o pagamento.');
          }

          if (!checkoutFields.terms || !checkoutFields.terms.checked) {
            throw new Error('Você precisa aceitar os termos e a política de privacidade para continuar.');
          }

          console.log('[CheckoutValidation] Verificando regras de checkout');

          if (state.selectedShipping && String(state.selectedShipping.label).toLowerCase().includes('retirada')) {
            console.log('[PickupConfirmation] Frete é retirada, validando checkbox');
            if (!checkoutFields.pickupTerms || !checkoutFields.pickupTerms.checked) {
              throw new Error('Para retirada presencial, você precisa confirmar que está ciente de que deve nos contatar via WhatsApp após o pagamento.');
            }
          }

          const customer = {
            name: checkoutFields.name.value.trim(),
            email: checkoutFields.email.value.trim(),
            phone: checkoutFields.phone.value.trim(),
            cpf: onlyDigits(checkoutFields.cpf.value),
            newsletter: Boolean(checkoutFields.updates && checkoutFields.updates.checked)
          };

          const address = {
            cep: onlyDigits(checkoutFields.cep.value),
            street: checkoutFields.street.value.trim(),
            number: checkoutFields.number.value.trim(),
            complement: checkoutFields.complement.value.trim(),
            neighborhood: checkoutFields.neighborhood.value.trim(),
            city: checkoutFields.city.value.trim(),
            state: checkoutFields.state.value.trim().toUpperCase()
          };

          const requiredFields = [
            ['nome completo', customer.name],
            ['e-mail', customer.email],
            ['telefone / WhatsApp', customer.phone],
            ['CEP', address.cep],
            ['rua', address.street],
            ['número', address.number],
            ['bairro', address.neighborhood],
            ['cidade', address.city],
            ['estado', address.state]
          ];

          const missingField = requiredFields.find(function (entry) {
            return !entry[1];
          });

          if (missingField) {
            throw new Error(`Preencha o campo obrigatório: ${missingField[0]}.`);
          }

          const normalizedItems = state.cart.map(function (item) {
            const normalizedItem = normalizeCartItem(item);
            const quantity = normalizeQuantity(normalizedItem.quantity);
            const unitPrice = normalizeMoneyValue(normalizedItem.unitPrice);
            const lineTotal = Number((unitPrice * quantity).toFixed(2));
            const unitPriceCents = toCents(unitPrice);
            const lineTotalCents = toCents(lineTotal);

            return {
              name: normalizedItem.name,
              title: normalizedItem.name,
              slug: normalizedItem.slug,
              price: Number(unitPrice.toFixed(2)),
              price_cents: unitPriceCents,
              unit_price: Number(unitPrice.toFixed(2)),
              unit_price_cents: unitPriceCents,
              quantity: quantity,
              lineTotal: lineTotal,
              lineTotal_cents: lineTotalCents,
              color: normalizedItem.color,
              size: normalizedItem.size,
              image: normalizedItem.image
            };
          });

          const normalizedShipping = normalizeShippingOption(state.selectedShipping);
          const subtotal = Number(normalizedItems.reduce(function (total, item) {
            return total + item.lineTotal;
          }, 0).toFixed(2));
          const total = Number((subtotal + normalizeMoneyValue(normalizedShipping.price)).toFixed(2));

          const payload = {
            items: normalizedItems,
            customer,
            address,
            shipping: {
                id: normalizedShipping.id,
                label: normalizedShipping.label,
              price: Number(normalizeMoneyValue(normalizedShipping.price).toFixed(2)),
              price_cents: toCents(normalizedShipping.price),
              deadline: normalizedShipping.deadline
            },
            notes: checkoutFields.notes.value.trim(),
            subtotal,
            subtotal_cents: toCents(subtotal),
            total,
            total_cents: toCents(total),
            frontend_url: RIO_GROOVE_CONFIG.frontendUrl
          };;

            console.log('[CHECKOUT FRONTEND] Payload enviado', payload);
            return payload;
        }

        async function submitCheckout() {
          if (state.isCheckoutLoading) return;

          try {
            const checkoutEndpoint = RIO_GROOVE_CONFIG.checkoutEndpoint;
            const cart = buildCheckoutPayload();
            persistCheckoutForm();
            setCheckoutLoading(true, 'Iniciando checkout seguro com Mercado Pago...');

            const response = await fetch(checkoutEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(cart)
            });

            const data = await response.json();

            if (!response.ok) {
              const detail = Array.isArray(data.errors) ? data.errors.join(' ') : data.message;
              throw new Error(detail || 'Não foi possível iniciar o checkout.');
            }

            const redirectUrl =
              data.checkoutUrl ||
              data.init_point ||
              data.url;

            if (!redirectUrl) {
              throw new Error('O backend não retornou uma URL válida de redirecionamento do Mercado Pago.');
            }

            setCheckoutMessage('Redirecionando para o ambiente seguro do Mercado Pago...');
            window.location.href = redirectUrl;
          } catch (error) {
            setCheckoutLoading(false, error.message || 'Erro ao iniciar o checkout.');
          }
        }

        async function updateCartItemQuantity(index, nextQuantity) {
          const item = state.cart[index];
          if (!item) return;

          if (nextQuantity <= 0) {
            state.cart.splice(index, 1);
          } else {
            item.quantity = nextQuantity;
          }

          saveCart();

          if (onlyDigits(shippingCepInput && shippingCepInput.value).length === 8 && state.cart.length) {
            await calculateShipping({ silent: true, keepSelection: true });
          } else if (!state.cart.length) {
            state.shippingOptions = [];
            state.selectedShipping = null;
            saveSelectedShipping();
            renderShippingOptions();
          }

          renderCart();
          renderCheckoutReview();
        }

        function addToCart(card) {
          const selectedSize = card.querySelector('.size-box.selected');
          const quantityInput = card.querySelector('.quantity-input');
          const feedbackElement = card.querySelector('.product-feedback');
          const productName = card.dataset.name || 'Produto';
          const unitPrice = normalizeMoneyValue(card.dataset.price);
          const productImage = card.dataset.image || (card.querySelector('.product-main-img') ? card.querySelector('.product-main-img').src : '');
          const productColor = inferColorFromImage(productImage);
          const quantity = normalizeQuantity(quantityInput ? quantityInput.value : 1);
          const weight = Number(card.dataset.weight) || 0.35;
          const height = Number(card.dataset.height) || 5;
          const width = Number(card.dataset.width) || 30;
          const length = Number(card.dataset.length) || 25;

          if (!selectedSize) {
            setProductFeedback(feedbackElement, 'Selecione um tamanho antes de adicionar ao carrinho.', 'error');
            return;
          }

          if (!unitPrice || unitPrice <= 0) {
            setProductFeedback(feedbackElement, 'Não foi possível identificar o valor correto do produto.', 'error');
            return;
          }

          const itemKey = [productName, productColor, selectedSize.dataset.size].join('|');
          const existingItem = state.cart.find(function (item) {
            return item.key === itemKey;
          });

          if (existingItem) {
            existingItem.quantity = normalizeQuantity(existingItem.quantity + quantity);
            existingItem.unitPrice = normalizeMoneyValue(existingItem.unitPrice);
          } else {
            state.cart.push(normalizeCartItem({
              key: itemKey,
              slug: slugify(productName),
              name: productName,
              image: productImage,
              color: productColor,
              size: selectedSize.dataset.size,
              unitPrice: unitPrice,
              quantity: quantity,
              weight: weight,
              height: height,
              width: width,
              length: length
            }));
          }

          saveCart();
          renderCart();
          renderCheckoutReview();
          setProductFeedback(feedbackElement, 'Peça adicionada ao carrinho.');
        }

        function setupProductGallery(card) {
          const mainImage = card.querySelector('.product-main-img');
          const thumbnails = Array.from(card.querySelectorAll('.product-thumbnails img'));
          const sizeBoxes = Array.from(card.querySelectorAll('.size-box'));
          const addButton = card.querySelector('button.btn');

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
              addToCart(card);
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

        async function loadPublicConfig() {
          try {
            const response = await fetch(RIO_GROOVE_CONFIG.publicConfigEndpoint);
            const data = await parseResponseJson(response);
            if (response.ok) {
              state.publicConfig = data;
            }
          } catch (error) {
            console.warn('Configuração pública do backend indisponível.', error);
          }
        }

        window.__pixIntervals = window.__pixIntervals || [];
        function stopAllPolling() {
          window.__pixIntervals.forEach(clearInterval);
          window.__pixIntervals = [];
          if (typeof orderPollingInterval !== 'undefined' && orderPollingInterval) {
            clearInterval(orderPollingInterval);
            orderPollingInterval = null;
          }
        }

        let orderPollingInterval = null;
        let isRedirecting = false;
        let paymentFinalized = false;
        let isCheckingStatus = false;

        async function hydratePaymentStatusFromQuery() {
          if (paymentFinalized) {
            console.log('[PIX_UI] skipping render after finalized');
            stopAllPolling();
            return;
          }

          const url = new URL(window.location.href);
          const paymentStatus = url.searchParams.get('payment');
          const externalReference = url.searchParams.get('external_reference');

          if (!paymentStatus && !externalReference) return;

          console.log('[MP Redirect] Redirect Mercado Pago detectado', { paymentStatus, externalReference });

          showSection('pedido-status', false);

          if (paymentStatusPanel) {
            const initialClass = (paymentStatus === 'approved' || paymentStatus === 'success') ? 'success' : (paymentStatus || 'pending');
            paymentStatusPanel.className = `payment-status-panel ${initialClass}`;
          }
          if (paymentStatusTitle && (paymentStatus === 'approved' || paymentStatus === 'success')) {
            paymentStatusTitle.innerHTML = 'PAGAMENTO <span class="text-red">APROVADO</span>';
          }
          if (paymentStatusBadge && (paymentStatus === 'approved' || paymentStatus === 'success')) {
            paymentStatusBadge.className = 'payment-badge success';
            paymentStatusBadge.textContent = 'Pagamento aprovado';
          }
          if (paymentStatusCopy && paymentStatus !== 'approved' && paymentStatus !== 'success') {
            paymentStatusCopy.textContent = 'Consultando os dados mais recentes do seu pedido no backend da Rio Groove Store...';
          }
          if (paymentMeta) {
            paymentMeta.innerHTML = '';
          }

          if (!externalReference) {
            if (paymentStatusCopy) {
              paymentStatusCopy.textContent = 'Não foi possível localizar a referência do pedido no retorno do pagamento.';
            }
            if (paymentStatusList) {
              paymentStatusList.innerHTML = '<li>Entre em contato com a loja para confirmar o pagamento manualmente.</li>';
            }
            return;
          }

          async function checkStatus() {
            if (paymentFinalized) {
              console.log('[PIX_UI] skipping render after finalized');
              stopAllPolling();
              return;
            }
            if (isRedirecting) return;
            if (isCheckingStatus) return;
            isCheckingStatus = true;
            
            try {
              console.log('[FrontendPolling] Buscando status atualizado do pedido', externalReference);
              const response = await fetch(`${RIO_GROOVE_CONFIG.ordersEndpoint}/${encodeURIComponent(externalReference)}`, { cache: 'no-store' });
              
              if (paymentFinalized) {
                console.log('[PIX_UI] skipping render after finalized');
                stopAllPolling();
                return;
              }
              
              const data = await parseResponseJson(response);

              if (paymentFinalized) {
                console.log('[PIX_UI] skipping render after finalized');
                stopAllPolling();
                return;
              }

              if (!response.ok || !data.order) {
                throw new Error(data.message || 'Pedido não encontrado no backend.');
              }

              const order = data.order;
              console.log('[PaymentStatus] Dados do pedido recebidos:', order.payment_status);

              const mpStatus = order.mercado_pago_status || '';
              const internalStatus = order.payment_status || '';
              
              console.log('[PIX_UI] status:', internalStatus || mpStatus);
              
              let uiStatus = paymentStatus || 'pending';
              let uiBadgeText = 'Atualizando...';

              if (internalStatus === 'paid' || mpStatus === 'approved' || paymentStatus === 'approved' || paymentStatus === 'success') {
                uiStatus = 'success';
                uiBadgeText = 'Pagamento aprovado';
                
                if (!paymentFinalized) {
                  console.log('[PIX_UI] payment finalized');
                  paymentFinalized = true;
                  stopAllPolling();
                }
                
                if (!isRedirecting && paymentStatus !== 'approved' && paymentStatus !== 'success') {
                  console.log('[PIX_UI] approved detectado');
                  console.log('[PIX_UI] atualizando state');
                  state.paymentStatus = 'approved';
                  state.uiStatus = 'success';
                  
                  console.log('[PIX_UI] desmontando PIX');
                  const pixContainer = document.getElementById('pix-container');
                  if (pixContainer) pixContainer.style.display = 'none';
                  const mpIframe = document.querySelector('iframe');
                  if (mpIframe) mpIframe.style.display = 'none';
                  
                  console.log('[PIX_UI] redirect iniciado');
                  isRedirecting = true;
                  paymentFinalized = true;
                  
                  stopAllPolling();
                  
                  window.location.replace(`/?payment=approved&external_reference=${externalReference}#pedido-status`);
                  return;
                }
              } else if (mpStatus === 'in_process') {
                uiStatus = 'pending';
                uiBadgeText = 'Pagamento em análise';
              } else if (internalStatus === 'pending') {
                uiStatus = 'pending';
                uiBadgeText = 'Pagamento pendente';
              } else if (internalStatus === 'failed' || mpStatus === 'rejected' || mpStatus === 'cancelled') {
                uiStatus = 'failure';
                uiBadgeText = 'Pagamento não aprovado';
              } else if (paymentStatus === 'failure') {
                 uiStatus = 'failure';
                 uiBadgeText = 'Pagamento não concluído';
              }

              if (uiStatus === 'success' && state.cart.length > 0) {
                console.log('[CheckoutSuccess] Pagamento aprovado detectado');
                console.log('[CartCleanup] Iniciando limpeza do carrinho');
                state.cart = [];
                state.selectedShipping = null;
                saveStorage(STORAGE_KEYS.cart, []);
                saveStorage(STORAGE_KEYS.shipping, null);
                window.localStorage.removeItem(STORAGE_KEYS.cart);
                window.localStorage.removeItem(STORAGE_KEYS.shipping);
                window.sessionStorage.removeItem(STORAGE_KEYS.cart);
                window.sessionStorage.removeItem(STORAGE_KEYS.shipping);
                updateCartBadge();
                renderCart();
                renderCheckoutReview();
                console.log('[CartCleanup] Carrinho limpo. LocalStorage removido. Estado resetado.');
              }

              if (paymentStatusPanel) {
                paymentStatusPanel.className = `payment-status-panel ${uiStatus}`;
              }
              
              if (paymentStatusBadge) {
                paymentStatusBadge.className = `payment-badge ${uiStatus}`;
                paymentStatusBadge.textContent = uiBadgeText;
              }

              if (paymentStatusTitle) {
                paymentStatusTitle.innerHTML = uiStatus === 'success'
                  ? 'PAGAMENTO <span class="text-red">APROVADO</span>'
                  : uiStatus === 'pending'
                    ? 'PAGAMENTO EM <span class="text-red">ANÁLISE</span>'
                    : 'PAGAMENTO <span class="text-red">NÃO APROVADO</span>';
              }

              if (paymentOrderNumber) {
                paymentOrderNumber.style.display = 'block';
                paymentOrderNumber.textContent = `Pedido: ${order.order_number || '-'}`;
              }

              if (paymentStatusCopy) {
                paymentStatusCopy.textContent = uiStatus === 'success' 
                   ? 'Recebemos o seu pagamento! Seu pedido já está sendo processado pela nossa equipe.' 
                   : uiStatus === 'pending'
                     ? 'Estamos aguardando a confirmação do pagamento. Se você pagou via PIX, a atualização será automática em alguns segundos.'
                     : 'Houve um problema com o seu pagamento. Por favor, tente novamente ou entre em contato conosco.';
              }

              if (paymentStatusList) {
                paymentStatusList.innerHTML = [
                  `Status: <strong>${uiBadgeText}</strong>`,
                  `Total: ${formatCurrency(order.total_amount || order.total || 0)}`,
                  `Entrega: ${order.shipping_method}`
                ].map(function (item) {
                  return `<li>${item}</li>`;
                }).join('');
              }

              const checkoutActions = document.querySelector('#pedido-status .checkout-actions');
              if (checkoutActions) {
                 if (uiStatus === 'success') {
                    const isPickup = order.shipping_method && /retirada presencial/i.test(order.shipping_method);
                    const whatsappMsg = isPickup ? `Olá, meu pedido ${order.order_number} foi aprovado! Gostaria de organizar minha retirada presencial.` : `Olá, meu pedido ${order.order_number} foi aprovado!`;
                    const encodedMsg = encodeURIComponent(whatsappMsg);
                    checkoutActions.innerHTML = `
                      <a href="https://wa.me/5521964456789?text=${encodedMsg}" class="btn btn-red" target="_blank" rel="noopener noreferrer">Fale com a Rio Groove (WhatsApp)</a>
                      <a href="#colecoes" class="btn">Voltar para a loja</a>
                    `;
                 } else if (uiStatus === 'pending') {
                    checkoutActions.innerHTML = `
                      <a href="https://wa.me/5521964456789?text=Olá, estou com dúvidas no pagamento do pedido ${order.order_number || ''}" class="btn" target="_blank" rel="noopener noreferrer">Falar com Suporte (WhatsApp)</a>
                      <a href="#colecoes" class="btn">Continuar navegando</a>
                    `;
                 } else {
                    checkoutActions.innerHTML = `
                      <a href="#carrinho" class="btn btn-red">Tentar pagar novamente</a>
                      <a href="https://wa.me/5521964456789?text=Olá, tive um erro no pagamento do pedido ${order.order_number || ''}" class="btn" target="_blank" rel="noopener noreferrer">Falar com Suporte (WhatsApp)</a>
                    `;
                 }
              }

              if (paymentStatusNote) {
                if (uiStatus === 'success') {
                  if (order.shipping_method && /retirada presencial/i.test(order.shipping_method)) {
                    paymentStatusNote.innerHTML = '<strong style="color: #ff3c30;">⚠️ IMPORTANTE: Clique no botão do WhatsApp acima para combinar o local, data e horário da sua retirada presencial.</strong>';
                  } else {
                    paymentStatusNote.textContent = 'Você receberá as atualizações de rastreio por e-mail e WhatsApp.';
                  }
                } else if (uiStatus === 'pending') {
                  paymentStatusNote.innerHTML = 'A tela será atualizada automaticamente assim que o pagamento for confirmado... <span class="loading-spinner" style="display: inline-block; width: 12px; height: 12px; border-width: 2px;"></span>';
                } else {
                  paymentStatusNote.textContent = 'Se precisar de suporte, clique no botão do WhatsApp acima.';
                }
              }

              if (paymentMeta) {
                paymentMeta.innerHTML = ''; // Remover informações técnicas
              }

              if (uiStatus === 'success' || uiStatus === 'failure') {
                console.log('[PIX_UI] payment finalized');
                paymentFinalized = true;
                stopAllPolling();

                if (window.location.search.includes('payment=')) {
                  console.log('[PIX_UI] cleaning approved URL state');
                  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                }

                setTimeout(function () {
                  paymentFinalized = false;
                }, 100);
              }

            } catch (error) {
              console.error('[FrontendPolling] Erro:', error);
            } finally {
              isCheckingStatus = false;
            }
          }

          // Fetch initially
          await checkStatus();

          // Configure polling for pending status
          if (!isRedirecting && !paymentFinalized) {
            console.log('[PIX_UI] polling iniciado');
            const intervalId = setInterval(checkStatus, 5000);
            window.__pixIntervals.push(intervalId);
            orderPollingInterval = intervalId;
          }
        }

        productCards.forEach(setupProductGallery);

        if (cartItemsElement) {
          cartItemsElement.addEventListener('click', async function (event) {
            const removeButton = event.target.closest('[data-remove-index]');
            if (removeButton) {
              const index = Number(removeButton.dataset.removeIndex);
              await updateCartItemQuantity(index, 0);
              return;
            }

            const quantityButton = event.target.closest('.cart-qty-control button');
            if (!quantityButton) return;

            const control = quantityButton.closest('.cart-qty-control');
            const index = Number(control.dataset.index);
            const action = quantityButton.dataset.action;
            const currentItem = state.cart[index];
            if (!currentItem) return;

            await updateCartItemQuantity(index, action === 'increase' ? currentItem.quantity + 1 : currentItem.quantity - 1);
          });
        }

        if (shippingResultsElement) {
          shippingResultsElement.addEventListener('change', function (event) {
            if (event.target.name === 'shipping-option') {
              syncShippingSelection(event.target.value);
            }
          });
        }

        if (calculateShippingButton) {
          calculateShippingButton.addEventListener('click', async function () {
            await calculateShipping({ keepSelection: true });
          });
        }

        if (shippingCepInput) {
          shippingCepInput.addEventListener('input', function () {
            const digits = onlyDigits(shippingCepInput.value).slice(0, 8);
            shippingCepInput.value = digits.replace(/(\d{5})(\d{0,3})/, function (_, first, second) {
              return second ? `${first}-${second}` : first;
            });
          });
        }

        if (checkoutFields.cep) {
          checkoutFields.cep.addEventListener('input', function () {
            const digits = onlyDigits(checkoutFields.cep.value).slice(0, 8);
            checkoutFields.cep.value = digits.replace(/(\d{5})(\d{0,3})/, function (_, first, second) {
              return second ? `${first}-${second}` : first;
            });
            if (shippingCepInput && !shippingCepInput.value) {
              shippingCepInput.value = checkoutFields.cep.value;
            }
            persistCheckoutForm();
          });
        }

        if (checkoutFields.cpf) {
          checkoutFields.cpf.addEventListener('input', function () {
            const digits = onlyDigits(checkoutFields.cpf.value).slice(0, 11);
            checkoutFields.cpf.value = digits
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            persistCheckoutForm();
          });
        }

        if (checkoutFields.phone) {
          checkoutFields.phone.addEventListener('input', function () {
            const digits = onlyDigits(checkoutFields.phone.value).slice(0, 11);
            checkoutFields.phone.value = digits
              .replace(/^(\d{2})(\d)/, '($1) $2')
              .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
            persistCheckoutForm();
          });
        }

        if (checkoutFields.state) {
          checkoutFields.state.addEventListener('input', function () {
            checkoutFields.state.value = checkoutFields.state.value.toUpperCase().slice(0, 2);
            persistCheckoutForm();
          });
        }

        bindCheckoutFormPersistence();
        restoreCheckoutForm();

        if (shippingCepInput && !shippingCepInput.value && checkoutFields.cep && checkoutFields.cep.value) {
          shippingCepInput.value = checkoutFields.cep.value;
        }

        if (cartContinueButton) {
          cartContinueButton.addEventListener('click', function () {
            if (!state.cart.length) {
              setShippingStatus('Seu carrinho está vazio. Adicione produtos antes de avançar.', 'error');
              return;
            }

            if (!state.selectedShipping) {
              setShippingStatus('Calcule e selecione uma opção de frete antes de continuar.', 'error');
              return;
            }

            setCheckoutMessage('Confira seus dados e clique em “Ir para pagamento” para abrir o Mercado Pago.');
            showSection('checkout', true);
          });
        }

        if (checkoutSubmitButton) {
          checkoutSubmitButton.addEventListener('click', submitCheckout);
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

        window.addEventListener('hashchange', function () {
          showSection(window.location.hash, false);
        });

        renderCart();
        renderCheckoutReview();
        renderShippingOptions();
        loadPublicConfig();
        hydratePaymentStatusFromQuery();

        (async function () {
          if (shippingCepInput && onlyDigits(shippingCepInput.value).length === 8 && state.cart.length) {
            await calculateShipping({ silent: true, keepSelection: true });
          }
        })();

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.get('payment')) {
          showSection(window.location.hash, false);
        }
      });
    