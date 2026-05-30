import axios from "axios";
import { LOCAL_TOKEN_KEY } from "@/config/auth";

const api = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 50000,
});

// 带认证的 API 实例
const authApi = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 50000,
});

// 请求拦截器 - 自动添加 token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_TOKEN_KEY); // 从本地存储获取 token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export async function flightStateApi() {
  const res = await authApi.get("/flight/states/all");
  return res.data;
}

export async function flightPathApi(id: string) {
  const res = await authApi.get(`/flight/tracks?id=${id}`);
  return res.data;
}

export async function loginApi() {
  const res = await api.post("/auth/token");
  return res.data;
}
