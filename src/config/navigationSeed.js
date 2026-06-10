/**
 * Menu padrão Rio Groove — espelha menuConfig.ts da storefront v2.
 */
const catalogUrl = (genero, segmento) => {
  const params = new URLSearchParams({ genero });
  if (segmento) params.set('segmento', segmento);
  return `/products?${params.toString()}`;
};

const categoryUrl = (categoria) => `/products?categoria=${categoria}`;

export const NAVIGATION_SEED_ITEMS = [
  {
    id: '1',
    label: 'COLEÇÕES',
    link: '/collections',
    hasSubmenu: true,
    subItems: [
      { id: '1-0', label: 'Malandragem & Rua', link: '/collections/malandragem' },
      { id: '1-1', label: 'Samba & Cultura Brasileira', link: '/collections/samba' },
      { id: '1-2', label: 'Rainhas & Poder Feminino', link: '/collections/rainhas' },
      { id: '1-3', label: 'Ancestralidade Brasileira', link: '/collections/ancestralidade' },
      { id: '1-4', label: 'Luz & Proteção', link: '/collections/Luz' },
      { id: '1-5', label: 'Ver Todas', link: '/collections' },
    ],
    editorialText: 'Vestir o que você carrega é mais que estilo. É proteção, identidade e propósito.',
    editorialCtaText: 'Explorar coleções →',
    editorialCtaLink: '/collections',
    editorialImage: 'https://images.unsplash.com/photo-1505381861730-a8c95029e2fa?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    label: 'MASCULINO',
    link: catalogUrl('masculino'),
    hasSubmenu: true,
    subItems: [
      { id: '2-0', label: 'Regatas', link: catalogUrl('masculino', 'regatas') },
      { id: '2-1', label: 'Oversized', link: catalogUrl('masculino', 'oversized') },
      { id: '2-2', label: 'Tradicional', link: catalogUrl('masculino', 'tradicional') },
      { id: '2-3', label: 'Ver Tudo', link: catalogUrl('masculino') },
    ],
    editorialText: 'O autêntico streetwear carioca.',
    editorialCtaText: 'Explorar linha masculina →',
    editorialCtaLink: catalogUrl('masculino'),
  },
  {
    id: '3',
    label: 'FEMININO',
    link: catalogUrl('feminino'),
    hasSubmenu: true,
    subItems: [
      { id: '3-0', label: 'Baby Look', link: catalogUrl('feminino', 'baby-look') },
      { id: '3-1', label: 'Oversized Feminina', link: catalogUrl('feminino', 'oversized') },
      { id: '3-2', label: 'Cropped', link: catalogUrl('feminino', 'cropped') },
      { id: '3-3', label: 'Tops', link: catalogUrl('feminino', 'tops') },
      { id: '3-4', label: 'Ver Tudo', link: catalogUrl('feminino') },
    ],
    editorialText: 'Rainhas & Poder Feminino. Vista sua essência.',
    editorialCtaText: 'Explorar linha feminina →',
    editorialCtaLink: catalogUrl('feminino'),
  },
  {
    id: '4',
    label: 'ACESSÓRIOS',
    link: categoryUrl('acessorios'),
    hasSubmenu: true,
    subItems: [
      { id: '4-0', label: 'Bonés', link: categoryUrl('bone') },
      { id: '4-1', label: 'Shoulder Bags', link: categoryUrl('acessorio') },
      { id: '4-2', label: 'Canecas', link: categoryUrl('caneca') },
      { id: '4-3', label: 'Chaveiros', link: categoryUrl('acessorio') },
      { id: '4-4', label: 'Ver Tudo', link: categoryUrl('acessorios') },
    ],
    editorialText: 'Detalhes que fazem a diferença no corre.',
    editorialCtaText: 'Ver acessórios →',
    editorialCtaLink: categoryUrl('acessorios'),
  },
  {
    id: '5',
    label: 'MOVIMENTOS',
    link: '/movimentos',
    hasSubmenu: true,
    subItems: [
      { id: '5-0', label: 'Manifesto', link: '/movimentos/manifesto' },
      { id: '5-1', label: 'Editorial', link: '/movimentos/editorial' },
      { id: '5-2', label: 'Eventos', link: '/movimentos/eventos' },
      { id: '5-3', label: 'Artistas', link: '/movimentos/artistas' },
    ],
    editorialText: 'A cultura vive aqui. Música, arte e resistência.',
    editorialCtaText: 'Conheça o movimento →',
    editorialCtaLink: '/movimentos',
  },
  {
    id: '6',
    label: 'CONTATO',
    link: '/contato',
    hasSubmenu: false,
    subItems: [],
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: '/contato',
  },
];
