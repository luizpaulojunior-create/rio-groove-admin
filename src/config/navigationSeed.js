/**
 * Menu padrão Rio Groove — espelha menuConfig.ts da storefront v2.
 */
const catalogUrl = (genero, segmento) => {
  const params = new URLSearchParams({ genero });
  if (segmento) params.set('segmento', segmento);
  return `/products?${params.toString()}`;
};

const categoryUrl = (categoria) => `/products?categoria=${categoria}`;

const DEFAULT_EDITORIAL_IMAGE =
  'https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=800&auto=format&fit=crop';

export const NAVIGATION_SEED_ITEMS = [
  {
    id: '1',
    label: 'COLEÇÕES',
    link: '/collections',
    hasSubmenu: true,
    subItems: [
      { id: '1-0', label: 'Copa Rio Groove', link: '/collections/copa-do-mundo-rio-groove' },
      { id: '1-1', label: 'Malandragem & Rua', link: '/collections/malandragem' },
      { id: '1-2', label: 'Samba & Cultura Brasileira', link: '/collections/samba' },
      { id: '1-3', label: 'Rainhas & Poder Feminino', link: '/collections/rainhas' },
      { id: '1-4', label: 'Ancestralidade Brasileira', link: '/collections/ancestralidade' },
      { id: '1-5', label: 'Luz & Proteção', link: '/collections/Luz' },
      { id: '1-6', label: 'Ver Todas', link: '/collections' },
    ],
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: '/collections',
    editorialImage: DEFAULT_EDITORIAL_IMAGE,
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
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: catalogUrl('masculino'),
    editorialImage: DEFAULT_EDITORIAL_IMAGE,
  },
  {
    id: '3',
    label: 'FEMININO',
    link: catalogUrl('feminino'),
    hasSubmenu: true,
    subItems: [
      { id: '3-1', label: 'Cropped Oversized', link: catalogUrl('feminino', 'cropped') },
      { id: '3-4', label: 'Ver Tudo', link: catalogUrl('feminino') },
    ],
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: catalogUrl('feminino'),
    editorialImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop',
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
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: categoryUrl('acessorios'),
    editorialImage: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=800&auto=format&fit=crop',
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
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: '/movimentos',
    editorialImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '6',
    label: 'PERSONALIZADOS',
    link: '/personalizados',
    hasSubmenu: false,
    subItems: [],
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: '/personalizados',
  },
  {
    id: '7',
    label: 'CONTATO',
    link: '/contato',
    hasSubmenu: false,
    subItems: [],
    editorialText: '',
    editorialCtaText: '',
    editorialCtaLink: '/contato',
  },
];
