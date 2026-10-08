const normalizeLabel = (value = '') =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getMeaningfulTranslatedValue = (source, language) => {
  if (!source) return null;
  const translated = source?.[language];
  const english = source?.en;

  if (!translated) return null;
  if (language === 'en') return translated;
  if (normalizeLabel(translated) === normalizeLabel(english)) return null;

  return translated;
};

const EXACT_CATEGORY_TRANSLATIONS = {
  fragrance: {
    ar: 'العطور',
    fr: 'Parfums',
    ru: 'Парфюмерия',
    zh: '香氛',
    es: 'Fragancias',
    ja: 'フレグランス',
    pt: 'Fragrâncias',
    it: 'Fragranze',
    de: 'Düfte',
  },
  'jewellery and accessories': {
    ar: 'المجوهرات والإكسسوارات',
    fr: 'Bijoux et accessoires',
    ru: 'Ювелирные изделия и аксессуары',
    zh: '珠宝与配饰',
    es: 'Joyería y accesorios',
    ja: 'ジュエリー＆アクセサリー',
    pt: 'Joias e acessórios',
    it: 'Gioielli e accessori',
    de: 'Schmuck und Accessoires',
  },
  'customize sandals': {
    ar: 'الصنادل المخصصة',
    fr: 'Sandales personnalisees',
    ru: 'Индивидуальные сандалии',
    zh: '定制凉鞋',
    es: 'Sandalias personalizadas',
    ja: 'カスタムサンダル',
    pt: 'Sandalias personalizadas',
    it: 'Sandali personalizzati',
    de: 'Individuelle Sandalen',
  },
  'design bikni swimwear': {
    ar: 'تصميم ملابس السباحة البيكيني',
    fr: 'Maillots de bain bikini design',
    ru: 'Дизайнерские купальники-бикини',
    zh: '设计款比基尼泳装',
    es: 'Bikinis de diseno',
    ja: 'デザインビキニ水着',
    pt: 'Moda praia biquini de design',
    it: 'Costumi bikini di design',
    de: 'Designer-Bikini-Mode',
  },
  dresses: {
    ar: 'الفساتين',
    fr: 'Robes',
    ru: 'Платья',
    zh: '连衣裙',
    es: 'Vestidos',
    ja: 'ドレス',
    pt: 'Vestidos',
    it: 'Abiti',
    de: 'Kleider',
  },
  'fitness yoga pilate': {
    ar: 'اللياقة البدنية واليوغا والبيلاتس',
    fr: 'Fitness, yoga et pilates',
    ru: 'Фитнес, йога и пилатес',
    zh: '健身、瑜伽和普拉提',
    es: 'Fitness, yoga y pilates',
    ja: 'フィットネス・ヨガ・ピラティス',
    pt: 'Fitness, yoga e pilates',
    it: 'Fitness, yoga e pilates',
    de: 'Fitness, Yoga und Pilates',
  },
  'ponytail hair': {
    ar: 'شعر ذيل الحصان',
    fr: 'Queues de cheval',
    ru: 'Волосы для хвоста',
    zh: '马尾发',
    es: 'Cabello para coleta',
    ja: 'ポニーテールヘア',
    pt: 'Cabelo para rabo de cavalo',
    it: 'Capelli per coda di cavallo',
    de: 'Pferdeschwanz-Haar',
  },
  abayas: {
    ar: 'العبايات',
    fr: 'Abayas',
    ru: 'Абая',
    zh: '长袍',
    es: 'Abayas',
    ja: 'アバヤ',
    pt: 'Abayas',
    it: 'Abaya',
    de: 'Abayas',
  },
  'vase and natural sand candle': {
    ar: 'مزهرية وشمعة رملية طبيعية',
    fr: 'Vase et bougie en sable naturel',
    ru: 'Ваза и свеча из натурального песка',
    zh: '花瓶与天然沙蜡烛',
    es: 'Jarron y vela de arena natural',
    ja: '花瓶とナチュラルサンドキャンドル',
    pt: 'Vaso e vela de areia natural',
    it: 'Vaso e candela di sabbia naturale',
    de: 'Vase und Natur-Sandkerze',
  },
};

const getExactCategoryTranslation = (englishName, language) => {
  if (language === 'en') return englishName;
  const normalized = normalizeLabel(englishName);
  return EXACT_CATEGORY_TRANSLATIONS[normalized]?.[language] || null;
};

export const getCategoryLabel = (category, language) =>
  getMeaningfulTranslatedValue(category?.name, language) ||
  getMeaningfulTranslatedValue(category?.nameInLanguage, language) ||
  getExactCategoryTranslation(category?.name?.en, language) ||
  category?.name?.en ||
  category?.nameInLanguage?.en ||
  'Unnamed Category';
