import api from "./api";

export const promoteUser = async (email: string) => {
  return api.post(`/api/admin?email=${email}`);
};