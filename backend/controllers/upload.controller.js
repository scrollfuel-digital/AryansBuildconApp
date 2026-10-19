import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";
import SiteVisit from "../models/SiteVisit.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
        if (!req.file)
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Photo is required in form field 'photo'",
                });

        // If Cloudinary is not configured, save locally to disk
        if (
            !process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            const uploadsDir = path.join(process.cwd(), "uploads");
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const ext = req.file.mimetype.split("/")[1] || "jpg";
            const filename = `site_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const filePath = path.join(uploadsDir, filename);
            fs.writeFileSync(filePath, req.file.buffer);

            const host = req.get("host") || "10.237.180.98:8080";
            const protocol = req.protocol || "http";
            const photoUrl = `${protocol}://${host}/uploads/${filename}`;

            return res.status(201).json({
                success: true,
                message: "Photo saved successfully",
                photoUrl,
                publicId: `local_${filename}`,
            });
        }
        const image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(image, {
            folder: "site-visits",
            resource_type: "image",
            transformation: [{ width: 1600, height: 1600, crop: "limit" }],
        });
        return res
            .status(201)
            .json({
                success: true,
                message: "Photo uploaded successfully",
                photoUrl: result.secure_url,
                publicId: result.public_id,
            });
    } catch (error) {
        console.error("Upload site photo error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to upload photo" });
    }
};

export const deleteSitePhoto = async (req, res) => {
    try {
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
