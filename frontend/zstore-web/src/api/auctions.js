import api from './client';

export const getAuctions = (params) => {
  return api.get('/auctions', { params });
};

export const getActiveAuction = () => {
  return api.get('/auctions/active');
};

export const getAuction = (id) => {
  return api.get(`/auctions/${id}`);
};

export const createAuction = (auctionData) => {
  return api.post('/auctions', auctionData);
};

export const updateAuction = (id, auctionData) => {
  return api.put(`/auctions/${id}`, auctionData);
};

export const deleteAuction = (id) => {
  return api.delete(`/auctions/${id}`);
};

export const placeBid = (bidData) => {
  return api.post('/bids', bidData);
};
