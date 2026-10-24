import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import SiteVisit from "../models/SiteVisit.js";
import { uploadToCloudinary } from "./upload.controller.js";

const getUserId = (req) => req.user?._id || req.user?.id;

export const listAdvisors = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const filter = { role: "advisor" };

        if (status && ["active", "inactive"].includes(status)) filter.status = status;
        if (search?.trim()) {
            filter.$or = [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } },
                { mobile: { $regex: search.trim(), $options: "i" } },
                { employeeId: { $regex: search.trim(), $options: "i" } },
            ];
        }

        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const [advisors, total] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 })
                .skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
            User.countDocuments(filter),
        ]);

        const counts = await SiteVisit.aggregate([
            { $match: { advisorId: { $in: advisors.map((a) => a._id) }, status: { $ne: "cancelled" } } },
            { $group: { _id: "$advisorId", totalVisits: { $sum: 1 } } },
        ]);
        const countMap = new Map(counts.map((item) => [String(item._id), item.totalVisits]));

        return res.status(200).json({
            success: true,
            data: advisors.map((advisor) => ({
                ...advisor,
                totalVisits: countMap.get(String(advisor._id)) || 0,
            })),
            pagination: { page: safePage, limit: safeLimit, total },
        });
    } catch (error) {
        console.error("List advisors error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch advisors" });
    }
};

export const getAdvisor = async (req, res) => {
    try {
        const { id } = req.params;
        const filter = mongoose.isValidObjectId(id)
            ? { _id: id, role: "advisor" }
            : { employeeId: id, role: "advisor" };

        const advisor = await User.findOne(filter).select("-password");
        if (!advisor) return res.status(404).json({ success: false, message: "Advisor not found" });

        return res.status(200).json({ success: true, data: advisor });
    } catch (error) {
        console.error("Get advisor error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch advisor" });
    }
};

export const createAdvisor = async (req, res) => {
    try {
        const { name, email, mobile, password, photoUrl = "" } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }
        if (!photoUrl?.trim()) {
            return res.status(400).json({ success: false, message: "Live photo is mandatory to register an advisor" });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, ...(mobile ? [{ mobile: mobile.trim() }] : [])],
        });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email or mobile is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        // Sequential count IDs can collide after deletions or concurrent requests.
        // For a small initial project this matches your existing ADV001 convention.
        const advisorCount = await User.countDocuments({ role: "advisor" });
        const employeeId = `ADV${String(advisorCount + 1).padStart(3, "0")}`;

        let finalAdvisorPhotoUrl = photoUrl.trim();
        if (finalAdvisorPhotoUrl.startsWith("data:image/")) {
            try {
                const uploadResult = await uploadToCloudinary(finalAdvisorPhotoUrl, "advisors");
                finalAdvisorPhotoUrl = uploadResult.secure_url;
            } catch (uploadErr) {
                console.error("Failed to upload advisor photo to Cloudinary:", uploadErr.message);
            }
        }

        const advisor = await User.create({
            employeeId,
            name: name.trim(),
            email: normalizedEmail,
            mobile: mobile?.trim() || "",
            password: hashedPassword,
            role: "advisor",
            status: "active",
            photoUrl: finalAdvisorPhotoUrl,
        });

        return res.status(201).json({
            success: true,
            message: "Advisor created successfully",
            data: {
                id: advisor._id,
                employeeId: advisor.employeeId,
                name: advisor.name,
                email: advisor.email,
                mobile: advisor.mobile,
                role: advisor.role,
                status: advisor.status,
                photoUrl: advisor.photoUrl,
            },
        });
    } catch (error) {
        console.error("Create advisor error:", error);
        if (error.code === 11000) return res.status(409).json({ success: false, message: "Email or employee ID already exists" });
        return res.status(500).json({ success: false, message: "Failed to create advisor" });
    }
};

export const updateAdvisor = async (req, res) => {
    try {
        const filter = mongoose.isValidObjectId(req.params.id)
            ? { _id: req.params.id, role: "advisor" }
            : { employeeId: req.params.id, role: "advisor" };
        const updates = {};
        for (const key of ["name", "mobile", "designation", "employeeId"]) {
            if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
        }
        if (req.body.email !== undefined) updates.email = String(req.body.email).toLowerCase().trim();
        if (req.body.photoUrl !== undefined) updates.photoUrl = String(req.body.photoUrl).trim();

        if (!Object.keys(updates).length) {
            return res.status(400).json({ success: false, message: "Provide name, email, mobile, or designation to update" });
        }

        const advisor = await User.findOneAndUpdate(filter, { $set: updates }, { new: true, runValidators: true }).select("-password");
        if (!advisor) return res.status(404).json({ success: false, message: "Advisor not found" });

        return res.status(200).json({ success: true, message: "Advisor updated successfully", data: advisor });
    } catch (error) {
        console.error("Update advisor error:", error);
        if (error.code === 11000) return res.status(409).json({ success: false, message: "Email is already registered" });
        return res.status(500).json({ success: false, message: "Failed to update advisor" });
    }
};

export const setAdvisorStatus = async (req, res) => {
    try {
        if (!["active", "inactive"].includes(req.body.status)) {
            return res.status(400).json({ success: false, message: "Status must be active or inactive" });
        }
        const filter = mongoose.isValidObjectId(req.params.id)
            ? { _id: req.params.id, role: "advisor" }
            : { employeeId: req.params.id, role: "advisor" };
        const advisor = await User.findOneAndUpdate(filter, { status: req.body.status }, { new: true }).select("-password");
        if (!advisor) return res.status(404).json({ success: false, message: "Advisor not found" });
        return res.status(200).json({ success: true, message: "Advisor status updated", data: advisor });
    } catch (error) {
        console.error("Update advisor status error:", error);
        return res.status(500).json({ success: false, message: "Failed to update advisor status" });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const advisor = await User.findById(getUserId(req)).select("-password");
        if (!advisor) return res.status(404).json({ success: false, message: "Profile not found" });
        return res.status(200).json({ success: true, data: advisor });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile" });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const updates = {};
        for (const key of ["name", "mobile", "designation"]) {
            if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
        }
        if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "Provide name, mobile, or designation to update" });

        const advisor = await User.findByIdAndUpdate(getUserId(req), { $set: updates }, { new: true, runValidators: true }).select("-password");
        if (!advisor) return res.status(404).json({ success: false, message: "Profile not found" });
        return res.status(200).json({ success: true, message: "Profile updated successfully", data: advisor });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};
