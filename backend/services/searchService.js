const Category = require("../Models/Category");
const Product = require("../Models/Product");

const MIN_QUERY_LENGTH = 2;

const CATEGORY_SYNONYMS = {
  fragrance: [
    "perfume",
    "perfumes",
    "perf",
    "scent",
    "scents",
    "oud",
    "attar",
    "cologne",
    "fragrance",
    "fragrances",
  ],
  "design bikni swimwear": [
    "bikini",
    "bikinis",
    "bikni",
    "swimwear",
    "swimsuit",
    "swimsuits",
    "bathing suit",
    "beachwear",
    "monokini",
  ],
  "jewellery & accessories": [
    "jewellery",
    "jewelry",
    "jewel",
    "ring",
    "rings",
    "necklace",
    "necklaces",
    "earring",
    "earrings",
    "bracelet",
    "bracelets",
    "accessories",
    "pendant",
  ],
  "customize sandals": [
    "sandals",
    "sandal",
    "slippers",
    "slipper",
    "slides",
    "footwear",
    "shoes",
  ],
  "ponytail hair": [
    "ponytail",
    "hair",
    "bundles",
    "bundle",
    "comb",
    "wigs",
    "wig",
    "extensions",
  ],
  abayas: ["abaya", "abayas", "kaftan", "cloak"],
  dress: ["dress", "dresses", "gown", "gowns"],
  "fitness/ yoga/ pilate": [
    "fitness",
    "yoga",
    "pilate",
    "pilates",
    "gym",
    "activewear",
    "workout",
  ],
  "vase & natural sand candle": [
    "candle",
    "candles",
    "vase",
    "sand candle",
  ],
};

const STOP_WORDS = new Set([
  "in",
  "on",
  "an",
  "the",
  "is",
  "it",
  "to",
  "at",
  "of",
  "for",
  "and",
  "or",
  "a",
  "with",
  "by",
]);

const cleanHtml = (text = "") =>
  String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCategoryKeywords = (categoryName = "") => {
  const norm = normalizeText(categoryName);
  if (!norm) return [];
  const keywords = new Set([norm]);
  for (const [catKey, syns] of Object.entries(CATEGORY_SYNONYMS)) {
    const normCatKey = normalizeText(catKey);
    if (norm.includes(normCatKey) || normCatKey.includes(norm)) {
      syns.forEach((s) => keywords.add(normalizeText(s)));
    }
  }
  return Array.from(keywords);
};

const isPluralMatch = (a, b) => {
  if (a === b) return true;
  if (a.endsWith("s") && a.slice(0, -1) === b) return true;
  if (a.endsWith("es") && a.slice(0, -2) === b) return true;
  if (b.endsWith("s") && b.slice(0, -1) === a) return true;
  if (b.endsWith("es") && b.slice(0, -2) === a) return true;
  return false;
};

const scoreTokens = (queryTokens, targetTokens) => {
  if (!queryTokens.length || !targetTokens.length) return 0;

  const effectiveQueryTokens = queryTokens.filter((t) => !STOP_WORDS.has(t));
  if (!effectiveQueryTokens.length) return 0;

  let totalMatchScore = 0;
  for (const qToken of effectiveQueryTokens) {
    let bestTokenScore = 0;
    for (const tToken of targetTokens) {
      if (tToken === qToken || isPluralMatch(qToken, tToken)) {
        bestTokenScore = Math.max(bestTokenScore, 1.0);
      } else if (tToken.startsWith(qToken) && qToken.length >= 2) {
        // Prefix match: e.g. "perf" -> "perfume", "biki" -> "bikini"
        bestTokenScore = Math.max(bestTokenScore, 0.85);
      } else if (tToken.includes(qToken) && qToken.length >= 3) {
        // Substring match: e.g. "wear" in "swimwear"
        bestTokenScore = Math.max(bestTokenScore, 0.65);
      }
    }
    totalMatchScore += bestTokenScore;
  }

  return totalMatchScore / effectiveQueryTokens.length;
};

const scoreProduct = (query, product) => {
  const normQuery = normalizeText(query);
  const queryTokens = normQuery.split(" ").filter(Boolean);
  if (!queryTokens.length) return 0;

  const catName = product.category?.name?.en || "";
  const catKeywords = getCategoryKeywords(catName);

  const titleTokens = normalizeText(product.productName?.en || "")
    .split(" ")
    .filter(Boolean);
  const catTokens = catKeywords
    .flatMap((k) => normalizeText(k).split(" "))
    .filter(Boolean);
  const subCatTokens = normalizeText(product.subCategory || "")
    .split(" ")
    .filter(Boolean);
  const brandTokens = normalizeText(product.brand || "")
    .split(" ")
    .filter(Boolean);
  const descTokens = normalizeText(cleanHtml(product.productDescription?.en || ""))
    .split(" ")
    .filter(Boolean);

  const titleScore = scoreTokens(queryTokens, titleTokens);
  const catScore = scoreTokens(queryTokens, catTokens);
  const subCatScore = scoreTokens(queryTokens, subCatTokens);
  const brandScore = scoreTokens(queryTokens, brandTokens);
  const descScore = scoreTokens(queryTokens, descTokens);

  let finalScore = 0;
  if (titleScore > 0) finalScore = Math.max(finalScore, titleScore * 1.0);
  if (catScore > 0) finalScore = Math.max(finalScore, catScore * 0.95);
  if (subCatScore > 0) finalScore = Math.max(finalScore, subCatScore * 0.85);
  if (brandScore > 0) finalScore = Math.max(finalScore, brandScore * 0.75);
  if (descScore > 0) finalScore = Math.max(finalScore, descScore * 0.4);

  return finalScore;
};

const scoreCategory = (query, category) => {
  const normQuery = normalizeText(query);
  const queryTokens = normQuery.split(" ").filter(Boolean);
  if (!queryTokens.length) return 0;

  const catName = category.name?.en || "";
  const catKeywords = getCategoryKeywords(catName);
  const subCategories = [
    ...(Array.isArray(category.subcategories)
      ? category.subcategories.map((s) => (typeof s === "string" ? s : s?.en))
      : []),
    ...(Array.isArray(category.subCategory) ? category.subCategory : []),
  ].filter(Boolean);

  const allTargetTokens = [
    ...catKeywords.flatMap((k) => normalizeText(k).split(" ")),
    ...subCategories.flatMap((s) => normalizeText(s).split(" ")),
  ].filter(Boolean);

  return scoreTokens(queryTokens, allTargetTokens);
};

const mapCategoryResult = (category, score) => ({
  value: category.name.en,
  label: category.name.en,
  type: "Category",
  score,
});

const mapProductSuggestion = (product, score) => ({
  value: product._id,
  label: product?.productName?.en || "",
  type: "Product",
  score,
});

const searchCatalog = async (query, options = {}) => {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return { categories: [], products: [], suggestions: [] };
  }

  const {
    includeCategories = true,
    includeProducts = true,
    suggestionLimit = 8,
    productLimit = 50,
  } = options;

  const [categories, products] = await Promise.all([
    includeCategories
      ? Category.find({})
          .select("name subCategory subcategories createdAt")
          .lean()
      : Promise.resolve([]),
    includeProducts
      ? Product.find({ status: { $ne: "Inactive" } })
          .select(
            "_id category subCategory image images quantity weight brand discount gender status productName productDescription uses benefits price websitePrice reviews filters showOnHomepage homePageBottomSection createdAt"
          )
          .populate([{ path: "category" }])
          .lean()
      : Promise.resolve([]),
  ]);

  const scoredCategories = categories
    .map((category) => ({
      category,
      score: scoreCategory(normalizedQuery, category),
    }))
    .filter((item) => item.score >= 0.5)
    .sort((left, right) => right.score - left.score)
    .map(({ category, score }) => mapCategoryResult(category, score));

  const scoredProducts = products
    .map((product) => ({
      product,
      score: scoreProduct(normalizedQuery, product),
    }))
    .filter((item) => item.score >= 0.4)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return new Date(right.product.createdAt) - new Date(left.product.createdAt);
    });

  return {
    categories: scoredCategories,
    products: scoredProducts.slice(0, productLimit).map(({ product, score }) => ({
      ...product,
      searchScore: score,
    })),
    suggestions: [
      ...scoredCategories.slice(0, Math.ceil(suggestionLimit / 2)),
      ...scoredProducts
        .slice(0, suggestionLimit)
        .map(({ product, score }) => mapProductSuggestion(product, score)),
    ]
      .sort((left, right) => right.score - left.score)
      .slice(0, suggestionLimit),
  };
};

module.exports = {
  searchCatalog,
};
