import axios from 'axios';
import { getTranslateProducts } from '../../context/TranslationContext';

// Helper to normalize filter keys for API
const normalizeFilterKey = (key) => key.toLowerCase().replace(/\s+/g, '');

// Create Axios instance
const product = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/products`,
  timeout: 10000,
  withCredentials: true,
});

export const getAllProducts = async (
  { currentPage, categories, gender, brand, price, discount, sort, q, ...customFilters },
  { translateLanguage } = {}
) => {
  const response = await product.get(`/all-products`, {
    params: {
      page: currentPage,
      categories,
      gender,
      brand,
      price,
      discount,
      sort,
      q,
      ...customFilters,
    },
  });

  if (translateLanguage) {
    const translatedData = await getTranslateProducts(
      response.data?.data,
      translateLanguage
    );
    return { ...response.data, data: translatedData };
  }
  return response.data;
};

export const getRelatedProducts = async (productId, translateLanguage) => {
  const response = await product.get(`/related-products/${productId}`);

  if (translateLanguage) {
    const translatedData = await getTranslateProducts(
      response.data?.data,
      translateLanguage
    );
    return translatedData;
  }
  return response.data?.data;
};

export const getAllProductsWithFilters = async (filters) => {
  const response = await product.get(`/all-products-with-filters`, {
    params: filters,
  });
  return response.data;
};

export const getAllBrands = async () => {
  const response = await product.get(`/all-brands`);
  return response.data;
};

export const getSingleProduct = async (id) => {
  const response = await product.get(`/get-single/${id}`);
  return response.data;
};

export const getProductSkus = async (id) => {
  const response = await product.get(`/get-product-skus/${id}`);
  return response.data?.data || [];
};

export const getRandomProducts = async () => {
  const response = await product.get('/get-random');
  return response.data;
};

export const getHomePageBottomSection = async () => {
  const response = await product.get('/home-bootom-section');
  return response?.data?.data;
};

export const searchProducts = async (query, limit = 10) => {
  const response = await product.get('/search', {
    params: { q: query, limit },
  });
  return response?.data?.data || [];
};

export const recordProductView = async (productId, sessionId) => {
  try {
    const response = await product.post(`/view/${productId}`, { sessionId });
    return response.data;
  } catch (error) {
    // Non-blocking for UI
    return null;
  }
};
