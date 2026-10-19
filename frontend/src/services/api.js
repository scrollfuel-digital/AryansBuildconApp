
import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_APIS;

if (!API_URL) {
    console.error("Missing EXPO_PUBLIC_APIS in frontend/.env");
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
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
        console.log(
            "API error:",
            error.response?.status ?? "Network error",
            error.response?.data ?? error.message
        );
        return Promise.reject(error);
    }
);

export default api;
