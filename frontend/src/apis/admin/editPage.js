import { createAdminApiClient } from './client';

const editPage = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/editPage`
);

//  ################################################# Home ####################################################

// Banner
export const updateHomeBanner = async (data) => {
  const response = await editPage.post('/home/banner/update', data);
  return response.data;
};

export const getHomeBanner = async () => {
  const response = await editPage.get('/home/banner/get');
  return response?.data?.data[0];
};

// section2
export const updateHomeSection2 = async (data) => {
  const response = await editPage.post('/home/section2/update', data);
  return response.data;
};

export const getHomeSection2 = async () => {
  const response = await editPage.get('/home/section2/get');
  return response?.data;
};

// section 8
export const updateHomeSection8 = async (data) => {
  const response = await editPage.post('/home/section8/update', data);
  return response.data;
};

export const getHomeSection8 = async () => {
  const response = await editPage.get('/home/section8/get');
  return response?.data;
};

// section 9
export const updateHomeSection9 = async (data) => {
  const response = await editPage.post('/home/section9/update', data);
  return response.data;
};

export const getHomeSection9 = async () => {
  const response = await editPage.get('/home/section9/get');
  return response?.data;
};

// section 11
export const updateHomeSection11 = async (data) => {
  const response = await editPage.post('/home/section11/update', data);
  return response.data;
};

export const getHomeSection11 = async () => {
  const response = await editPage.get('/home/section11/get');
  return response?.data;
};

// section 12
export const updateHomeSection12 = async (data) => {
  const response = await editPage.post('/home/section12/update', data);
  return response.data;
};
export const getHomeSection12 = async () => {
  const response = await editPage.get('/home/section12/get');
  return response?.data;
};

// section products
export const updateSectionProducts = async (data) => {
  const response = await editPage.post('/home/section-products/update', data);
  return response.data;
};

export const getSectionProducts = async () => {
  const response = await editPage.get('/home/section-products/get');
  return response.data;
};

// ------------------------------------------ Footer ---------------------------------
export const updateFooter = async (data) => {
  const response = await editPage.post('/footer/update', data);
  return response.data;
};

export const getFooter = async () => {
  const response = await editPage.get('/footer/get');
  return response?.data;
};

export const getAdminTopStrip = async () => {
  const response = await editPage.get('/top-strip/get');
  return response?.data?.data;
};

export const updateTopStrip = async (data) => {
  const response = await editPage.post('/top-strip/update', data);
  return response?.data;
};
