import axios from 'axios';

// Create Axios instance
const editPage = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/editPage`,
  timeout: 10000,
  withCredentials: true,
});

// Home
export const getSectionProducts = async () => {
  const response = await editPage.get('/home/section-products');
  return response.data;
};

export const getHomeBanner = async () => {
  const response = await editPage.get('/home/banner');
  return response.data;
};
export const getSection2 = async () => {
  const response = await editPage.get('/home/section2');
  return response.data;
};

export const getSection8 = async () => {
  const response = await editPage.get('/home/section8');
  return response.data;
};

export const getSection9 = async () => {
  const response = await editPage.get('/home/section9');
  return response.data;
};

export const getSection11 = async () => {
  const response = await editPage.get('/home/section11');
  return response.data;
};

export const getSection12 = async () => {
  const response = await editPage.get('/home/section12');
  return response.data;
};

export const getFooter = async () => {
  const response = await editPage.get('/home/getFooter');
  return response.data;
};

export const getTopStrip = async () => {
  const response = await editPage.get('/top-strip/get');
  return response.data;
};
