# Auditoria da Arquitetura da Storefront (Rio Groove)

Com base na leitura direta dos arquivos do diretório `../rio-groove-cloudflare-final-corrigido`, aqui está o mapeamento da arquitetura real do frontend (Vanilla JS / SPA Híbrido).

## 1. Origem dos Dados
- **Endpoint Principal:** `https://rio-groove-backend.onrender.com/api` (definido no arquivo `js/api.js`).
- **Fetch API:** As chamadas para buscar produtos e coleções ocorrem no arquivo `js/products.js` (ex: `/products?active=true`, `/collections`).
- **Validação e Checkout:** O sistema consulta o estoque em tempo real direto da API (`/api/products/${slug}`) antes de adicionar ao carrinho e ao prosseguir para pagamento. O payload final é enviado para um endpoint de checkout que devolve a URL do Mercado Pago.

## 2. Estrutura dos Arquivos JS (`/js/`)
A lógica dinâmica foi parcialmente modularizada (ECMAScript Modules):
- **`api.js`**: Exporta a constante global da API.
- **`products.js`**: Funções de comunicação HTTP para buscar produtos, coleções e detalhes por slug.
- **`renderProducts.js`**: Centraliza o "template" HTML dos cards de produto e injeta as listas no DOM (`container.innerHTML`). Delega eventos de clique para navegação SPA e galeria de fotos.
- **`cart.js`**: Gerencia os dados do carrinho via `localStorage` (chave `rioGrooveCart`). Também é responsável por construir (injetar via DOM) e atualizar o botão flutuante e o popup ("Item adicionado") dinamicamente.
- **`app.js`**: Ponto de entrada dinâmico (`type="module"`). Controla o roteamento Single Page Application (SPA). Escuta o evento `routechange` e a URL atual (`window.location.pathname`) para carregar a tela inicial, tela de categoria ou detalhe do produto via requisições assíncronas.

## 3. O Monolito `index.html` e Scripts Inline
- O `index.html` possui mais de 3.200 linhas.
- **CSS Inline:** Grande parte do estilo global e dos componentes está dentro da tag `<style>` no `<head>`.
- **Script Inline Gigante:** Existe um bloco considerável de lógica não-modularizada injetada diretamente no fim do HTML.
  - Gerencia o **estado global do Carrinho** (renderização no sidebar, atualização de quantidade, totalizador).
  - Lógica de **Cálculo de Frete**.
  - **Formulário de Checkout** (validação, persistência de dados em localStorage e montagem do Payload final).
  - Atualização do DOM para abas/modais e feedback do status do pagamento via querystring (`?payment=success`).

## 4. Renderização das Imagens
- Gerenciada no `js/renderProducts.js`.
- O código mapeia o array `product.product_images`. Caso exista, ordena pelo campo `sort_order` e extrai `image_url`. Fallback para a string fixa `https://placehold.co/...` se a imagem não existir.
- As miniaturas são geradas em HTML e marcadas como `.is-active`. Um script posterior (`setupProductGallery`) atrela os eventos de clique para alterar o atributo `src` da imagem principal.

## 5. Estrutura dos Cards de Produto
Gerado via template string, a estrutura base (DOM) de um card segue a árvore abaixo:
```html
<div class="product-card" data-name="..." data-price="..." data-slug="...">
  <!-- Imagem Principal (Clicável leva ao produto) -->
  <a href="/product/..." class="product-image-wrapper">
    <img src="..." class="product-main-img">
  </a>
  
  <!-- Miniaturas (Galeria) -->
  <div class="product-thumbnails">
    <img src="..." class="is-active">
  </div>
  
  <div class="product-info">
    <!-- Título e Preço formatado com Intl -->
    <h3 class="product-title">...</h3>
    <p class="product-price">R$ 0,00</p>
    
    <!-- Seleção de Tamanhos e Cores -->
    <div class="product-variants">
      <div class="size-selector">
        <div class="size-box" data-size="P">P</div>
        ...
      </div>
    </div>
    
    <!-- Input de Quantidade e Botão -->
    <div class="quantity-row">...</div>
    <p class="product-feedback"></p> <!-- Área para erros (ex: Sem estoque) -->
    <button class="btn">Adicionar ao carrinho</button>
  </div>
</div>
```

## Diagnóstico para Modernização Progressiva
1. **Separação de Preocupações:** O HTML principal está excessivamente acoplado à regra de negócios (checkout/frete) e ao estilo. A prioridade na modernização deve ser remover o CSS inline para um arquivo de estilo (ou usar Tailwind, que já parece configurado no admin) e extrair o JS do `index.html` para módulos no `/js/`.
2. **Sistema Híbrido:** O site mistura requisições de página tradicional com um sistema SPA "caseiro" em `app.js` (interceptando clicks e fazendo `history.pushState`). Isso pode causar bugs de evento fantasma (event listeners duplicados) quando a mesma rota for renderizada várias vezes.
3. **Consolidação do Carrinho:** A lógica do carrinho está fragmentada (UI e contagem no `cart.js`, mas o gerenciamento real dos itens e renderização de preços no checkout mora dentro do HTML).

Este mapeamento fornece a base exata para iniciarmos a limpeza e refatoração incremental do frontend.