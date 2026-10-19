import api from "./api";

export const sendOTP = async (email, type = "signup") => {
    const response = await api.post("/auth/otp/send", {
        email: email.trim().toLowerCase(),
        type,
    });

    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post("/auth/otp/verify", {
        email: email.trim().toLowerCase(),
        otp: String(otp),
    });

    return response.data;
};

export const resendOTP = async (email) => {
    const response = await api.post("/auth/otp/resend", {
        email: email.trim().toLowerCase(),
    });

    return response.data;
};