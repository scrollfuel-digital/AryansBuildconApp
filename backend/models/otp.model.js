
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        otpHash: {
            type: String,
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },

        attempts: {
            type: Number,
            default: 0,
        },

        lastSentAt: {
            type: Date,
            required: true,
        },

        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("EmailOTP", otpSchema);
