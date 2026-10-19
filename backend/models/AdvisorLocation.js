
import mongoose from "mongoose";

const advisorLocationSchema = new mongoose.Schema(
    {
        advisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Advisor",
            required: true,
            unique: true,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const AdvisorLocation = mongoose.model(
    "AdvisorLocation",
    advisorLocationSchema
);

export default AdvisorLocation;
