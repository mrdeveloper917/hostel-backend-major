import axios from "axios";
import { API_BASE_URL } from "../config";

let authToken = "";

export const setAuthToken = (token = "") => {
  authToken = token;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export { API_BASE_URL };
