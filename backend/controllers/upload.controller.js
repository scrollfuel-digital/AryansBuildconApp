import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import SiteVisit from "../models/SiteVisit.js";

export const ensureCloudinaryConfig = () => {
    const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || "u0iaguoq").trim();
    const api_key = (process.env.CLOUDINARY_API_KEY || "111584191873446").trim();
    const api_secret = (process.env.CLOUDINARY_API_SECRET || "zlzlOztGVHG668UTJ6NWe4aTjZk").trim();

    cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
    });

    return { cloud_name, api_key, api_secret };
};

ensureCloudinaryConfig();

export const uploadToCloudinary = async (imageInput, folder = "site-visits") => {
    ensureCloudinaryConfig();
    const result = await cloudinary.uploader.upload(imageInput, {
        folder,
        resource_type: "image",
        transformation: [
            { width: 1600, height: 1600, crop: "limit" },
        ],
    });

    if (!result.secure_url || !result.public_id) {
        throw new Error("Cloudinary did not return a valid image URL");
    }

    return {
        secure_url: result.secure_url,
        public_id: result.public_id,
    };
};

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WebP images are allowed"));
        }
        return cb(null, true);
    },
}).single("photo");

export const uploadSitePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Photo is required in form field 'photo'",
            });
        }

        const image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await uploadToCloudinary(image, "site-visits");

        return res.status(201).json({
            success: true,
            message: "Photo uploaded successfully",
            photoUrl: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Upload site photo error:", error.message || error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload photo",
        });
    }
};

export const deleteSitePhoto = async (req, res) => {
    try {
        ensureCloudinaryConfig();
        const { id } = req.params;
        if (!id || !id.startsWith("site-visits/"))
            return res
                .status(400)
                .json({ success: false, message: "Invalid photo public ID" });

        // Only permit deleting an image that is not attached to a site visit.
        const attached = await SiteVisit.exists({ photoPublicId: id });
        if (attached)
            return res
                .status(409)
                .json({
                    success: false,
                    message: "Photo is attached to a site visit and cannot be deleted",
                });

        const result = await cloudinary.uploader.destroy(id, {
            resource_type: "image",
        });
        if (!["ok", "not found"].includes(result.result))
            return res
                .status(400)
                .json({ success: false, message: "Unable to delete photo" });
        return res
            .status(200)
            .json({ success: true, message: "Photo deleted successfully" });
    } catch (error) {
        console.error("Delete site photo error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to delete photo" });
    }
};
