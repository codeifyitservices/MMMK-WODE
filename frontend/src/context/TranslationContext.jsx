import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { TEXT } from '../utils/content';
import axios from 'axios';
import { useGlobalContext } from './GlobalProvider';
import { useLocation } from 'react-router-dom';
import { LANGUAGECODES } from '../utils/staticData';
import i18n from '../i18n';
import { detectLocale, getLanguageCodeFromName } from '../utils/localeDetection';
import translationAR from '../locales/ar/translationAR.json';
import translationDE from '../locales/de/translationDE.json';
import translationES from '../locales/es/translationES.json';
import translationFR from '../locales/fr/translationFR.json';
import translationIT from '../locales/it/translationIT.json';
import translationJA from '../locales/ja/translationJA.json';
import translationPT from '../locales/pt/translationPT.json';
import translationRU from '../locales/ru/translationRU.json';
import translationZH from '../locales/zh/translationZH.json';

const TranslationContext = createContext(null);

const TRANSLATE_ENDPOINT =
  import.meta.env.VITE_TRANSLATE_ENDPOINT ||
  (import.meta.env.VITE_LIBRE_TRANSLATE_ENDPOINT
    ? `${import.meta.env.VITE_LIBRE_TRANSLATE_ENDPOINT.replace(/\/$/, '')}/translate`
    : import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')}/api/v1/translate`
      : '');
const STATIC_LOCALES = {
  ar: translationAR,
  de: translationDE,
  es: translationES,
  fr: translationFR,
  it: translationIT,
  ja: translationJA,
  pt: translationPT,
  ru: translationRU,
  zh: translationZH,
};

const FORCE_TRANSLATION_LANGUAGES = new Set([]);

const STATIC_PAGE_TRANSLATIONS = {
  es: {
    common: {
      contactUs: 'Contáctanos',
      ourStory: 'Nuestra historia',
      privacyPolicy: 'Política de privacidad',
      refundPolicy: 'Política de reembolso',
      termsAndConditions: 'Términos y condiciones',
      customerSupport: 'Atención al cliente',
      explore: 'Explorar',
      premium: 'Premium',
      viewAll: 'Ver todo',
      view: 'Ver',
      shopNow: 'Comprar ahora',
      comingSoon: 'Próximamente',
      mmmk: 'MMMK WODE',
      buyNow: 'Comprar ahora',
      allProducts: 'Todos los productos',
      enquiry: 'Consulta',
      menu: 'Menú',
      followUsOn: 'Síguenos en',
      footerDescription:
        'Descubre MMMK WODE: donde el lujo se une con la versatilidad. Desde perfumes exquisitos y joyería fina hasta bikinis elegantes, ropa deportiva, sandalias artesanales y vestidos de seda sofisticados, disfruta de un mundo de estilo refinado.',
      mmmkOfficialWebsite: 'SITIO OFICIAL DE MMMK WODE',
      copyright: 'Copyright © 2026 MMMK WODE. Todos los derechos reservados',
      productImageAlt: 'Imagen del producto',
      collections: 'Colecciones',
      collection: 'Colección',
      bikini: 'Bikini',
      newsLetterHeading: 'BOLETÍN POR CORREO ELECTRÓNICO',
      newsLetterDescription:
        'Recibe contenido exclusivo y noticias de MMMK WODE y sé el primero en enterarte de lanzamientos de productos y anuncios especiales.',
      whatOurInfluencersSay: '¿Qué dicen nuestros influencers?',
      itemUnavailable: 'Próximamente',
      fragrance: 'Fragancia',
      checkout: 'Pago',
      viewAvailableCoupons: 'Ver cupones disponibles',
      total: 'Total',
      subTotal: 'Subtotal',
      continueShopping: 'Continuar comprando',
    },
    homepage: {
      section1Heading1: 'SÉ BENDECIDO Y DISFRUTA DE TODOS LOS DISEÑOS',
      section2Heading1: 'COLECCIONES MMMK WODE',
      section4Heading1: 'VESTIDOS ARTESANALES EXCLUSIVOS',
      section4Heading2: 'ELEGANCIA COMODIDAD ESTILO',
      section4Heading3: 'COLECCIÓN EXCLUSIVA DE JOYAS',
      section5Heading1: 'RECOMENDADO PARA TI',
      section6Heading1: '¡GRAN INAUGURACIÓN!',
      section6Description1: 'TODOS LOS ARTÍCULOS CON 19% DE DESCUENTO',
      section6Heading2: 'POR MMMK WODE',
      section7Heading1: 'COMPRA AL INSTANTE',
      section8Heading1:
        'Mel Money Room Spray captura el alma del Caribe, donde las costas iluminadas por el sol se encuentran con la elegancia atemporal. Comienza con una chispa cítrica de pomelo, bergamota, mandarina siciliana y enebro, evocando la frescura de la brisa marina y las frutas vibrantes de la isla. El corazón revela un ritmo cálido y especiado de pimienta, romero y palisandro brasileño, que recuerda a los mercados tropicales y la vegetación exuberante de las colinas costeras. Finalmente, una base profunda de almizcle, incienso y musgo de roble evoca el misterio del atardecer en las islas, donde el aire es rico, sensual e infinitamente acogedor. Impregnado con el espíritu del Caribe, Mel Money transforma cualquier espacio en un refugio de sol, especias y sofisticación, el equilibrio perfecto entre libertad isleña y lujo refinado.',
      section11Heading1: 'M SILKY MUSK',
      section11Description1:
        'Nuestro nuevo Sensational White Tahara M Silky Musk Intime es una fragancia única y poderosa, creada originalmente para el uso en la intimidad. Es una mezcla de aromas raros y exóticos, diseñada para crear una atmósfera íntima. Un almizcle blanco lujoso y exótico es una fragancia increíblemente versátil y única. Con su aroma sensual y su textura ligera, se ha utilizado durante siglos para crear una amplia variedad de perfumes. A pesar de su presencia histórica, secreta y misteriosa entre las mujeres orientales, la aplicación del almizcle íntimo Tahara es en realidad muy sencilla. Es una fragancia natural derivada de plantas y flores, utilizada durante siglos en Oriente como un cuidado ancestral para nosotras, las reinas. Estos ingredientes se combinan de tal forma que pueden ayudar a relajar tu mente mientras estimulan las respuestas naturales de excitación de tu cuerpo, y obrarán maravillas para mantenerte segura, valiosa, ligera y cómoda durante todo el día. Un secreto perfecto para quienes buscan mejorar su rutina de higiene personal.',
      section12Heading1: 'COLA DE CABALLO RUBIA NATURAL DE LUJO',
      section13Heading1: '¿TIENES PREGUNTAS?',
      section14Heading1:
        'Nuestra Martinica caribeña Miss Universo ama nuestra fragancia y joyas',
      section16Heading1: 'Detrás de escena de las marcas',
      section17Heading1: 'Elegancia cotidiana: vestuario y decoración',
    },
  },
  pt: {
    common: {
      contactUs: 'Fale conosco',
      ourStory: 'Nossa história',
      privacyPolicy: 'Política de privacidade',
      refundPolicy: 'Política de reembolso',
      termsAndConditions: 'Termos e condições',
      customerSupport: 'Suporte ao cliente',
      explore: 'Explorar',
      premium: 'Premium',
      viewAll: 'Ver tudo',
      view: 'Ver',
      shopNow: 'Compre agora',
      comingSoon: 'Em breve',
      mmmk: 'MMMK WODE',
      buyNow: 'Compre agora',
      allProducts: 'Todos os produtos',
      enquiry: 'Consulta',
      menu: 'Menu',
      followUsOn: 'Siga-nos em',
      footerDescription:
        'Descubra a MMMK WODE: onde o luxo encontra a versatilidade. De perfumes sofisticados e joias finas a biquínis elegantes, moda fitness, sandálias artesanais e vestidos de seda refinados, mergulhe em um mundo de estilo elegante.',
      mmmkOfficialWebsite: 'SITE OFICIAL MMMK WODE',
      copyright: 'Copyright © 2026 MMMK WODE. Todos os direitos reservados',
      productImageAlt: 'Imagem do producto',
      collections: 'Coleções',
      collection: 'Coleção',
      bikini: 'Biquíni',
      newsLetterHeading: 'NEWSLETTER POR E-MAIL',
      newsLetterDescription:
        'Receba conteúdo exclusivo e notícias da MMMK WODE e seja o primeiro a saber sobre lançamentos de produtos e anúncios especiais.',
      whatOurInfluencersSay: 'O que nossos influenciadores estão dizendo?',
      itemUnavailable: 'Em breve',
      fragrance: 'Fragrância',
      checkout: 'Finalizar compra',
      viewAvailableCoupons: 'Ver cupons disponíveis',
      total: 'Total',
      subTotal: 'Subtotal',
      continueShopping: 'Continuar comprando',
    },
    homepage: {
      section1Heading1: 'SEJA ABENÇOADO E APROVEITE TODOS OS DESIGNS',
      section2Heading1: 'COLEÇÕES MMMK WODE',
      section4Heading1: 'VESTIDOS ARTESANAIS EXCLUSIVOS',
      section4Heading2: 'ELEGÂNCIA CONFORTO ESTILO',
      section4Heading3: 'COLEÇÃO EXCLUSIVA DE JOIAS',
      section5Heading1: 'RECOMENDADO PARA VOCÊ',
      section6Heading1: 'GRANDE INAUGURAÇÃO!',
      section6Description1: 'TODOS OS ITENS COM 19% DE DESCONTO',
      section6Heading2: 'POR MMMK WODE',
      section7Heading1: 'COMPRE NA HORA',
      section8Heading1:
        'O Mel Money Room Spray captura a alma do Caribe, onde as praias banhadas pelo sol encontram a elegância atemporal. Ele começa com um toque cítrico de grapefruit, bergamota, tangerina siciliana e zimbro, ecoando a frescura da brisa do mar e das frutas vibrantes da ilha. O coração revela um ritmo quente e picante de pimenta, alecrim e jacarandá-brasileiro, lembrando mercados tropicais e a vegetação exuberante das encostas costeiras. Por fim, uma base profunda de musk, incenso e musgo de carvalho evoca o mistério do entardecer nas ilhas, onde o ar é rico, sensual e infinitamente acolhedor. Inspirado pelo espírito caribenho, o Mel Money transforma qualquer ambiente em um refúgio de sol, especiarias e sofisticação, o equilíbrio perfeito entre liberdade da ilha e luxo refinado.',
      section11Heading1: 'M MUSK SEDOSO',
      section11Description1:
        'Nosso novo Sensational White Tahara M Silky Musk Intime é uma fragrância única e poderosa, criada originalmente para uso na intimidade. É uma mistura de aromas raros e exóticos, projetada para criar uma atmosfera íntima. Um musk branco luxuoso e exótico é uma fragrância incrivelmente versátil e única. Com seu aroma sensual e textura leve, ele tem sido usado por séculos para criar uma variedade de perfumes. Apesar da presença histórica, secreta e misteriosa entre as mulheres orientais, a aplicação do musk íntimo Tahara é, na verdade, muito simples. É uma fragrância natural derivada de plantas e flores, usada há séculos no Oriente como um cuidado ancestral para nós, Rainhas. Esses ingredientes são combinados de forma a ajudar a relaxar sua mente enquanto estimulam as respostas naturais de excitação do seu corpo e farão milagres para manter você confiante, valiosa, leve e confortável o dia todo. Um segredo perfeito para quem quer melhorar sua rotina de higiene pessoal.',
      section12Heading1: 'RABO DE CAVALO LOIRO NATURAL DE LUJO',
      section13Heading1: 'TEM PERGUNTAS?',
      section14Heading1:
        'Nossa Martinica caribeña Miss Universe adora nossa fragrância e joias',
      section16Heading1: 'Bastidores das marcas',
      section17Heading1: 'Elegância do dia a dia: guarda-roupa e decoração',
    },
  },
  it: {
    common: {
      contactUs: 'Contattaci',
      ourStory: 'La nostra storia',
      privacyPolicy: 'Informativa sulla privacy',
      refundPolicy: 'Politica di rimborso',
      termsAndConditions: 'Termini e condizioni',
      customerSupport: 'Assistenza clienti',
      explore: 'Esplora',
      premium: 'Premium',
      viewAll: 'Visualizza tutto',
      view: 'Visualizza',
      shopNow: 'Acquista ora',
      comingSoon: 'Prossimamente',
      mmmk: 'MMMK WODE',
      buyNow: 'Acquista ora',
      allProducts: 'Tutti i prodotti',
      enquiry: 'Richiesta',
      menu: 'Menu',
      followUsOn: 'Seguici su',
      footerDescription:
        'Scopri MMMK WODE: dove il lusso incontra la versatilità. Dai profumi raffinati e i gioielli preziosi ai bikini chic, all’abbigliamento fitness, ai sandali artigianali e agli eleganti abiti in seta, immergiti in un mondo di stile ricercato.',
      mmmkOfficialWebsite: 'SITO UFFICIALE MMMK WODE',
      copyright: 'Copyright © 2026 MMMK WODE. Tutti i diritti riservati',
      productImageAlt: 'Immagine del prodotto',
      collections: 'Collezioni',
      collection: 'Collezione',
      bikini: 'Bikini',
      newsLetterHeading: 'NEWSLETTER VIA E-MAIL',
      newsLetterDescription:
        'Ricevi contenuti esclusivi e notizie da MMMK WODE e sii il primo a sapere dei lanci di prodotto e degli annunci speciali.',
      whatOurInfluencersSay: 'Cosa dicono i nostri influencer?',
      itemUnavailable: 'Prossimamente',
      fragrance: 'Fragranza',
      checkout: 'Pagamento',
      viewAvailableCoupons: 'Visualizza coupon disponibili',
      total: 'Totale',
      subTotal: 'Subtotale',
      continueShopping: 'Continua lo shopping',
    },
    homepage: {
      section1Heading1: 'SII BENEDETTO E GODITI TUTTI I DESIGN',
      section2Heading1: 'COLLEZIONI MMMK WODE',
      section4Heading1: 'ABITI ARTIGIANALI ESCLUSIVI',
      section4Heading2: 'ELEGANZA COMFORT STILE',
      section4Heading3: 'COLLEZIONE ESCLUSIVA DI GIOIELLI',
      section5Heading1: 'CONSIGLIATO PER TE',
      section6Heading1: 'GRANDE INAUGURAZIONE!',
      section6Description1: 'TUTTI GLI ARTICOLI SCONTATI DEL 19%',
      section6Heading2: 'DA MMMK WODE',
      section7Heading1: 'ACQUISTA SUBITO',
      section8Heading1:
        'Mel Money Room Spray cattura l’anima dei Caraibi, dove le rive baciate dal sole incontrano l’eleganza senza tempo. Si apre con una fresca esplosione di pompelmo, bergamotto, mandarino siciliano e ginepro, richiamando la freschezza della brezza marina e dei frutti tropicali dell’isola. Il cuore rivela un ritmo caldo e speziato di pepe, rosmarino e palissandro brasiliano, che ricorda i mercati tropicali e il verde lussureggiante delle colline costiere. Infine, una base profonda di muschio, incenso e muschio di quercia evoca il mistero del tramonto sulle isole, dove l’aria è ricca, sensuale e infinitamente accogliente. Ispirato allo spirito dei Caraibi, Mel Money trasforma qualsiasi ambiente in un rifugio di sole, spezie e raffinatezza, il perfetto equilibrio tra libertà isolana e lusso ricercato.',
      section11Heading1: 'M MUSCHIO SETOSO',
      section11Description1:
        'Il nostro nuovo Sensational White Tahara M Silky Musk Intime è una fragranza unica e potente, nata originariamente per l’uso nell’intimità. È una miscela di aromi rari ed esotici, pensata per creare un’atmosfera intima. Un muschio bianco lussuoso ed esotico è una fragranza incredibilmente versatile e unica. Con il suo profumo sensuale e la sua texture leggera, è stato usato per secoli per creare una vasta gamma di profumi. Nonostante la sua presenza storica, segreta e misteriosa tra le donne orientali, l’applicazione del Tahara intimate musk è in realtà molto semplice. È una fragranza naturale derivata da piante e fiori, utilizzata per secoli in Oriente come cura ancestrale per noi, Regine. Questi ingredienti sono combinati in modo da aiutare a rilassare la mente mentre stimolano le risposte naturali di eccitazione del corpo e faranno miracoli per mantenerti sicura di te, preziosa, leggera e a tuo agio per tutto il giorno. Un segreto perfetto per chi desidera migliorare la propria routine di igiene personale.',
      section12Heading1: 'CODA DI CAVALLO BIONDA NATURALE DI LUSSO',
      section13Heading1: 'HAI DOMANDE?',
      section14Heading1:
        'La nostra Martinica caraibica Miss Universe ama la nostra fraganza e i gioielli',
      section16Heading1: 'Dietro le quinte dei brand',
      section17Heading1: 'Eleganza quotidiana: guardaroba e arredo',
    },
  },
  de: {
    common: {
      contactUs: 'Kontaktieren Sie uns',
      ourStory: 'Unsere Geschichte',
      privacyPolicy: 'Datenschutzrichtlinie',
      refundPolicy: 'Rückerstattungsrichtlinie',
      termsAndConditions: 'Allgemeine Geschäftsbedingungen',
      customerSupport: 'Kundensupport',
      explore: 'Entdecken',
      premium: 'Premium',
      viewAll: 'Alle ansehen',
      view: 'Ansehen',
      shopNow: 'Jetzt shoppen',
      comingSoon: 'Demnächst',
      mmmk: 'MMMK WODE',
      buyNow: 'Jetzt kaufen',
      allProducts: 'Alle Produkte',
      enquiry: 'Anfrage',
      menu: 'Menü',
      followUsOn: 'Folgen Sie uns auf',
      footerDescription:
        'Entdecken Sie MMMK WODE: wo Luxus auf Vielseitigkeit trifft. Von erlesenen Parfums und feinem Schmuck bis hin zu schicken Bikinis, Fitnesskleidung, handgefertigten Sandalen und eleganten Seidenkleidern können Sie in eine Welt raffinierten Stils eintauchen.',
      mmmkOfficialWebsite: 'OFFIZIELLE WEBSITE VON MMMK WODE',
      copyright: 'Urheberrecht © 2026 MMMK WODE. Alle Rechte vorbehalten',
      productImageAlt: 'Produktbild',
      collections: 'Kollektionen',
      collection: 'Kollektion',
      bikini: 'Bikini',
      newsLetterHeading: 'E-MAIL-NEWSLETTER',
      newsLetterDescription:
        'Erhalten Sie exklusive Inhalte und Neuigkeiten von MMMK WODE und erfahren Sie als Erster von Produkteinführungen und besonderen Ankündigungen.',
      whatOurInfluencersSay: 'Was sagen unsere Influencer?',
      itemUnavailable: 'Demnächst verfügbar',
      fragrance: 'Duft',
      checkout: 'Bezahlen',
      viewAvailableCoupons: 'Verfügbare Gutscheine ansehen',
      total: 'Gesamt',
      subTotal: 'Zwischensumme',
      continueShopping: 'Weiter einkaufen',
    },
    homepage: {
      section1Heading1: 'SEIEN SIE GESEGNET UND GENIESSEN SIE ALLE DESIGNS',
      section2Heading1: 'MMMK WODE KOLLEKTIONEN',
      section4Heading1: 'EXKLUSIVE HANDGEFERTIGTE KLEIDER',
      section4Heading2: 'ELEGANZ KOMFORT STIL',
      section4Heading3: 'EXKLUSIVE SCHMUCKKOLLEKTION',
      section5Heading1: 'EMPFOHLEN FÜR SIE',
      section6Heading1: 'GROSSE ERÖFFNUNG!',
      section6Description1: 'ALLE ARTIKEL 19 % RABATT',
      section6Heading2: 'VON MMMK WODE',
      section7Heading1: 'SOFORT SHOPPEN',
      section8Heading1:
        'Der Mel Money Room Spray fängt die Seele der Karibik ein, wo sonnendurchflutete Küsten auf zeitlose Eleganz treffen. Er eröffnet mit einer spritzigen Mischung aus Grapefruit, Bergamotte, sizilianischer Mandarine und Wacholder und erinnert an die Frische der Meeresbrise und die lebendigen Früchte der Inseln. Im Herzen entfaltet sich ein warmer, würziger Rhythmus aus Pfeffer, Rosmarin und brasilianischem Rosenholz, der an tropische Märkte und das üppige Grün der Küstenhügel erinnert. Schließlich ruft eine tiefe Basis aus Moschus, Weihrauch und Eichenmoos das Geheimnis der Abenddämmerung auf den Inseln hervor, wo die Luft reich, sinnlich und unendlich einladend ist. Vom karibischen Geist inspiriert verwandelt Mel Money jeden Raum in eine Oase aus Sonne, Gewürzen und Raffinesse, die perfekte Balance zwischen Insel-Freiheit und erlesenem Luxus.',
      section11Heading1: 'M SEIDIGER MOSCHUS',
      section11Description1:
        'Unser neues Sensational White Tahara M Silky Musk Intime ist ein einzigartiger und kraftvoller Duft, der ursprünglich für die Intimität entwickelt wurde. Es ist eine Mischung aus seltenen und exotischen Aromen, geschaffen, um eine intime Atmosphäre zu erzeugen. Ein luxuriöser und exotischer weißer Moschus ist ein unglaublich vielseitiger und einzigartiger Duft. Mit seinem sinnlichen Duft und seiner leichten Textur wird er seit Jahrhunderten verwendet, um eine Vielzahl von Parfums zu kreieren. Trotz seiner historischen, geheimnisvollen Präsenz unter orientalischen Frauen ist die Anwendung von Tahara Intimate Musk tatsächlich sehr einfach. Es handelt sich um einen natürlichen Duft aus Pflanzen und Blüten, der seit Jahrhunderten im Orient als uralte Pflege für uns Königinnen verwendet wird. Diese Inhaltsstoffe werden so kombiniert, dass sie den Geist entspannen und gleichzeitig die natürlichen Reaktionen des Körpers anregen können und Wunder wirken, damit Sie sich den ganzen Tag selbstbewusst, wertvoll, leicht und wohl fühlen. Ein kleines Geheimnis für alle, die ihre persönliche Pflegeroutine verbessern möchten.',
      section12Heading1: 'LUXURIÖSER ROSSZOPF IN NATURBLOND',
      section13Heading1: 'HABEN SIE FRAGEN?',
      section14Heading1:
        'Unsere Karibik-Martinique Miss Universe liebt unseren Duft und Schmuck',
      section16Heading1: 'Blick hinter die Kulissen der Marken',
      section17Heading1: 'Alltägliche Eleganz: Garderobe und Dekor',
    },
  },
};

const getNestedValue = (obj, path) =>
  path.split('.').reduce((acc, key) => acc?.[key], obj);

const getFirstDefined = (locale, paths = []) => {
  for (const path of paths) {
    const value = getNestedValue(locale, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const joinTranslated = (parts) =>
  parts.filter((part) => typeof part === 'string' && part.trim()).join(' ');

const normalizeCategoryName = (value = '') =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizeTranslatedValue = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const getMeaningfulObjectTranslation = (obj, language) => {
  if (!obj) return null;
  const translatedValue = obj?.[language];
  const englishValue = obj?.en;

  if (!translatedValue) return null;
  if (language === 'en') return translatedValue;
  if (
    normalizeTranslatedValue(translatedValue) ===
    normalizeTranslatedValue(englishValue)
  ) {
    return null;
  }

  return translatedValue;
};

const hasMeaningfulTranslation = (obj, language) =>
  !!getMeaningfulObjectTranslation(obj, language);

const CATEGORY_LOCALE_PATHS = {
  fragrance: ['filter.fragrance', 'productDetails.fragrance'],
  jewelry: ['jewelry', 'filter.jewels', 'footer.collections_list.jewelry'],
  jewels: ['filter.jewels', 'jewelry'],
  bikini: ['filter.bikini'],
  bikinis: ['bikinis', 'filter.bikini'],
  footwear: ['filter.footwear'],
  sandals: ['sandals', 'shopping.Sandals', 'footer.collections_list.sandals'],
  dress: ['dress', 'filter.dress', 'footer.collections_list.dress'],
  dresses: ['shopping.Dresses', 'productDetails.dresses', 'dress'],
  'swim wear': ['swimWear', 'shopping.Swim Wear', 'footer.collections_list.swim_wear'],
  swimwear: ['swimWear', 'shopping.Swim Wear', 'footer.collections_list.swim_wear'],
  fitness: ['fitness'],
  yoga: ['shopping.Fitness & Yoga', 'productDetails.yoga'],
  'fitness and yoga': [
    'shopping.Fitness & Yoga',
    'footer.collections_list.fitness_yoga',
    'productDetails.yoga',
  ],
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
  'jewellery accessories': {
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
    fr: 'Sandales personnalisées',
    ru: 'Индивидуальные сандалии',
    zh: '定制凉鞋',
    es: 'Sandalias personalizadas',
    ja: 'カスタムサンダル',
    pt: 'Sandálias personalizadas',
    it: 'Sandali personalizzati',
    de: 'Individuelle Sandalen',
  },
  'design bikni swimwear': {
    ar: 'تصميم ملابس السباحة البيكيني',
    fr: 'Maillots de bain bikini design',
    ru: 'Дизайнерские купальники-бикини',
    zh: '设计款比基尼泳装',
    es: 'Bikinis de diseño',
    ja: 'デザインビキニ水着',
    pt: 'Moda praia biquíni de design',
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
  'vase natural sand candle': {
    ar: 'مزهرية وشمعة رملية طبيعية',
    fr: 'Vase et bougie en sable naturel',
    ru: 'Ваза и свеча из натурального песка',
    zh: '花瓶与天然沙蜡烛',
    es: 'Jarrón y vela de arena natural',
    ja: '花瓶とナチュラルサンドキャンドル',
    pt: 'Vaso e vela de areia natural',
    it: 'Vaso e candela di sabbia naturale',
    de: 'Vase und Natur-Sandkerze',
  },
};

const getStaticCategoryTranslation = (name, language) => {
  if (language === 'en') return name;
  if (FORCE_TRANSLATION_LANGUAGES.has(language)) return null;

  const locale = STATIC_LOCALES[language];
  if (!locale || !name) return null;

  const normalized = normalizeCategoryName(name);
  const exactTranslation = EXACT_CATEGORY_TRANSLATIONS[normalized]?.[language];
  if (exactTranslation) return exactTranslation;

  const mappedPaths = CATEGORY_LOCALE_PATHS[normalized];
  if (!mappedPaths) return null;

  return getFirstDefined(locale, mappedPaths) || null;
};
const buildStaticPageContent = (page, language) => {
  const staticOverride = STATIC_PAGE_TRANSLATIONS[language]?.[page];
  if (staticOverride) {
    return {
      ...TEXT[page],
      ...staticOverride,
    };
  }

  // Use local legal translations if available
  if (page === 'legal') {
    // Get translations for current language, fallback to 'en'
    return legalTranslations[language] || legalTranslations['en'];
  }

  if (language === 'en') return TEXT[page];
// ... (rest of function)

  if (FORCE_TRANSLATION_LANGUAGES.has(language)) return null;
// ... (rest of function)

  const locale = STATIC_LOCALES[language];
  if (!locale) return null;

  if (page === 'common') {
    return {
      ...TEXT.common,
      contactUs:
        getFirstDefined(locale, ['footer.contact_us']) || TEXT.common.contactUs,
      ourStory:
        getFirstDefined(locale, ['footer.our_story']) || TEXT.common.ourStory,
      privacyPolicy:
        getFirstDefined(locale, ['footer.privacy_policy']) ||
        TEXT.common.privacyPolicy,
      refundPolicy:
        getFirstDefined(locale, ['footer.refund_policy']) ||
        TEXT.common.refundPolicy,
      termsAndConditions:
        getFirstDefined(locale, ['footer.terms_conditions']) ||
        TEXT.common.termsAndConditions,
      customerSupport:
        getFirstDefined(locale, ['footer.customer_support']) ||
        TEXT.common.customerSupport,
      explore:
        getFirstDefined(locale, ['explore']) || TEXT.common.explore,
      premium:
        getFirstDefined(locale, ['premium', 'luxuryTitle']) ||
        TEXT.common.premium,
      viewAll:
        getFirstDefined(locale, ['viewAll']) || TEXT.common.viewAll,
      shopNow:
        getFirstDefined(locale, ['shopNow']) || TEXT.common.shopNow,
      comingSoon:
        getFirstDefined(locale, ['comingSoon']) || TEXT.common.comingSoon,
      mmmk:
        getFirstDefined(locale, ['brandName', 'homePage.banner1.title']) ||
        TEXT.common.mmmk,
      buyNow: getFirstDefined(locale, ['buyNow']) || TEXT.common.buyNow,
      allProducts:
        getFirstDefined(locale, ['allProduct', 'allProducts']) ||
        TEXT.common.allProducts,
      enquiry:
        getFirstDefined(locale, ['enquiry']) || TEXT.common.enquiry,
      menu: getFirstDefined(locale, ['menu']) || TEXT.common.menu,
      followUsOn:
        getFirstDefined(locale, ['footer.follow_us_on']) ||
        TEXT.common.followUsOn,
      footerDescription:
        getFirstDefined(locale, ['footer.discover_description']) ||
        TEXT.common.footerDescription,
      mmmkOfficialWebsite:
        getFirstDefined(locale, ['footer.official_website']) ||
        TEXT.common.mmmkOfficialWebsite,
      copyright:
        getFirstDefined(locale, ['footer.copyright']) || TEXT.common.copyright,
      productImageAlt:
        getFirstDefined(locale, ['productImageAlt']) ||
        TEXT.common.productImageAlt,
      collections:
        getFirstDefined(locale, ['collections']) || TEXT.common.collections,
      collection:
        getFirstDefined(locale, ['collection']) || TEXT.common.collection,
      bikini:
        getFirstDefined(locale, ['filter.bikini']) || TEXT.common.bikini,
      newsLetterHeading:
        getFirstDefined(locale, ['newsletterTitle']) ||
        TEXT.common.newsLetterHeading,
      newsLetterDescription:
        getFirstDefined(locale, ['newsletterDescription']) ||
        TEXT.common.newsLetterDescription,
      whatOurInfluencersSay:
        getFirstDefined(locale, ['customerSayingTitle']) ||
        TEXT.common.whatOurInfluencersSay,
      fragrance:
        getFirstDefined(locale, ['productDetails.fragrance', 'filter.fragrance']) ||
        TEXT.common.fragrance,
      subTotal:
        getFirstDefined(locale, ['shopping.SubTotal']) || TEXT.common.subTotal,
      total:
        getFirstDefined(locale, ['shopping.Total', 'checkout.total']) ||
        TEXT.common.total,
      apply: getFirstDefined(locale, ['shopping.Apply']) || TEXT.common.apply,
      coupon: getFirstDefined(locale, ['shopping.Coupon']) || TEXT.common.coupon,
      checkout:
        getFirstDefined(locale, [
          'shopping.checkout',
          'checkout.checkout',
          'menu.checkout',
        ]) || TEXT.common.checkout,
      remove: getFirstDefined(locale, ['shopping.Remove']) || TEXT.common.remove,
      applying: getFirstDefined(locale, ['applying']) || TEXT.common.applying,
      viewAvailableCoupons:
        getFirstDefined(locale, [
          'viewAvailableCoupons',
          'shopping.viewAvailableCoupons',
        ]) || TEXT.common.viewAvailableCoupons,
      processing:
        getFirstDefined(locale, ['processing']) || TEXT.common.processing,
      continueShopping:
        getFirstDefined(locale, [
          'shopping.ContinueShopping',
          'checkout.continueShopping',
          'continueShopping',
        ]) || TEXT.common.continueShopping,
    };
  }

  if (page === 'homepage') {
    return {
      ...TEXT.homepage,
      section1Heading1:
        getFirstDefined(locale, ['homePage.banner1.subTitle']) ||
        TEXT.homepage.section1Heading1,
      section2Heading1:
        getFirstDefined(locale, ['collections']) || TEXT.homepage.section2Heading1,
      section4Heading1:
        joinTranslated([
          getFirstDefined(locale, ['exclusive']),
          getFirstDefined(locale, ['handmade']),
          getFirstDefined(locale, ['dresses']),
        ]) || TEXT.homepage.section4Heading1,
      section4Heading2:
        joinTranslated([
          getFirstDefined(locale, ['elegance']),
          getFirstDefined(locale, ['comfort']),
          getFirstDefined(locale, ['style']),
        ]) || TEXT.homepage.section4Heading2,
      section4Heading3:
        joinTranslated([
          getFirstDefined(locale, ['exclusive']),
          getFirstDefined(locale, ['jewels']),
          getFirstDefined(locale, ['collection']),
        ]) || TEXT.homepage.section4Heading3,
      section5Heading1:
        getFirstDefined(locale, ['recommendedForYou']) ||
        TEXT.homepage.section5Heading1,
      section6Heading1:
        getFirstDefined(locale, ['festivalSale']) ||
        TEXT.homepage.section6Heading1,
      section6Description1:
        getFirstDefined(locale, ['discount']) ||
        TEXT.homepage.section6Description1,
      section6Heading2:
        getFirstDefined(locale, ['byMmmkWode']) ||
        TEXT.homepage.section6Heading2,
      section7Heading1:
        getFirstDefined(locale, ['shopInstant']) || TEXT.homepage.section7Heading1,
      section8Heading1:
        getFirstDefined(locale, ['productDescription']) ||
        TEXT.homepage.section8Heading1,
      section11Heading1:
        getFirstDefined(locale, ['silkyMuskTitle']) ||
        TEXT.homepage.section11Heading1,
      section11Description1:
        getFirstDefined(locale, ['silkyMuskDescription']) ||
        TEXT.homepage.section11Description1,
      section13Heading1:
        getFirstDefined(locale, ['haveQuestions']) ||
        TEXT.homepage.section13Heading1,
      section14Heading1:
        joinTranslated(getFirstDefined(locale, ['homePage.section11.subTitle']) || []) ||
        TEXT.homepage.section14Heading1,
      section16Heading1:
        getFirstDefined(locale, ['backstage']) || TEXT.homepage.section16Heading1,
      section17Heading1:
        getFirstDefined(locale, ['luxuryTitle']) || TEXT.homepage.section17Heading1,
    };
  }

  if (page === 'contact') {
    return {
      ...TEXT.contact,
      title:
        getFirstDefined(locale, ['contactPage.title']) || TEXT.contact.title,
      subtitle:
        getFirstDefined(locale, ['contactPage.subtitle']) ||
        TEXT.contact.subtitle,
      name:
        getFirstDefined(locale, ['contactPage.name']) || TEXT.contact.name,
      email:
        getFirstDefined(locale, ['contactPage.email']) || TEXT.contact.email,
      phoneCountryCode:
        getFirstDefined(locale, ['contactPage.phoneCountryCode']) ||
        TEXT.contact.phoneCountryCode,
      phoneNumber:
        getFirstDefined(locale, ['contactPage.phoneNumber']) ||
        TEXT.contact.phoneNumber,
      query:
        getFirstDefined(locale, ['contactPage.query']) || TEXT.contact.query,
      namePlaceholder:
        getFirstDefined(locale, ['contactPage.namePlaceholder']) ||
        TEXT.contact.namePlaceholder,
      emailPlaceholder:
        getFirstDefined(locale, ['contactPage.emailPlaceholder']) ||
        TEXT.contact.emailPlaceholder,
      phoneNumberPlaceholder:
        getFirstDefined(locale, ['contactPage.phoneNumberPlaceholder']) ||
        TEXT.contact.phoneNumberPlaceholder,
      queryPlaceholder:
        getFirstDefined(locale, ['contactPage.queryPlaceholder']) ||
        TEXT.contact.queryPlaceholder,
      countryCodePlaceholder:
        getFirstDefined(locale, ['contactPage.countryCodePlaceholder']) ||
        TEXT.contact.countryCodePlaceholder,
      submitSuccess:
        getFirstDefined(locale, ['contactPage.submitSuccess']) ||
        TEXT.contact.submitSuccess,
      submitError:
        getFirstDefined(locale, ['contactPage.submitError']) ||
        TEXT.contact.submitError,
      requiredName:
        getFirstDefined(locale, ['contactPage.requiredName']) ||
        TEXT.contact.requiredName,
      requiredEmail:
        getFirstDefined(locale, ['contactPage.requiredEmail']) ||
        TEXT.contact.requiredEmail,
      requiredPhoneCode:
        getFirstDefined(locale, ['contactPage.requiredPhoneCode']) ||
        TEXT.contact.requiredPhoneCode,
      requiredPhoneNumber:
        getFirstDefined(locale, ['contactPage.requiredPhoneNumber']) ||
        TEXT.contact.requiredPhoneNumber,
      requiredQuery:
        getFirstDefined(locale, ['contactPage.requiredQuery']) ||
        TEXT.contact.requiredQuery,
    };
  }

  if (page === 'cart') {
    return {
      ...TEXT.cart,
      shoppingCart:
        getFirstDefined(locale, [
          'shopping.SHOPPING_CART',
          'shopping.SHIPPING_CART',
          'cart',
        ]) || TEXT.cart.shoppingCart,
      paymentBreakdown:
        getFirstDefined(locale, [
          'shopping.PaymentBreakdown',
          'particularOrder.paymentBreakdown',
        ]) || TEXT.cart.paymentBreakdown,
      enterPromoCode:
        getFirstDefined(locale, ['shopping.EnterPromoCode']) ||
        TEXT.cart.enterPromoCode,
      continueShopping:
        getFirstDefined(locale, [
          'shopping.ContinueShopping',
          'checkout.continueShopping',
        ]) || TEXT.cart.continueShopping,
      addABag: getFirstDefined(locale, ['shopping.addABag']) || TEXT.cart.addABag,
      bagIncludes:
        getFirstDefined(locale, ['shopping.bagIncludes']) || TEXT.cart.bagIncludes,
      addBag: getFirstDefined(locale, ['shopping.addBag']) || TEXT.cart.addBag,
      removeBag:
        getFirstDefined(locale, ['shopping.removeBag']) || TEXT.cart.removeBag,
      bagFeeLabel:
        getFirstDefined(locale, ['shopping.bagFeeLabel']) || TEXT.cart.bagFeeLabel,
      stockWarning:
        getFirstDefined(locale, ['shopping.stockWarning']) ||
        TEXT.cart.stockWarning,
    };
  }

  if (page === 'checkout') {
    return {
      ...TEXT.checkout,
      shippingCharges:
        getFirstDefined(locale, [
          'particularOrder.shippingCharges',
          'shopping.ShippingCharge',
          'checkout.shippingCharges',
        ]) || TEXT.checkout.shippingCharges,
      tax:
        getFirstDefined(locale, ['shopping.Taxes', 'checkout.tax']) ||
        TEXT.checkout.tax,
      cashOnDeliveryShort:
        getFirstDefined(locale, [
          'myOrders.paymentMethods.COD',
          'checkout.cashOnDeliveryShort',
        ]) || TEXT.checkout.cashOnDeliveryShort,
      extraCharges:
        getFirstDefined(locale, ['checkout.extraCharges']) ||
        TEXT.checkout.extraCharges,
      shippingAddress:
        getFirstDefined(locale, [
          'checkout.shippingAddress',
          'addressBook.shippingAddress',
        ]) || TEXT.checkout.shippingAddress,
      billingAddress:
        getFirstDefined(locale, [
          'checkout.billingAddress',
          'addressBook.billingAddress',
        ]) || TEXT.checkout.billingAddress,
      firstName:
        getFirstDefined(locale, ['checkout.firstName', 'addressBook.firstName']) ||
        TEXT.checkout.firstName,
      lastName:
        getFirstDefined(locale, ['checkout.lastName', 'addressBook.lastName']) ||
        TEXT.checkout.lastName,
      streetAddress:
        getFirstDefined(locale, [
          'checkout.streetAddress',
          'addressBook.streetAddress',
        ]) || TEXT.checkout.streetAddress,
      city:
        getFirstDefined(locale, ['checkout.city', 'addressBook.city']) ||
        TEXT.checkout.city,
      state:
        getFirstDefined(locale, ['checkout.state', 'addressBook.state']) ||
        TEXT.checkout.state,
      postalCode:
        getFirstDefined(locale, [
          'checkout.postalCode',
          'addressBook.zipPostalCode',
        ]) || TEXT.checkout.postalCode,
      country:
        getFirstDefined(locale, ['checkout.country', 'addressBook.country']) ||
        TEXT.checkout.country,
      company:
        getFirstDefined(locale, ['checkout.company', 'addressBook.company']) ||
        TEXT.checkout.company,
      landmark:
        getFirstDefined(locale, ['checkout.landmark']) || TEXT.checkout.landmark,
      sameAsShippingAddress:
        getFirstDefined(locale, ['checkout.sameAsShippingAddress']) ||
        TEXT.checkout.sameAsShippingAddress,
      phoneNumber:
        getFirstDefined(locale, [
          'checkout.phoneNumber',
          'addressBook.phoneNumber',
        ]) || TEXT.checkout.phoneNumber,
      selectPaymentMethod:
        getFirstDefined(locale, ['checkout.selectPaymentMethod']) ||
        TEXT.checkout.selectPaymentMethod,
      chooseHowToPay:
        getFirstDefined(locale, ['checkout.chooseHowToPay']) ||
        TEXT.checkout.chooseHowToPay,
      payWithCard:
        getFirstDefined(locale, ['checkout.payWithCard']) ||
        TEXT.checkout.payWithCard,
      cardPaymentDescription:
        getFirstDefined(locale, ['checkout.cardPaymentDescription']) ||
        TEXT.checkout.cardPaymentDescription,
      cashOnDelivery:
        getFirstDefined(locale, ['checkout.cashOnDelivery']) ||
        TEXT.checkout.cashOnDelivery,
      codPaymentDescription:
        getFirstDefined(locale, ['checkout.codPaymentDescription']) ||
        TEXT.checkout.codPaymentDescription,
      redirectingToPaymentGateway:
        getFirstDefined(locale, ['checkout.redirectingToPaymentGateway']) ||
        TEXT.checkout.redirectingToPaymentGateway,
      checkoutFailed:
        getFirstDefined(locale, ['checkout.checkoutFailed']) ||
        TEXT.checkout.checkoutFailed,
      saved: getFirstDefined(locale, ['checkout.saved']) || TEXT.checkout.saved,
      addresses:
        getFirstDefined(locale, ['checkout.addresses']) ||
        TEXT.checkout.addresses,
      home: getFirstDefined(locale, ['checkout.home']) || TEXT.checkout.home,
      default:
        getFirstDefined(locale, ['checkout.default']) || TEXT.checkout.default,
      enterNewAddress:
        getFirstDefined(locale, ['checkout.enterNewAddress']) ||
        TEXT.checkout.enterNewAddress,
      billing:
        getFirstDefined(locale, ['checkout.billing']) || TEXT.checkout.billing,
      billingSameAsShipping:
        getFirstDefined(locale, ['checkout.billingSameAsShipping']) ||
        TEXT.checkout.billingSameAsShipping,
      orderSummary:
        getFirstDefined(locale, ['checkout.orderSummary']) ||
        TEXT.checkout.orderSummary,
      item: getFirstDefined(locale, ['checkout.item']) || TEXT.checkout.item,
      qty:
        getFirstDefined(locale, [
          'savedItems.qty',
          'myOrders.quantity',
          'checkout.qty',
        ]) || TEXT.checkout.qty,
      appliedTo:
        getFirstDefined(locale, ['checkout.appliedTo']) ||
        TEXT.checkout.appliedTo,
      free: getFirstDefined(locale, ['checkout.free']) || TEXT.checkout.free,
      deliveryDiscount:
        getFirstDefined(locale, ['checkout.deliveryDiscount']) ||
        TEXT.checkout.deliveryDiscount,
      bagFee: getFirstDefined(locale, ['checkout.bagFee']) || TEXT.checkout.bagFee,
      myCredit:
        getFirstDefined(locale, ['userProfile.myCredit', 'checkout.myCredit']) ||
        TEXT.checkout.myCredit,
      available:
        getFirstDefined(locale, ['checkout.available']) ||
        TEXT.checkout.available,
      orderPlacedSuccessfully:
        getFirstDefined(locale, ['orderPlacedSuccessfully', 'checkout.orderPlacedSuccessfully']) ||
        TEXT.checkout.orderPlacedSuccessfully,
      checkoutButton:
        getFirstDefined(locale, [
          'checkout.checkoutButton',
          'checkout.checkout',
          'shopping.CheckoutNow',
        ]) || TEXT.checkout.checkoutButton,
      noWalletCredit:
        getFirstDefined(locale, ['checkout.noWalletCredit']) ||
        TEXT.checkout.noWalletCredit,
      creditAppliedMsg:
        getFirstDefined(locale, ['checkout.creditAppliedMsg']) ||
        TEXT.checkout.creditAppliedMsg,
      creditRemovedMsg:
        getFirstDefined(locale, ['checkout.creditRemovedMsg']) ||
        TEXT.checkout.creditRemovedMsg,
      payLaterWithTabby:
        getFirstDefined(locale, ['checkout.payLaterWithTabby']) ||
        TEXT.checkout.payLaterWithTabby,
      tabbyDescription:
        getFirstDefined(locale, ['checkout.tabbyDescription']) ||
        TEXT.checkout.tabbyDescription,
      secureCheckout:
        getFirstDefined(locale, ['checkout.secureCheckout']) ||
        TEXT.checkout.secureCheckout,
      sslEncrypted:
        getFirstDefined(locale, ['checkout.sslEncrypted']) ||
        TEXT.checkout.sslEncrypted,
    };
  }

  if (page === 'thankYou') {
    return {
      ...TEXT.thankYou,
      orderReceived:
        getFirstDefined(locale, [
          'particularOrder.successMessage',
          'thankYou.orderReceived',
        ]) || TEXT.thankYou.orderReceived,
      orderUpdate:
        getFirstDefined(locale, ['thankYou.orderUpdate']) ||
        TEXT.thankYou.orderUpdate,
      checkingOrder:
        getFirstDefined(locale, ['thankYou.checkingOrder']) ||
        TEXT.thankYou.checkingOrder,
      couldNotVerify:
        getFirstDefined(locale, ['thankYou.couldNotVerify']) ||
        TEXT.thankYou.couldNotVerify,
      refreshingPayment:
        getFirstDefined(locale, ['thankYou.refreshingPayment']) ||
        TEXT.thankYou.refreshingPayment,
      orderId:
        getFirstDefined(locale, [
          'myOrders.orderID',
          'thankYou.orderID',
          'thankYou.orderId',
        ]) || TEXT.thankYou.orderId,
      status:
        getFirstDefined(locale, ['myOrders.status', 'thankYou.status']) ||
        TEXT.thankYou.status,
      mode: getFirstDefined(locale, ['thankYou.mode']) || TEXT.thankYou.mode,
      payment:
        getFirstDefined(locale, ['thankYou.payment']) || TEXT.thankYou.payment,
      juraOrderId:
        getFirstDefined(locale, ['thankYou.juraOrderId']) ||
        TEXT.thankYou.juraOrderId,
      total:
        getFirstDefined(locale, ['shopping.Total', 'thankYou.total']) ||
        TEXT.thankYou.total,
      creditsUsed:
        getFirstDefined(locale, ['thankYou.creditsUsed']) ||
        TEXT.thankYou.creditsUsed,
      amountDue:
        getFirstDefined(locale, ['thankYou.amountDue']) ||
        TEXT.thankYou.amountDue,
      amountPaid:
        getFirstDefined(locale, ['thankYou.amountPaid']) ||
        TEXT.thankYou.amountPaid,
      amountToBePaid:
        getFirstDefined(locale, ['thankYou.amountToBePaid']) ||
        TEXT.thankYou.amountToBePaid,
    };
  }

  return null;
};

export async function translateText(text, toLang = 'en', fromLang = 'en') {
  if (!text || typeof text !== 'string') return text;
  if (toLang === fromLang) return text;
  if (!TRANSLATE_ENDPOINT) return text;

  const body = {
    q: text,
    source: fromLang,
    target: toLang,
  };

  const response = await axios.post(TRANSLATE_ENDPOINT, body, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data.translatedText;
}

export async function translate(textArray, toLang = 'en', fromLang = 'en') {
  if (toLang === fromLang) return textArray;
  if (!TRANSLATE_ENDPOINT) return textArray;

  const promises = textArray.map((text) => {
    const body = {
      q: text,
      source: fromLang,
      target: toLang,
    };
    return axios.post(TRANSLATE_ENDPOINT, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  const responses = await Promise.all(promises);

  return responses.map((response) => response.data.translatedText);
}

export const getTranslateProducts = async (
  list,
  language,
  fields = ['productName']
) => {
  if (!list || !list.length) return [];

  return Promise.all(
    list.map(async (item) => {
      const translated = {};

      await Promise.all(
        fields.map(async (field) => {
          if (!item[field]) return;

          switch (typeof item[field]) {
            case 'object':
              if (item[field][language]) {
                translated[field] = item[field][language];
              } else {
                translated[field] = await translateText(
                  item[field].en || item[field].fr,
                  language
                );
              }
              break;
            case 'string':
              translated[field] = await translateText(item[field], language);
              break;
            default:
              break;
          }
        })
      );

      return { ...item, translated };
    })
  );
};

const TranslationProvider = ({ children }) => {
  const [utils, setUtils] = useState({
    isTranslating: false,
    content: TEXT,
    contentInLanguage: Object.keys(TEXT).reduce((acc, key) => {
      acc[key] = { en: TEXT[key] };
      return acc;
    }, {}),
    translateLanguage: 'en',
  });
  const updateUtils = (newUtils) => {
    setUtils((prev) => {
      const updated = { ...prev, ...newUtils };

      if (newUtils.translateLanguage) {
        localStorage.setItem('translateLanguage', newUtils.translateLanguage);
        if (newUtils.isManual) {
          localStorage.setItem('manualLocaleOverride', 'true');
        }
      }

      return updated;
    });
  };

  const { pathname } = useLocation();

  const { categories, recommendedProducts, updateGlobalContext } =
    useGlobalContext();

  const translateDynamicData = async ({
    name,
    data,
    fieldToTranslate = '',
    language,
  }) => {
    const objs = data.map((item) => item[fieldToTranslate]);
    const translatedItemNames = [];
    for (const item of objs) {
      const existingTranslation = getMeaningfulObjectTranslation(item, language);
      const staticCategoryTranslation =
        name === 'categories' && fieldToTranslate === 'name'
          ? getStaticCategoryTranslation(item?.en, language)
          : null;

      const newTranslated =
        existingTranslation ||
        staticCategoryTranslation ||
        (await translateText(item.en, language));
      translatedItemNames.push(newTranslated);
    }
    const translatedItems = data.map((item, index) => ({
      ...item,
      nameInLanguage: {
        ...(item.nameInLanguage || {}),
        [language]:
          translatedItemNames[index] ||
          (Array.isArray(fieldToTranslate)
            ? fieldToTranslate.reduce((acc, field) => acc[field], item)
            : item[fieldToTranslate]?.[language] ||
              item[fieldToTranslate]?.en ||
              item[fieldToTranslate]),
      },
    }));
    updateGlobalContext({ [name]: translatedItems });
  };

  useEffect(() => {
    if (
      categories?.length > 0 &&
      !hasMeaningfulTranslation(
        categories[0]?.nameInLanguage,
        utils.translateLanguage
      )
    ) {
      translateDynamicData({
        data: categories,
        name: 'categories',
        language: utils.translateLanguage,
        fieldToTranslate: 'name',
      });
    }
    if (
      recommendedProducts?.length > 0 &&
      !hasMeaningfulTranslation(
        recommendedProducts[0]?.nameInLanguage,
        utils.translateLanguage
      )
    ) {
      translateDynamicData({
        data: recommendedProducts,
        name: 'recommendedProducts',
        language: utils.translateLanguage,
        fieldToTranslate: 'productName',
      });
    }
  }, [utils.translateLanguage, categories, recommendedProducts]);
  const translatePages = async (pages, language) => {
    
    const nextContent = { ...utils.content };
    const nextContentInLanguage = { ...utils.contentInLanguage };

    for (const page of pages) {
      const cachedPage = utils.contentInLanguage?.[page]?.[language];
      if (cachedPage) {
        
        nextContent[page] = cachedPage;
        continue;
      }

      const staticPageContent = buildStaticPageContent(page, language);
      if (staticPageContent) {
        
        nextContent[page] = staticPageContent;
        nextContentInLanguage[page] = {
          ...nextContentInLanguage[page],
          [language]: staticPageContent,
        };
        continue;
      }

      try {
        
        
        // For legal pages, use local legal translations
        if (page === 'legal') {
           nextContent[page] = legalTranslations[language] || legalTranslations['en'];
           continue;
        }

        const translated = await translate(Object.values(TEXT[page]), language);
        const pageContent = Object.fromEntries(
          Object.keys(TEXT[page]).map((key, index) => [key, translated[index]])
        );
        nextContent[page] = pageContent;
        nextContentInLanguage[page] = {
          ...nextContentInLanguage[page],
          [language]: pageContent,
        };
        
      } catch (error) {
        console.error(`[DEBUG] Failed to translate ${page} for ${language}:`, error);
        nextContent[page] = TEXT[page];
      }
    }

    updateUtils({
      content: nextContent,
      contentInLanguage: nextContentInLanguage,
      isTranslating: false,
    });
  };

  useEffect(() => {
    if (utils.translateLanguage && i18n.language !== utils.translateLanguage) {
      i18n.changeLanguage(utils.translateLanguage);
    }
  }, [utils.translateLanguage]);

  useEffect(() => {
    if (utils.translateLanguage) {
      const pagesToTranslate = [];
      const page = pagesWithKeys[pathname];
      if (page) {
        pagesToTranslate.push(page);
      } else {
        if (pathname.startsWith('/product-details/'))
          pagesToTranslate.push('productDetails');
        if (
          pathname.startsWith('/thank-you') ||
          pathname.startsWith('/order-success')
        )
          pagesToTranslate.push('thankYou');
        if (pathname.startsWith('/reset-password') || pathname.startsWith('/admin/reset-password'))
          pagesToTranslate.push('forgotPasswordPage');
        if (pathname.startsWith('/admin/forgot-password'))
          pagesToTranslate.push('forgotPasswordPage');
        if (pathname.startsWith('/profile/')) {
          pagesToTranslate.push('profile');
        }
      }
      pagesToTranslate.push('common');
      translatePages(pagesToTranslate, utils.translateLanguage);
    }
  }, [utils.translateLanguage, pathname]);

  useLayoutEffect(() => {
    const getLanguageFromBrowser = () => {
      try {
        const browserLanguage = navigator.language || navigator.userLanguage;
        const languageCode = browserLanguage.split('-')[0];

        const detectedLanguage = LANGUAGECODES.includes(languageCode)
          ? languageCode
          : 'en';

        updateUtils({ translateLanguage: detectedLanguage });
      } catch (error) {
        console.error('Error detecting browser language:', error);
        updateUtils({ translateLanguage: 'en' });
      }
    };

    const initLocale = async () => {
      try {
        const savedLanguage = localStorage.getItem('translateLanguage');
        const isManualOverride = localStorage.getItem('manualLocaleOverride') === 'true';
        const hasDetected = localStorage.getItem('localeAutoDetected') === 'true';

        if (savedLanguage) {
          updateUtils({ translateLanguage: savedLanguage });
        } else if (!isManualOverride && (!hasDetected || !savedLanguage)) {
          const detected = await detectLocale();
          if (detected?.language) {
            const langCode = getLanguageCodeFromName(detected.language);
            updateUtils({ translateLanguage: langCode });
            localStorage.setItem('translateLanguage', langCode);
            localStorage.setItem('localeAutoDetected', 'true');
          } else {
            getLanguageFromBrowser();
            localStorage.setItem('localeAutoDetected', 'true');
          }
        } else if (!isManualOverride) {
          getLanguageFromBrowser();
        } else {
          updateUtils({ translateLanguage: 'en' });
        }
      } catch (error) {
        console.error('Translation locale detection failed:', error);
        getLanguageFromBrowser();
      }
    };

    initLocale();
  }, []);

  return (
    <TranslationContext.Provider
      value={{
        ...utils,
        translatePages,
        updateTranslationContext: updateUtils,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

const useTranslationContext = () => {
  return useContext(TranslationContext);
};

export { useTranslationContext, TranslationProvider };

const pagesWithKeys = {
  '/': 'homepage',
  '/shopping-cart': 'cart',
  '/checkout': 'checkout',
  '/contact-us': 'contact',
  '/order-success': 'thankYou',
  '/auth': 'auth',
  '/forgot-password': 'forgotPasswordPage',
  '/gift-cards': 'giftCard',
  '/gift-cards/buy': 'buyGiftCard',
  '/privacy-policy': 'legal',
  '/return-policy': 'legal',
  '/terms-conditions': 'legal',
};
