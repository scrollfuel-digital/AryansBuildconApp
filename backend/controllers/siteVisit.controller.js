
import mongoose from "mongoose";
import SiteVisit from "../models/SiteVisit.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "./upload.controller.js";

const currentUserId = (req) => req.user?._id || req.user?.id;

// CREATE SITE VISIT
export const createSiteVisit = async (req, res) => {
  try {
    const {
      customerName,
      customerMobile,
      customerAddress,
      seniorName,
      projectId,
      latitude,
      longitude,
      locationAddress = "",
      photoUrl,
      photoPublicId = "",
      notes = "",
    } = req.body;

    // Validate required fields
    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerMobile !== "string" ||
      !customerMobile.trim() ||
      typeof customerAddress !== "string" ||
      !customerAddress.trim() ||
      typeof seniorName !== "string" ||
      !seniorName.trim() ||
      latitude === undefined ||
      longitude === undefined ||
      typeof photoUrl !== "string" ||
      !photoUrl.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, mobile, address, senior name, location, and site photo are required",
      });
    }

    // Validate project ID
    let finalProjectId = projectId;

    if (finalProjectId && !mongoose.isValidObjectId(finalProjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // Assign a default active project if no project was selected
    if (!finalProjectId) {
      const defaultProject = await Project.findOne({
        status: "active",
      });

      if (defaultProject) {
        finalProjectId = defaultProject._id;
      }
    }

    // Validate GPS coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    // Ensure the selected project is active
    if (finalProjectId) {
      const project = await Project.findOne({
        _id: finalProjectId,
        status: "active",
      });

      if (!project) {
        return res.status(400).json({
          success: false,
          message: "Active project not found",
        });
      }
    }

    let finalPhotoUrl = photoUrl.trim();
    let finalPhotoPublicId =
      typeof photoPublicId === "string" ? photoPublicId.trim() : "";

    // If photo is passed as a base64 data URI, upload directly to Cloudinary
    if (finalPhotoUrl.startsWith("data:image/")) {
      try {
        const uploadResult = await uploadToCloudinary(finalPhotoUrl, "site-visits");
        finalPhotoUrl = uploadResult.secure_url;
        finalPhotoPublicId = uploadResult.public_id;
      } catch (uploadErr) {
        console.error("Failed to upload base64 photo to Cloudinary:", uploadErr.message);
      }
    }

    // Create site visit
    const visit = await SiteVisit.create({
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerAddress: customerAddress.trim(),
      seniorName: seniorName.trim(),
      projectId: finalProjectId,
      advisorId: currentUserId(req),
      latitude: lat,
      longitude: lng,
      locationAddress: typeof locationAddress === "string" ? locationAddress.trim() : "",
      photoUrl: finalPhotoUrl,
      photoPublicId: finalPhotoPublicId,
      notes: typeof notes === "string" ? notes.trim() : "",
      visitedAt: new Date(),
    });

    await visit.populate([
      {
        path: "projectId",
        select: "name location",
      },
      {
        path: "advisorId",
        select: "employeeId name email mobile",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Site visit submitted successfully",
      data: visit,
    });
  } catch (error) {
    console.error("Create site visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit site visit",
    });
  }
};

// LIST ALL SITE VISITS (ADMIN) / OWN VISITS (ADVISOR)
export const listSiteVisits = async (req, res) => {
  try {
    const {
      advisorId,
      projectId,
      seniorName,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Advisors can only see their own visits
    if (req.user?.role !== "admin") {
      filter.advisorId = currentUserId(req);
    } else if (advisorId) {
      // Accept MongoDB ObjectId or employee ID
      const advisorFilter = mongoose.isValidObjectId(advisorId)
        ? { _id: advisorId }
        : { employeeId: advisorId };

      const advisor = await User.findOne({
        ...advisorFilter,
        role: "advisor",
      }).select("_id");

      if (!advisor) {
        return res.status(400).json({
          success: false,
          message: "Advisor not found",
        });
      }

      filter.advisorId = advisor._id;
    }

    if (projectId) {
      if (!mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      filter.projectId = projectId;
    }

    if (seniorName?.trim()) {
      // Escape special regex characters
      const escapedSeniorName = seniorName
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.seniorName = {
        $regex: escapedSeniorName,
        $options: "i",
      };
    }

    if (status) {
      if (!["submitted", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid site visit status",
        });
      }

      filter.status = status;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.visitedAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate",
          });
        }

        start.setHours(0, 0, 0, 0);
        filter.visitedAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate",
          });
        }

        end.setHours(23, 59, 59, 999);
        filter.visitedAt.$lte = end;
      }
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const [data, total] = await Promise.all([
      SiteVisit.find(filter)
        .select(
          "customerName customerMobile customerAddress seniorName projectId advisorId latitude longitude locationAddress photoUrl photoPublicId notes status visitedAt createdAt updatedAt"
        )
        .populate("advisorId", "employeeId name email mobile")
        .populate("projectId", "name location")
        .sort({ visitedAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),

      SiteVisit.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("List site visits error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site visits",
    });
  }
};

// LIST MY SITE VISITS (ADVISOR)
export const listMySiteVisits = async (req, res) => {
  try {
    const filter = {
      advisorId: currentUserId(req),
    };

    if (req.query.projectId) {
      if (!mongoose.isValidObjectId(req.query.projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      filter.projectId = req.query.projectId;
    }

    const visits = await SiteVisit.find(filter)
      .select(
        "customerName customerMobile customerAddress seniorName projectId advisorId latitude longitude locationAddress photoUrl photoPublicId notes status visitedAt createdAt updatedAt"
      )
      .populate("projectId", "name location")
      .sort({ visitedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: visits,
    });
  } catch (error) {
    console.error("My site visits error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your site visits",
    });
  }
};

// GET SINGLE SITE VISIT
export const getSiteVisit = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site visit ID",
      });
    }

    const visit = await SiteVisit.findById(req.params.id)
      .populate("advisorId", "employeeId name email mobile")
      .populate("projectId", "name location");

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Site visit not found",
      });
    }

    const visitAdvisorId =
      visit.advisorId?._id || visit.advisorId;

    if (
      req.user?.role !== "admin" &&
      String(visitAdvisorId) !== String(currentUserId(req))
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this site visit",
      });
    }

    return res.status(200).json({
      success: true,
      data: visit,
    });
  } catch (error) {
    console.error("Get site visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site visit",
    });
  }
};

// UPDATE SITE VISIT
export const updateSiteVisit = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site visit ID",
      });
    }

    const visit = await SiteVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Site visit not found",
      });
    }

    if (
      req.user?.role !== "admin" &&
      String(visit.advisorId) !== String(currentUserId(req))
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this site visit",
      });
    }

    // Update permitted customer fields, including address
    for (const key of [
      "customerName",
      "customerMobile",
      "customerAddress",
      "seniorName",
      "notes",
    ]) {
      if (req.body[key] !== undefined) {
        if (
          typeof req.body[key] !== "string" ||
          !req.body[key].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${key} must be a non - empty string`,
          });
        }

        visit[key] = req.body[key].trim();
      }
    }

    // Only admins can change visit status
    if (req.body.status !== undefined) {
      if (
        req.user?.role !== "admin" ||
        !["submitted", "cancelled"].includes(req.body.status)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only admins can change visit status",
        });
      }

      visit.status = req.body.status;
    }

    await visit.save();

    await visit.populate([
      {
        path: "advisorId",
        select: "employeeId name email mobile",
      },
      {
        path: "projectId",
        select: "name location",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Site visit updated successfully",
      data: visit,
    });
  } catch (error) {
    console.error("Update site visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update site visit",
    });
  }
};

// CANCEL SITE VISIT
export const cancelSiteVisit = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site visit ID",
      });
    }

    const visit = await SiteVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Site visit not found",
      });
    }

    if (
      req.user?.role !== "admin" &&
      String(visit.advisorId) !== String(currentUserId(req))
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this site visit",
      });
    }

    if (req.user?.role === "admin" || req.query.permanent === "true") {
      await SiteVisit.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Site visit deleted permanently",
      });
    }

    visit.status = "cancelled";
    await visit.save();

    return res.status(200).json({
      success: true,
      message: "Site visit cancelled",
      data: visit,
    });
  } catch (error) {
    console.error("Cancel site visit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel site visit",
    });
  }
};

// DELETE SITE VISIT PERMANENTLY (ADMIN)
export const deleteSiteVisit = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid site visit ID",
      });
    }

    const visit = await SiteVisit.findByIdAndDelete(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: "Site visit not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Site visit deleted successfully",
    });
  } catch (error) {
    console.error("Delete site visit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete site visit",
    });
  }
};

// LIST VISITS FOR A PROJECT
export const listProjectVisits = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const filter = {
      projectId: req.params.projectId,
    };

    // Advisors can only view their own visits
    if (req.user?.role !== "admin") {
      filter.advisorId = currentUserId(req);
    }

    const visits = await SiteVisit.find(filter)
      .select(
        "customerName customerMobile customerAddress seniorName projectId advisorId latitude longitude locationAddress photoUrl photoPublicId notes status visitedAt createdAt updatedAt"
      )
      .populate("advisorId", "employeeId name email")
      .populate("projectId", "name location")
      .sort({ visitedAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      data: visits,
    });
  } catch (error) {
    console.error("Project visits error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project visits",
    });
  }
};
