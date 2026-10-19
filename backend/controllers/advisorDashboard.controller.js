
import SiteVisit from "../models/SiteVisit.js";

export const getAdvisorDashboard = async (req, res) => {
    try {
        // Use the ID set by your JWT authentication middleware.
        const advisorId = req.user._id || req.user.id;

        if (!advisorId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const [
            totalVisits,
            todayVisits,
            recentVisits,
        ] = await Promise.all([
            SiteVisit.countDocuments({ advisorId }),

            SiteVisit.countDocuments({
                advisorId,
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay,
                },
            }),

            SiteVisit.find({ advisorId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("projectId", "name location")
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                advisor: {
                    id: req.user._id,
                    employeeId: req.user.employeeId,
                    name: req.user.name,
                    email: req.user.email,
                    mobile: req.user.mobile,
                    designation: req.user.designation || "Advisor",
                    role: req.user.role,
                    status: req.user.status,
                },
                totalVisits,
                todayVisits,
                recentVisits,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch advisor dashboard",
            error: error.message,
        });
    }
};
