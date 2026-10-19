import mongoose from "mongoose";
import AdvisorLocation from "../models/AdvisorLocation.js";
import LocationHistory from "../models/LocationHistory.js";
import User from "../models/User.js";

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid latitude and longitude are required",
        });
    }

    const advisorId = req.user?._id || req.user?.id;
    const recordedAt = new Date();
    const locationData = {
      advisorId,
      latitude: lat,
      longitude: lng,
      recordedAt,
      ...(accuracy !== undefined && Number.isFinite(Number(accuracy))
        ? { accuracy: Number(accuracy) }
        : {}),
    };
    const current = await AdvisorLocation.findOneAndUpdate(
      { advisorId },
      { $set: locationData },
      { upsert: true, new: true, runValidators: true },
    );
    await LocationHistory.create(locationData);
    return res
      .status(200)
      .json({ success: true, message: "Location updated", data: current });
  } catch (error) {
    console.error("Update location error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update location" });
  }
};

export const getAdvisorLocations = async (req, res) => {
  try {
    const locations = await AdvisorLocation.find()
      .populate("advisorId", "employeeId name email mobile status")
      .sort({ recordedAt: -1 });
    return res.status(200).json({ success: true, data: locations });
  } catch (error) {
    console.error("Get advisor locations error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch advisor locations" });
  }
};

export const getAdvisorLocation = async (req, res) => {
  try {
    const { advisorId } = req.params;
    const filter = mongoose.isValidObjectId(advisorId)
      ? { _id: advisorId }
      : { employeeId: advisorId };
    const advisor = await User.findOne({ ...filter, role: "advisor" }).select(
      "_id",
    );
    if (!advisor)
      return res
        .status(404)
        .json({ success: false, message: "Advisor not found" });
    const location = await AdvisorLocation.findOne({
      advisorId: advisor._id,
    }).populate("advisorId", "employeeId name email mobile status");
    if (!location)
      return res
        .status(404)
        .json({ success: false, message: "Location not found" });
    return res.status(200).json({ success: true, data: location });
  } catch (error) {
    console.error("Get advisor location error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch advisor location" });
  }
};

export const getAdvisorLocationHistory = async (req, res) => {
  try {
    const { advisorId } = req.params;
    const filterId = mongoose.isValidObjectId(advisorId)
      ? { _id: advisorId }
      : { employeeId: advisorId };
    const advisor = await User.findOne({ ...filterId, role: "advisor" }).select(
      "_id",
    );
    if (!advisor)
      return res
        .status(404)
        .json({ success: false, message: "Advisor not found" });

    const { startDate, endDate, limit = 500 } = req.query;
    const filter = { advisorId: advisor._id };
    if (startDate || endDate) {
      filter.recordedAt = {};
      if (startDate) {
        const d = new Date(startDate);
        if (Number.isNaN(+d))
          return res
            .status(400)
            .json({ success: false, message: "Invalid startDate" });
        filter.recordedAt.$gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (Number.isNaN(+d))
          return res
            .status(400)
            .json({ success: false, message: "Invalid endDate" });
        filter.recordedAt.$lte = d;
      }
    }
    const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 2000);
    const history = await LocationHistory.find(filter)
      .sort({ recordedAt: -1 })
      .limit(safeLimit);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Location history error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch location history" });
  }
};
