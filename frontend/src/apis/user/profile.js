import { createUserApiClient } from './client';

const profile = createUserApiClient('/api/v1/user/profile', 10000);

// My account
export const updateMyAccount = async (data) => {
  const response = await profile.post('/my-accounts/update', data);
  return response.data;
};
export const getMyAccount = async () => {
  const response = await profile.get('/my-accounts/get');
  return response.data;
};
export const getUserCredits = async () => {
  const response = await profile.get('/my-credits/get');
  return response.data?.data;
};
export const getUserCreditTransactions = async (days = 'all') => {
  const response = await profile.get(`/my-credits/transactions?days=${days}`);
  return response.data?.data;
};

// Address book
export const getAddressBook = async () => {
  const response = await profile.get('/address-book/get');
  return response.data;
};
export const addAddress = async (type, data) => {
  const response = await profile.post(`/address-book/${type}/add`, data);
  return response.data;
};
export const updateAddress = async (type, id, data) => {
  const response = await profile.put(`/address-book/${type}/update/${id}`, data);
  return response.data;
};
export const deleteAddress = async (type, id) => {
  const response = await profile.delete(`/address-book/${type}/delete/${id}`);
  return response.data;
};
export const setDefaultAddress = async (type, id) => {
  const response = await profile.put(`/address-book/${type}/default/${id}`);
  return response.data;
};

// Payment methods
export const updatePaymentMethods = async (data) => {
  const response = await profile.post('/payment-methods/update', data);
  return response.data;
};
export const getPaymentMethods = async () => {
  const response = await profile.get('/payment-methods/get');
  return response.data;
};
export const deletePaymentCard = async (id) => {
  const response = await profile.get(`/payment-methods/delete/${id}`);
  return response.data;
};