import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import advisorRoutes from "./routes/advisor.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import advisorDashboardRoutes from "./routes/advisorDashboard.routes.js";
import projectRoutes from "./routes/project.routes.js";
import siteVisitRoutes from "./routes/siteVisit.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import locationRoutes from "./routes/location.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import connectDB from "./database/conn.js";

dotenv.config({ path: "./config.env" });

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/advisor", advisorRoutes);
// dashboard
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/advisor-dashboard", advisorDashboardRoutes);
app.use("/api/projects", projectRoutes);

app.use("/api/site-visits", siteVisitRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/profile", profileRoutes);

const port = process.env.PORT || 8000;

// Start server only after MongoDB connection
const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, "0.0.0.0", () => {
            console.log(`Server is running on port ${port}`);
            console.log(`Local URL: http://localhost:${port}`);
            console.log(`Mobile API URL: http://10.237.180.98:${port}/api`);
            console.log(`Production API URL: https://aryansbuildconapp.onrender.com/api`)
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();