import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../database/conn.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();

        const adminAccounts = [
            {
                email: "admin@company.com",
                employeeId: "ADMIN001",
                name: "System Admin",
            },
            {
                email: "admin@aryansbuildcon.com",
                employeeId: "ADMIN002",
                name: "Aryans Buildcon Admin",
            },
        ];

        const hashedPassword = await bcrypt.hash("Admin@123", 12);

        for (const account of adminAccounts) {
            const existing = await User.findOne({ email: account.email });
            if (!existing) {
                await User.create({
                    ...account,
                    password: hashedPassword,
                    role: "admin",
                    status: "active",
                });
                console.log(`Admin created: ${account.email}`);
            } else {
                console.log(`Admin already exists: ${account.email}`);
            }
        }

        console.log("Default Password: Admin@123");
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Admin creation failed:", error);
        process.exit(1);
    }
};

createAdmin();