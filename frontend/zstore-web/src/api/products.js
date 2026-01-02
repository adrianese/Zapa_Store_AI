import api from './client';

export const getProducts = (params) => {
  return api.get('/products', { params });
};

export const getProduct = (id) => {
  return api.get(`/products/${id}`);
};

export const createProduct = (productData) => {
  return api.post('/products', productData);
};

export const updateProduct = (id, productData) => {
  return api.put(`/products/${id}`, productData);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};
