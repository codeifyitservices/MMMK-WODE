const Category = require("../Models/Category");
const Product = require("../Models/Product");

const MIN_QUERY_LENGTH = 2;

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const createNgrams = (value, size = 3) => {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  if (!normalized) return new Set();
  if (normalized.length <= size) return new Set([normalized]);

  const grams = new Set();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
};

const getNgramSimilarity = (source, target, size = 3) => {
  const sourceNgrams = createNgrams(source, size);
  const targetNgrams = createNgrams(target, size);

  if (!sourceNgrams.size || !targetNgrams.size) return 0;

  let intersection = 0;
  sourceNgrams.forEach((gram) => {
    if (targetNgrams.has(gram)) intersection += 1;
  });

  return (2 * intersection) / (sourceNgrams.size + targetNgrams.size);
};

const getTokenOverlapScore = (query, candidate) => {
  const queryTokens = normalizeText(query).split(" ").filter(Boolean);
  const candidateTokens = normalizeText(candidate).split(" ").filter(Boolean);

  if (!queryTokens.length || !candidateTokens.length) return 0;

  let matches = 0;
  queryTokens.forEach((queryToken) => {
    const hasMatch = candidateTokens.some(
      (candidateToken) =>
        candidateToken.includes(queryToken) ||
        queryToken.includes(candidateToken) ||
        getNgramSimilarity(queryToken, candidateToken) >= 0.45
    );

    if (hasMatch) matches += 1;
  });

  return matches / queryTokens.length;
};

const scoreCandidate = (query, searchableText) => {
  const normalizedQuery = normalizeText(query);
  const normalizedCandidate = normalizeText(searchableText);

  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedQuery) return 1;

  let score = 0;

  if (normalizedCandidate.startsWith(normalizedQuery)) score += 0.35;
  if (normalizedCandidate.includes(normalizedQuery)) score += 0.25;

  score += getTokenOverlapScore(normalizedQuery, normalizedCandidate) * 0.25;
  score += getNgramSimilarity(normalizedQuery, normalizedCandidate) * 0.4;

  return Math.min(score, 1);
};

const getProductSearchText = (product) =>
  [
    product?.productName?.en,
    product?.productDescription?.en,
    product?.brand,
    product?.subCategory,
  ]
    .filter(Boolean)
    .join(" ");

const getCategorySearchText = (category) =>
  [category?.name?.en, ...(category?.subCategory || [])].filter(Boolean).join(" ");

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
          .select("name subCategory createdAt")
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
      score: scoreCandidate(normalizedQuery, getCategorySearchText(category)),
    }))
    .filter((item) => item.score >= 0.2)
    .sort((left, right) => right.score - left.score)
    .map(({ category, score }) => mapCategoryResult(category, score));

  const scoredProducts = products
    .map((product) => ({
      product,
      score: scoreCandidate(normalizedQuery, getProductSearchText(product)),
    }))
    .filter((item) => item.score >= 0.18)
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
