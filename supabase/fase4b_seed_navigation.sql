-- Fase 4B — seed navigation (executar após login admin OU via SQL Editor)
-- Espelha menuConfig.ts da storefront v2 em formato CMS admin

INSERT INTO public.storefront_sections (
  section_key,
  type,
  content,
  active,
  order_index
)
SELECT
  'navigation',
  'navigation_config',
  $json${
    "items": [
      {
        "id": "1",
        "label": "NOVA COLEÇÃO",
        "link": "/collections/novidades",
        "hasSubmenu": false,
        "subItems": [],
        "editorialText": "",
        "editorialCtaText": "",
        "editorialCtaLink": "/collections/novidades"
      },
      {
        "id": "2",
        "label": "MASCULINO",
        "link": "/collections/masculino",
        "hasSubmenu": true,
        "subItems": [
          { "id": "2-0", "label": "Camisetas", "link": "/collections/masculino/camisetas" },
          { "id": "2-1", "label": "Oversized", "link": "/collections/masculino/oversized" },
          { "id": "2-2", "label": "Tradicional", "link": "/collections/masculino/tradicional" },
          { "id": "2-3", "label": "Regatas", "link": "/collections/masculino/regatas" },
          { "id": "2-4", "label": "Shorts", "link": "/collections/masculino/shorts" },
          { "id": "2-5", "label": "Ver Tudo", "link": "/collections/masculino" }
        ],
        "editorialText": "O autêntico streetwear carioca.",
        "editorialCtaText": "Explorar linha masculina →",
        "editorialCtaLink": "/collections/masculino"
      },
      {
        "id": "3",
        "label": "FEMININO",
        "link": "/collections/feminino",
        "hasSubmenu": true,
        "subItems": [
          { "id": "3-0", "label": "Baby Look", "link": "/collections/feminino/baby-look" },
          { "id": "3-1", "label": "Oversized Feminina", "link": "/collections/feminino/oversized" },
          { "id": "3-2", "label": "Cropped", "link": "/collections/feminino/cropped" },
          { "id": "3-3", "label": "Tops", "link": "/collections/feminino/tops" },
          { "id": "3-4", "label": "Ver Tudo", "link": "/collections/feminino" }
        ],
        "editorialText": "Rainhas & Poder Feminino. Vista sua essência.",
        "editorialCtaText": "Explorar linha feminina →",
        "editorialCtaLink": "/collections/feminino"
      },
      {
        "id": "4",
        "label": "OVERSIZED",
        "link": "/collections/oversized",
        "hasSubmenu": true,
        "subItems": [
          { "id": "4-0", "label": "Streetwear", "link": "/collections/oversized/streetwear" },
          { "id": "4-1", "label": "Premium", "link": "/collections/oversized/premium" },
          { "id": "4-2", "label": "Essentials", "link": "/collections/oversized/essentials" },
          { "id": "4-3", "label": "Ver Tudo", "link": "/collections/oversized" }
        ],
        "editorialText": "Conforto e presença marcante.",
        "editorialCtaText": "Ver coleção oversized →",
        "editorialCtaLink": "/collections/oversized"
      },
      {
        "id": "5",
        "label": "ACESSÓRIOS",
        "link": "/collections/acessorios",
        "hasSubmenu": true,
        "subItems": [
          { "id": "5-0", "label": "Bonés", "link": "/collections/acessorios/bones" },
          { "id": "5-1", "label": "Shoulder Bags", "link": "/collections/acessorios/shoulder-bags" },
          { "id": "5-2", "label": "Canecas", "link": "/collections/acessorios/canecas" },
          { "id": "5-3", "label": "Chaveiros", "link": "/collections/acessorios/chaveiros" },
          { "id": "5-4", "label": "Ver Tudo", "link": "/collections/acessorios" }
        ],
        "editorialText": "Detalhes que fazem a diferença no corre.",
        "editorialCtaText": "Ver acessórios →",
        "editorialCtaLink": "/collections/acessorios"
      },
      {
        "id": "6",
        "label": "COLEÇÕES",
        "link": "/collections",
        "hasSubmenu": true,
        "subItems": [
          { "id": "6-0", "label": "Luz & Proteção", "link": "/collections/luz-e-protecao" },
          { "id": "6-1", "label": "Ancestralidade Brasileira", "link": "/collections/ancestralidade-brasileira" },
          { "id": "6-2", "label": "Rainhas & Poder Feminino", "link": "/collections/rainhas-e-poder-feminino" },
          { "id": "6-3", "label": "Malandragem & Rua", "link": "/collections/malandragem-e-rua" },
          { "id": "6-4", "label": "Samba & Cultura Brasileira", "link": "/collections/samba-e-cultura-brasileira" },
          { "id": "6-5", "label": "Ver Todas", "link": "/collections" }
        ],
        "editorialText": "Vestir o que você carrega é mais que estilo. É proteção, identidade e propósito.",
        "editorialCtaText": "Explorar coleções →",
        "editorialCtaLink": "/collections"
      },
      {
        "id": "7",
        "label": "MOVIMENTOS",
        "link": "/movimentos",
        "hasSubmenu": true,
        "subItems": [
          { "id": "7-0", "label": "Manifesto", "link": "/movimentos/manifesto" },
          { "id": "7-1", "label": "Editorial", "link": "/movimentos/editorial" },
          { "id": "7-2", "label": "Eventos", "link": "/movimentos/eventos" },
          { "id": "7-3", "label": "Artistas", "link": "/movimentos/artistas" },
          { "id": "7-4", "label": "Contato", "link": "/contact" }
        ],
        "editorialText": "A cultura vive aqui. Música, arte e resistência.",
        "editorialCtaText": "Conheça o movimento →",
        "editorialCtaLink": "/movimentos"
      }
    ]
  }$json$::jsonb,
  true,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM public.storefront_sections WHERE section_key = 'navigation'
);
