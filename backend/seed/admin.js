import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../database/conn.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();

        const email = "admin@company.com";

        const existingAdmin = await User.findOne({
            email,
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@123",
            12
        );

        await User.create({
            employeeId: "ADMIN001",
            name: "System Admin",
            email,
            password: hashedPassword,
            role: "admin",
            status: "active",
        });

        console.log("Admin created successfully");
        console.log("Email:", email);
        console.log("Password: Admin@123");

        await mongoose.connection.close();

        process.exit(0);
    } catch (error) {
        console.error("Admin creation failed:", error);
        process.exit(1);
    }
};

createAdmin();