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

const buildProductSchema = (product, websiteUrl = DEFAULT_WEBSITE_URL) => {
  if (!product) return null;
  const baseUrl = normalizeUrl(websiteUrl);

  const name =
    firstDefined(
      product?.metaTitle,
      product?.productName?.en,
      product?.name?.en,
      product?.productName,
      product?.name
    ) || "Product";

  const description = stripHtml(
    firstDefined(
      product?.metaDescription,
      product?.productDescription?.en,
      product?.productDescription
    ) || ""
  );

  const price = Number(product?.price || product?.websitePrice || 0);
  const skuVal =
    product?.skus?.[0]?.sku ||
    product?.sku ||
    (typeof product?.skus === "string" ? product.skus : undefined);

  const images = [];
  if (product?.ogImage) images.push(product.ogImage);
  if (product?.image && typeof product.image === "string") {
    const fullImg = product.image.startsWith("http")
      ? product.image
      : `${baseUrl}/uploads/${product.image.replace(/^\/+/, "")}`;
    if (!images.includes(fullImg)) images.push(fullImg);
  }
  if (Array.isArray(product?.images)) {
    product.images.forEach((img) => {
      if (typeof img === "string" && img.trim()) {
        const fullImg = img.startsWith("http")
          ? img
          : `${baseUrl}/uploads/${img.replace(/^\/+/, "")}`;
        if (!images.includes(fullImg)) images.push(fullImg);
      }
    });
  }

  const productUrl =
    product?.canonicalUrl ||
    (product?.slug
      ? `${baseUrl}/product-details/${encodeURIComponent(product.slug)}`
      : product?._id
      ? `${baseUrl}/product-details/${product._id}`
      : baseUrl);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: product?.brand || DEFAULT_WEBSITE_NAME,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: price > 0 ? price : 0,
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product?.status === "Active" || !product?.status
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  if (images.length) schema.image = images.length === 1 ? images[0] : images;
  if (skuVal) schema.sku = skuVal;

  return schema;
};

const buildCategorySchema = (category, websiteUrl = DEFAULT_WEBSITE_URL) => {
  if (!category) return null;
  const baseUrl = normalizeUrl(websiteUrl);

  const name =
    firstDefined(
      category?.metaTitle,
      category?.name?.en,
      category?.name
    ) || "Category";

  const description = stripHtml(
    firstDefined(
      category?.metaDescription,
      `Explore luxury collections in ${name} at ${DEFAULT_WEBSITE_NAME}.`
    )
  );

  const categoryUrl =
    category?.canonicalUrl ||
    (category?.slug
      ? `${baseUrl}/product-listings?category=${encodeURIComponent(category.slug)}`
      : `${baseUrl}/product-listings?category=${encodeURIComponent(category?.name?.en || category?.name || "")}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: categoryUrl,
  };

  if (category?.image && typeof category.image === "string") {
    schema.image = category.image.startsWith("http")
      ? category.image
      : `${baseUrl}/uploads/${category.image.replace(/^\/+/, "")}`;
  }

  return schema;
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

const generateProductSchema = (product, websiteUrl) =>
  JSON.stringify(buildProductSchema(product, websiteUrl), null, 2);

const generateCategorySchema = (category, websiteUrl) =>
  JSON.stringify(buildCategorySchema(category, websiteUrl), null, 2);

module.exports = {
  buildOrganizationSchema,
  buildWebsiteSchema,
  buildGlobalSchema,
  buildPageSchema,
  buildProductSchema,
  buildCategorySchema,
  generateGlobalSchema,
  generatePageSchema,
  generateProductSchema,
  generateCategorySchema,
  normalizeJsonLd,
  stripHtml,
  normalizeUrl,
};

