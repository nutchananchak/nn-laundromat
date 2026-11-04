import client from './client';

export const fetchSettings = async () => {
  const res = await client.get('/settings', { params: { _t: Date.now() } });
  return res.data;
};

export const saveSettings = async (partial) => {
  const res = await client.put('/settings', partial);
  return res.data;
};

export const fetchRidersApi = async () => (await client.get('/riders')).data;
export const createRiderApi = async (data) => (await client.post('/riders', data)).data;
export const updateRiderApi = async (id, data) => (await client.patch(`/riders/${id}`, data)).data;
export const deleteRiderApi = async (id) => (await client.delete(`/riders/${id}`)).data;