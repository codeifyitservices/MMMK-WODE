const DEFAULT_WEBSITE_URL = "https://mmmk-wode.com";
const DEFAULT_WEBSITE_NAME = "MMMK WODE";
const DEFAULT_SEARCH_PATH = "/product-listings?search={search_term_string}";

const normalizeUrl = (value, fallback = DEFAULT_WEBSITE_URL) => {
  const url = String(value || fallback).trim();
  return url.replace(/\/+$/, "");
};

const firstDefined = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === "")
  );

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolvePageUrl = (page, websiteUrl) => {
  if (page?.canonicalUrl) return page.canonicalUrl;
  const slug = page?.slug ? String(page.slug).replace(/^\/+/, "") : "";
  return slug ? `${websiteUrl}/${encodeURIComponent(slug)}` : websiteUrl;
};

const buildOrganizationSchema = (settings = {}) => {
  const safeSettings = settings || {};
  const websiteUrl = normalizeUrl(safeSettings.websiteUrl);
  const sameAs = (safeSettings.socialMediaLinks || [])
    .map((item) => (item?.url ? String(item.url).trim() : ""))
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: firstDefined(safeSettings.organizationName, DEFAULT_WEBSITE_NAME),
    description: stripHtml(safeSettings.organizationDescription || ""),
    url: websiteUrl,
  };

  if (safeSettings.logo) schema.logo = safeSettings.logo;

  if (safeSettings.contactPhone || safeSettings.contactEmail) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
    };
    if (safeSettings.contactPhone) {
      schema.contactPoint.telephone = safeSettings.contactPhone;
    }
    if (safeSettings.contactEmail) {
      schema.contactPoint.email = safeSettings.contactEmail;
    }
  }

  if (sameAs.length) schema.sameAs = sameAs;

  return schema;
};

const buildWebsiteSchema = (settings = {}) => {
  const safeSettings = settings || {};
  const websiteUrl = normalizeUrl(safeSettings.websiteUrl);
  const searchTarget = `${websiteUrl}${safeSettings.searchPath || DEFAULT_SEARCH_PATH}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: firstDefined(safeSettings.websiteName, DEFAULT_WEBSITE_NAME),
    url: websiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchTarget,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

const buildGlobalSchema = (settings = {}) =>
  [buildOrganizationSchema(settings), buildWebsiteSchema(settings)].filter(
    Boolean
  );

const buildPageSchema = (page, settings = {}) => {
  if (!page) return null;

  const safeSettings = settings || {};
  const websiteUrl = normalizeUrl(safeSettings.websiteUrl);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: firstDefined(page?.metaTitle, page?.title),
    description: firstDefined(
      stripHtml(page?.metaDescription),
      stripHtml(page?.content)
    ),
    url: resolvePageUrl(page, websiteUrl),
  };
};

const normalizeJsonLd = (value, fieldName = "Schema") => {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed, null, 2);
    } catch {
      const err = new Error(`${fieldName} must be valid JSON`);
      err.statusCode = 400;
      throw err;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    const err = new Error(`${fieldName} must be valid JSON`);
    err.statusCode = 400;
    throw err;
  }
};

const generateGlobalSchema = (settings) =>
  JSON.stringify(buildGlobalSchema(settings), null, 2);

const generatePageSchema = (page, settings) =>
  JSON.stringify(buildPageSchema(page, settings), null, 2);

module.exports = {
  buildOrganizationSchema,
  buildWebsiteSchema,
  buildGlobalSchema,
  buildPageSchema,
  generateGlobalSchema,
  generatePageSchema,
  normalizeJsonLd,
  stripHtml,
  normalizeUrl,
};

