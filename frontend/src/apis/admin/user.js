import { createAdminApiClient } from './client';

const user = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/user`
);

export const createUser = async (data) => {
  try {
    const response = await user.post('/create', data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await user.post(`/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getSingleUser = async (id) => {
  try {
    const response = await user.get(`/get/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getAllUsers = async (options) => {
  try {
    const response = await user.get(`/get-all`, { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await user.get(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
