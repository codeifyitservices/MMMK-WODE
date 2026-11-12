export const setMetaTag = (selector, attribute, value) => {
  if (typeof document === 'undefined' || !value) return;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

export const setLinkTag = (selector, attribute, value) => {
  if (typeof document === 'undefined' || !value) return;

  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

export const injectJsonLd = (id, jsonString) => {
  if (typeof document === 'undefined') return;

  let script = document.getElementById(id);
  if (!jsonString || !String(jsonString).trim()) {
    if (script) script.remove();
    return;
  }

  try {
    // Validate JSON before injection
    JSON.parse(jsonString);
  } catch (_) {
    return; // Don't inject invalid JSON
  }

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = jsonString;
};

export const removeJsonLd = (id) => {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(id);
  if (script) script.remove();
};

export const applyPageSeo = (meta = {}) => {
  if (typeof document === 'undefined') return;

  const title = meta.title || 'MMMK WODE | Luxury Ecommerce';
  const description =
    meta.description ||
    'Shop luxury jewelry, fragrance, swimwear, and curated fashion collections from MMMK WODE.';

  document.title = title;

  setMetaTag('meta[name="description"]', 'content', description);
  setMetaTag('meta[property="og:title"]', 'content', meta.ogTitle || title);
  setMetaTag(
    'meta[property="og:description"]',
    'content',
    meta.ogDescription || description
  );
  setMetaTag('meta[name="twitter:title"]', 'content', meta.ogTitle || title);
  setMetaTag(
    'meta[name="twitter:description"]',
    'content',
    meta.ogDescription || description
  );

  if (meta.keywords) {
    setMetaTag('meta[name="keywords"]', 'content', meta.keywords);
  }

  if (meta.ogImage) {
    setMetaTag('meta[property="og:image"]', 'content', meta.ogImage);
  }

  if (meta.canonicalUrl) {
    setLinkTag('link[rel="canonical"]', 'rel', 'canonical');
    setLinkTag('link[rel="canonical"]', 'href', meta.canonicalUrl);
  } else if (typeof window !== 'undefined') {
    setLinkTag('link[rel="canonical"]', 'rel', 'canonical');
    setLinkTag(
      'link[rel="canonical"]',
      'href',
      `${window.location.origin}${window.location.pathname}`
    );
  }

  if (meta.schema) {
    injectJsonLd('mmmk-page-schema', meta.schema);
  } else {
    removeJsonLd('mmmk-page-schema');
  }
};

