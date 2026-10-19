import api from "./api";

export const getAdvisorDashboardSummary = async () => {
    const response = await api.get("/advisor-dashboard/summary");
    return response.data;
};

export const getMySiteVisits = async () => {
    const response = await api.get("/site-visits/my");
    return response.data;
};

export const createSiteVisit = async (visitData) => {
    const response = await api.post("/site-visits", visitData);
    return response.data;
};

export const getActiveProjects = async () => {
    const response = await api.get("/projects");
    return response.data;
};

export const uploadSiteVisitPhoto = async (photoUri) => {
    try {
        const formData = new FormData();
        const filename = photoUri.split("/").pop() || "photo.jpg";
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
        console.log("Photo upload error:", err?.response?.data || err.message);
        throw err;
    }
};
