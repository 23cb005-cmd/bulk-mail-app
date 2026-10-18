import axios from "axios";
import { demoAdapter, isDemoMode } from "./demoBackend";

// BASE_URL is "/" locally and "/<repo>/" when served from a GitHub Pages
// subpath, so build the login URL from it instead of hardcoding "/login".
const loginPath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/login`;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // Swapping the adapter keeps interceptors and call sites untouched, so the
  // demo exercises the same code paths as a real deployment.
  ...(isDemoMode ? { adapter: demoAdapter } : {}),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
