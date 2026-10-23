
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const LOCAL_API =
    process.env.EXPO_PUBLIC_APIS_LOCAL || "http://10.237.180.98:8080/api";
const PRODUCTION_API =
    process.env.EXPO_PUBLIC_APIS_PRODUCTION || "https://aryansbuildconapp.onrender.com/api";

const API_URL = __DEV__ ? LOCAL_API : PRODUCTION_API;

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync("authToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(
            "API error:",
            error.response?.status ?? "Network error",
            error.response?.data ?? error.message
        );

        return Promise.reject(error);
    }
);

export default api;
