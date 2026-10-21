
import api from "./api";
import * as SecureStore from "expo-secure-store";

export const advisorLogin = async (identifier, password) => {
    const cleanId = String(identifier || "").trim();
    const response = await api.post("/auth/login", {
        email: cleanId.toLowerCase(),
        identifier: cleanId,
        password: password,
    });

    const result = response.data;

    if (!result.success || !result.token) {
        throw new Error(result.message || "Login failed");
    }

    const role = result.user?.role || "advisor";
    await SecureStore.setItemAsync("authToken", result.token);
    await SecureStore.setItemAsync("userRole", role);

    return result;
};

export const loginUser = advisorLogin;

// Register new advisor account
export const advisorRegister = async (advisorData) => {
    const response = await api.post("/auth/advisor/register", {
        name: advisorData.name || advisorData.fullName,
        email: advisorData.email.trim().toLowerCase(),
        mobile: advisorData.mobile ? String(advisorData.mobile).trim() : undefined,
        employeeId: advisorData.employeeId ? String(advisorData.employeeId).trim() : undefined,
        designation: advisorData.designation ? String(advisorData.designation).trim() : undefined,
        password: advisorData.password,
    });

    const result = response.data;

    if (!result.success) {
        throw new Error(result.message || "Advisor registration failed");
    }

    return result;
};

// 2. Create advisor (admin authorization required)
export const createAdvisor = async (advisorData) => {
    const response = await api.post("/advisor", {
        name: advisorData.name.trim(),
        email: advisorData.email.trim().toLowerCase(),
        mobile: advisorData.mobile.trim(),
        password: advisorData.password,
    });

    const result = response.data;

    if (!result.success) {
        throw new Error(result.message || "Advisor creation failed");
    }

    return result;
};

// 3. Logout advisor
export const advisorLogout = async () => {
    try {
        const response = await api.post("/auth/logout");
        return response.data;
    } finally {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("userRole");
    }
};

// 4. Get current advisor profile
export const getAdvisorProfile = async () => {
    const response = await api.get("/profile/advisor");
    return response.data;
};

// 5. Update advisor profile
export const updateAdvisorProfile = async (updates) => {
    const response = await api.put("/profile/advisor", updates);
    return response.data;
};