export const getActiveAuctionsList = () => {
  return api.get('/auctions/active-list');
};
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

export const getBids = (auctionId) => {
  return api.get('/bids', { params: { auction_id: auctionId } });
};

export const getMinBidAmount = (auctionId) => {
  return api.get('/bids/min-amount', { params: { auction_id: auctionId } });
};
