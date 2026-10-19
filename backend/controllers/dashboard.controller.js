
import User from "../models/User.js";
import Project from "../models/Project.js";
import SiteVisit from "../models/SiteVisit.js";
import AdvisorLocation from "../models/AdvisorLocation.js";

// GET /api/dashboard/summary
export const getDashboardSummary = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const [
            totalAdvisors,
            activeAdvisors,
            totalProjects,
            totalVisits,
            todayVisits,
        ] = await Promise.all([
            User.countDocuments({ role: "advisor" }),
            User.countDocuments({ role: "advisor", status: "active" }),
            Project.countDocuments({ status: "active" }),
            SiteVisit.countDocuments(),
            SiteVisit.countDocuments({
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay,
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalAdvisors,
                activeAdvisors,
                totalProjects,
                totalVisits,
                todayVisits,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary",
            error: error.message,
        });
    }
};

// GET /api/dashboard/active-advisors
export const getActiveAdvisors = async (req, res) => {
    try {
        const advisors = await User.find({ role: "advisor", status: "active" })
            .select("name email mobile status employeeId designation")
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: advisors.length,
            data: advisors,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch active advisors",
            error: error.message,
        });
    }
};

// GET /api/dashboard/recent-visits
export const getRecentVisits = async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
            100
        );

        const visits = await SiteVisit.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("advisorId", "name email mobile")
            .populate("projectId", "name location")
            .lean();

        return res.status(200).json({
            success: true,
            count: visits.length,
            data: visits,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch recent visits",
            error: error.message,
        });
    }
};
