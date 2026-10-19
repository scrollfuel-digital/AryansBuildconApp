import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        mobile: {
            type: String,
            trim: true,
        },

        designation: {
            type: String,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["admin", "advisor"],
            required: true,
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },

        photoUrl: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;