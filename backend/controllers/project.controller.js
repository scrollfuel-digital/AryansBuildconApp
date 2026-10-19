import mongoose from "mongoose";
import Project from "../models/Project.js";
import SiteVisit from "../models/SiteVisit.js";

export const listProjects = async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role !== "admin") filter.status = "active";
    else if (
      req.query.status &&
      ["active", "inactive"].includes(req.query.status)
    )
      filter.status = req.query.status;

    const projects = await Project.find(filter).sort({ name: 1 });
    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("List projects error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch projects" });
  }
};

export const getProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    const project = await Project.findById(req.params.id);
    if (
      !project ||
      (req.user?.role !== "admin" && project.status !== "active")
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    return res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Get project error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch project" });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, location, description = "" } = req.body;
    if (!name?.trim() || !location?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Name and location are required" });
    const project = await Project.create({
      name: name.trim(),
      location: location.trim(),
      description,
      createdBy: req.user?._id || req.user?.id,
    });
    return res
      .status(201)
      .json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
  } catch (error) {
    console.error("Create project error:", error);
    if (error.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "Project already exists" });
    return res
      .status(500)
      .json({ success: false, message: "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    const updates = {};
    for (const key of ["name", "location", "description", "status"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!Object.keys(updates).length)
      return res
        .status(400)
        .json({ success: false, message: "No fields provided to update" });
    if (updates.status && !["active", "inactive"].includes(updates.status))
      return res
        .status(400)
        .json({ success: false, message: "Status must be active or inactive" });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res
      .status(200)
      .json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
  } catch (error) {
    console.error("Update project error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID" });
    const force = req.query.force === "true" || req.body?.force === true;
    const used = await SiteVisit.exists({ projectId: req.params.id });
    if (used && !force) {
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { status: "inactive" },
        { new: true },
      );
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      return res
        .status(200)
        .json({
          success: true,
          message: "Project deactivated to preserve site visit history",
          data: project,
        });
    }

    if (used && force) {
      await SiteVisit.updateMany({ projectId: req.params.id }, { $unset: { projectId: 1 } });
    }

    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    return res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete project" });
  }
};
