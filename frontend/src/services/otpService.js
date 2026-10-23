import api from "./api";

export const sendOTP = async (email, type = "signup", mobile = "") => {
    const payload = {
        email: email.trim().toLowerCase(),
        type,
    };
    if (mobile) {
        payload.mobile = String(mobile).trim();
    }
    const response = await api.post("/auth/otp/send", payload);
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post("/auth/otp/verify", {
        email: email.trim().toLowerCase(),
        otp: String(otp),
    });

    return response.data;
};

export const resendOTP = async (email, type = "signup", mobile = "") => {
    const payload = {
        email: email.trim().toLowerCase(),
        type,
    };
    if (mobile) {
        payload.mobile = String(mobile).trim();
    }
    const response = await api.post("/auth/otp/resend", payload);
    return response.data;
};

export const resetPassword = async ({ email, identifier, otp, password }) => {
    const response = await api.post("/auth/reset-password", {
        email: email ? email.trim().toLowerCase() : undefined,
        identifier: identifier ? identifier.trim() : undefined,
        otp: String(otp || "").trim(),
        password,
    });

    return response.data;
};