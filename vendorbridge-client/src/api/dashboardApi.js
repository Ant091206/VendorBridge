import api from './axios';

export const getDashboardByRole = async (role) => {
  const response = await api.get(`/dashboard/${role}`);
  return response.data;
};
