import mongoose from "mongoose";

const siteVisitSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        customerMobile: {
            type: String,
            required: true,
            trim: true
        },
        customerAddress: {
            type: String,
            required: true,
            trim:true
        },
        seniorName: {
            type: String,
            required: true,
            trim: true
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: false,
            index: true,
        },
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        locationAddress: {
            type: String,
            trim: true,
            default: "",
        },

        photoUrl: {
            type: String,
            required: [true, "Site visit photo is required"],
            trim: true,
            validate: {
                validator: (value) => value.length > 0,
                message: "Please upload a site visit photo",
            },
        },
        photoPublicId: {
            type: String,
            default: "",
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["submitted", "cancelled"],
            default: "submitted",
            index: true,
        },
        visitedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true },
);

siteVisitSchema.index({ advisorId: 1, visitedAt: -1 });
siteVisitSchema.index({ projectId: 1, visitedAt: -1 });
export default mongoose.model("SiteVisit", siteVisitSchema);
