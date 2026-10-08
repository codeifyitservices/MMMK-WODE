import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslationContext } from '../../context/TranslationContext';

const DEFAULT_TITLE = 'MMMK Wode | Luxury Ecommerce';
const DEFAULT_DESCRIPTION =
  'Shop luxury jewelry, fragrance, swimwear, and curated fashion collections from MMMK Wode.';

const META_BY_PATH = {
  '/': {
    title: 'MMMK Wode | Luxury Jewelry, Fragrance & Swimwear',
    description:
      'Discover luxury jewelry, fragrance, swimwear, and curated fashion collections from MMMK Wode.',
  },
  '/product-listings': {
    title: 'Shop Collections | MMMK Wode',
    description:
      'Browse curated product listings across jewelry, fragrance, swimwear, and fashion at MMMK Wode.',
  },
  '/about-us': {
    title: 'About MMMK Wode',
    description:
      'Learn about MMMK Wode, our story, and the luxury lifestyle collections we create.',
  },
  '/contact-us': {
    title: 'Contact MMMK Wode',
    description:
      'Reach out to MMMK Wode customer support for product, order, and store enquiries.',
  },
  '/gift-cards': {
    title: 'Gift Cards | MMMK Wode',
    description:
      'Buy gift cards from MMMK Wode for luxury shopping and curated gifting.',
  },
  '/shopping-cart': {
    title: 'Shopping Cart | MMMK Wode',
    description: 'Review the items in your MMMK Wode shopping cart before checkout.',
  },
  '/auth': {
    title: 'Sign In | MMMK Wode',
    description: 'Sign in to your MMMK Wode account to manage orders and saved items.',
  },
};

const setMetaTag = (selector, attribute, value) => {
  if (!value) return;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

const setLinkTag = (selector, attribute, value) => {
  if (!value) return;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

const Seo = () => {
  const { pathname } = useLocation();
  const { translateLanguage } = useTranslationContext();

  useEffect(() => {
    const matchedPath = Object.keys(META_BY_PATH).find(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
    const nextMeta = META_BY_PATH[matchedPath] || {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };

    document.title = nextMeta.title;
    document.documentElement.lang = translateLanguage || 'en';
    document.documentElement.dir = translateLanguage === 'ar' ? 'rtl' : 'ltr';

    setMetaTag('meta[name="description"]', 'content', nextMeta.description);
    setMetaTag('meta[property="og:title"]', 'content', nextMeta.title);
    setMetaTag('meta[property="og:description"]', 'content', nextMeta.description);
    setMetaTag('meta[name="twitter:title"]', 'content', nextMeta.title);
    setMetaTag(
      'meta[name="twitter:description"]',
      'content',
      nextMeta.description
    );

    if (typeof window !== 'undefined') {
      setLinkTag('link[rel="canonical"]', 'rel', 'canonical');
      setLinkTag('link[rel="canonical"]', 'href', `${window.location.origin}${pathname}`);
    }
  }, [pathname, translateLanguage]);

  return null;
};

export default Seo;
