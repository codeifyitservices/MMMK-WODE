import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslationContext } from '../../context/TranslationContext';
import {
  setMetaTag,
  setLinkTag,
  injectJsonLd,
  removeJsonLd,
} from '../../utils/seoHelper';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const DEFAULT_TITLE = 'MMMK WODE | Luxury Ecommerce';
const DEFAULT_DESCRIPTION =
  'Shop luxury jewelry, fragrance, swimwear, and curated fashion collections from MMMK WODE.';

const META_BY_PATH = {
  '/': {
    title: 'MMMK WODE | Luxury Jewelry, Fragrance & Swimwear',
    description:
      'Discover luxury jewelry, fragrance, swimwear, and curated fashion collections from MMMK WODE.',
  },
  '/product-listings': {
    title: 'Shop Collections | MMMK WODE',
    description:
      'Browse curated product listings across jewelry, fragrance, swimwear, and fashion at MMMK WODE.',
  },
  '/about-us': {
    title: 'About MMMK WODE',
    description:
      'Learn about MMMK WODE, our story, and the luxury lifestyle collections we create.',
  },
  '/contact-us': {
    title: 'Contact MMMK WODE',
    description:
      'Reach out to MMMK WODE customer support for product, order, and store enquiries.',
  },
  '/gift-cards': {
    title: 'Gift Cards | MMMK WODE',
    description:
      'Buy gift cards from MMMK WODE for luxury shopping and curated gifting.',
  },
  '/shopping-cart': {
    title: 'Shopping Cart | MMMK WODE',
    description:
      'Review the items in your MMMK WODE shopping cart before checkout.',
  },
  '/auth': {
    title: 'Sign In | MMMK WODE',
    description:
      'Sign in to your MMMK WODE account to manage orders and saved items.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | MMMK WODE',
    description:
      'Read the official Privacy Policy and data protection terms for MMMK WODE.',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions | MMMK WODE',
    description:
      'Read the official Terms and Conditions for shopping at MMMK WODE.',
  },
  '/return-policy': {
    title: 'Return & Exchange Policy | MMMK WODE',
    description:
      'Read the official Return, Exchange, and Refund Policy for MMMK WODE.',
  },
};

const Seo = () => {
  const { pathname } = useLocation();
  const { translateLanguage } = useTranslationContext();
  const [globalSeo, setGlobalSeo] = useState(null);

  // 1. Fetch Global SEO settings once
  useEffect(() => {
    let isMounted = true;
    fetch(`${BACKEND_URL}/api/v1/seo-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && data?.settings) {
          setGlobalSeo(data.settings);
          if (data.settings.seoSchema) {
            injectJsonLd('mmmk-global-schema', data.settings.seoSchema);
          }
        }
      })
      .catch((err) => {
        console.warn('[SEO] Could not load global SEO settings:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Update page-level meta on route change
  useEffect(() => {
    // Let product details and product listings manage their own dynamic SEO & schema
    if (
      pathname.startsWith('/product-details') ||
      pathname.startsWith('/product-listings')
    ) {
      return;
    }

    const matchedPath = Object.keys(META_BY_PATH).find(
      (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
    );

    const siteTitle = globalSeo?.websiteName || 'MMMK WODE';
    const fallbackTitle = `${siteTitle} | Luxury Ecommerce`;
    const fallbackDescription =
      globalSeo?.organizationDescription || DEFAULT_DESCRIPTION;

    const nextMeta = META_BY_PATH[matchedPath] || {
      title: fallbackTitle,
      description: fallbackDescription,
    };

    document.title = nextMeta.title;
    document.documentElement.lang = translateLanguage || 'en';
    document.documentElement.dir = translateLanguage === 'ar' ? 'rtl' : 'ltr';

    setMetaTag('meta[name="description"]', 'content', nextMeta.description);
    setMetaTag('meta[property="og:title"]', 'content', nextMeta.title);
    setMetaTag(
      'meta[property="og:description"]',
      'content',
      nextMeta.description
    );
    setMetaTag('meta[name="twitter:title"]', 'content', nextMeta.title);
    setMetaTag(
      'meta[name="twitter:description"]',
      'content',
      nextMeta.description
    );

    if (globalSeo?.logo) {
      setMetaTag('meta[property="og:image"]', 'content', globalSeo.logo);
    }

    if (typeof window !== 'undefined') {
      setLinkTag('link[rel="canonical"]', 'rel', 'canonical');
      setLinkTag(
        'link[rel="canonical"]',
        'href',
        `${window.location.origin}${pathname}`
      );
    }
  }, [pathname, translateLanguage, globalSeo]);

  return null;
};

export default Seo;
