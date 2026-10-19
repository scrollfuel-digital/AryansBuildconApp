import api from "./api";
import * as SecureStore from "expo-secure-store";

// ==========================================
// 1. ADMIN AUTHENTICATION
// ==========================================

export const adminLogin = async (email, password) => {
    const response = await api.post("/auth/admin/login", {
        email: email.trim().toLowerCase(),
        password: password,
    });

    const result = response.data;
    if (!result.success || !result.token) {
        throw new Error(result.message || "Admin login failed");
    }

    await SecureStore.setItemAsync("authToken", result.token);
    await SecureStore.setItemAsync("userRole", "admin");

    return result;
};

export const adminLogout = async () => {
    try {
        const response = await api.post("/auth/logout");
        return response.data;
    } finally {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userRole");
    }
};

// ==========================================
// 2. DASHBOARD OVERVIEW APIS
// ==========================================

export const getAdminDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

export const getAdminActiveAdvisors = async () => {
    const response = await api.get("/dashboard/active-advisors");
    return response.data;
};

export const getAdminRecentVisits = async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-visits?limit=${limit}`);
    return response.data;
};

// ==========================================
// 3. ADVISOR MANAGEMENT APIS
// ==========================================

export const getAllAdvisors = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/advisor${query ? `?${query}` : ""}`);
    return response.data;
};

export const getAdvisorById = async (id) => {
    const response = await api.get(`/advisor/${id}`);
    return response.data;
};

export const uploadAdvisorPhoto = async (photoUri) => {
    try {
        const formData = new FormData();
        const filename = photoUri.split("/").pop() || "advisor_photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("photo", {
            uri: photoUri,
            name: filename,
            type,
        });

        const response = await api.post("/uploads/site-photo", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (err) {
        console.log("Advisor photo upload error:", err?.response?.data || err.message);
        throw err;
    }
};

export const createAdvisorByAdmin = async (advisorData) => {
    const response = await api.post("/advisor", {
        name: advisorData.name.trim(),
        email: advisorData.email.trim().toLowerCase(),
        mobile: advisorData.mobile?.trim() || "",
        password: advisorData.password,
        photoUrl: advisorData.photoUrl?.trim() || "",
    });
    return response.data;
};

export const updateAdvisorByAdmin = async (id, updates) => {
    const response = await api.put(`/advisor/${id}`, updates);
    return response.data;
};

export const setAdvisorStatus = async (id, status) => {
    const response = await api.patch(`/advisor/${id}/status`, { status });
    return response.data;
};

// ==========================================
// 4. PROJECT MANAGEMENT APIS
// ==========================================

export const getAllProjects = async (status = "") => {
    const query = status ? `?status=${status}` : "";
    const response = await api.get(`/projects${query}`);
    return response.data;
};

export const createProject = async (projectData) => {
    const response = await api.post("/projects", {
        name: projectData.name.trim(),
        location: projectData.location.trim(),
        description: projectData.description?.trim() || "",
        status: projectData.status || "active",
    });
    return response.data;
};

export const updateProject = async (id, updates) => {
    const response = await api.put(`/projects/${id}`, updates);
    return response.data;
};

export const deleteProject = async (id, force = true) => {
    const query = force ? "?force=true" : "";
    const response = await api.delete(`/projects/${id}${query}`);
    return response.data;
};

// ==========================================
// 5. SITE VISITS MONITORING APIS
// ==========================================

export const getAllSiteVisits = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/site-visits${query ? `?${query}` : ""}`);
    return response.data;
};

export const deleteSiteVisit = async (id) => {
    const response = await api.delete(`/site-visits/${id}`);
    return response.data;
};

