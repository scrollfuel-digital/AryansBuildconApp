
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import EmailOTP from "../models/otp.model.js";
import generateToken from "../utils/generateToken.js";

const login = async (req, res, expectedRole) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.role !== expectedRole) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        const passwordMatched = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.employeeId || user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

export const advisorLogin = async (req, res) => {
    return login(req, res, "advisor");
};

export const adminLogin = async (req, res) => {
    return login(req, res, "admin");
};

export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user.employeeId || req.user._id,
            name: req.user.name,
            email: req.user.email,
            mobile: req.user.mobile,
            role: req.user.role,
            status: req.user.status,
        },
    });
};

export const logout = async (req, res) => {

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const advisorRegister = async (req, res) => {
    try {
        const {
            name,
            fullName,
            email,
            mobile,
            employeeId: customEmployeeId,
            designation,
            password,
        } = req.body;

        const advisorName = (name || fullName || "").trim();
        const normalizedEmail = (email || "").toLowerCase().trim();
        const cleanMobile = (mobile || "").trim();

        if (!advisorName || !normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required.",
            });
        }

        if (String(password).length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        // Check if email or mobile is already in use
        const existingQuery = [{ email: normalizedEmail }];
        if (cleanMobile) {
            existingQuery.push({ mobile: cleanMobile });
        }
        const existingUser = await User.findOne({ $or: existingQuery });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email or mobile number is already registered. Please log in.",
            });
        }

        // Check if OTP was verified for this email
        const otpRecord = await EmailOTP.findOne({ email: normalizedEmail });
        if (!otpRecord || !otpRecord.verifiedAt) {
            return res.status(400).json({
                success: false,
                message: "Please verify your email with the OTP code first.",
            });
        }

        // Determine employee ID
        let employeeId = customEmployeeId?.trim();
        if (employeeId) {
            const existingId = await User.findOne({ employeeId });
            if (existingId) {
                return res.status(409).json({
                    success: false,
                    message: `Employee ID ${employeeId} is already assigned. Please use another or leave blank.`,
                });
            }
        } else {
            const advisorCount = await User.countDocuments({ role: "advisor" });
            let counter = advisorCount + 1;
            while (await User.exists({ employeeId: `ADV${String(counter).padStart(3, "0")}` })) {
                counter++;
            }
            employeeId = `ADV${String(counter).padStart(3, "0")}`;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newAdvisor = await User.create({
            employeeId,
            name: advisorName,
            email: normalizedEmail,
            mobile: cleanMobile,
            designation: (designation || "").trim(),
            password: hashedPassword,
            role: "advisor",
            status: "active",
        });

        // Clean up OTP record now that registration is complete
        await EmailOTP.deleteOne({ email: normalizedEmail });

        const token = generateToken(newAdvisor);

        return res.status(201).json({
            success: true,
            message: "Advisor registered successfully.",
            token,
            user: {
                id: newAdvisor.employeeId || newAdvisor._id,
                employeeId: newAdvisor.employeeId,
                name: newAdvisor.name,
                email: newAdvisor.email,
                mobile: newAdvisor.mobile,
                role: newAdvisor.role,
                status: newAdvisor.status,
            },
        });
    } catch (error) {
        console.error("Advisor register error:", error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or Employee ID already exists.",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error while registering account.",
        });
    }
};