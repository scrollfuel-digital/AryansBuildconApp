
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import EmailOTP from "../models/otp.model.js";
import generateToken from "../utils/generateToken.js";

// Predefined hardcoded admin accounts for instant & reliable admin authentication
const HARDCODED_ADMINS = [
    {
        email: "admin@aryansbuildcon.com",
        employeeId: "ADMIN002",
        name: "Aryans Buildcon Admin",
        passwords: ["Admin@123", "admin123", "admin@123", "Admin123"],
    },
    {
        email: "admin@company.com",
        employeeId: "ADMIN001",
        name: "System Admin",
        passwords: ["Admin@123", "admin123", "admin@123", "Admin123"],
    },
];

const login = async (req, res, expectedRole = null) => {
    try {
        const { email, password } = req.body;
        const rawIdentifier = (email || req.body.identifier || req.body.employeeId || "").trim();
        const rawPassword = String(password || "").trim();

        if (!rawIdentifier || !rawPassword) {
            return res.status(400).json({
                success: false,
                message: "Email / Employee ID and password are required",
            });
        }

        const lowerId = rawIdentifier.toLowerCase();
        const upperId = rawIdentifier.toUpperCase();

        // 1. Check Hardcoded Admin Credentials First
        const matchedHardcoded = HARDCODED_ADMINS.find(
            (admin) =>
                (admin.email.toLowerCase() === lowerId ||
                 admin.employeeId.toUpperCase() === upperId ||
                 lowerId === "admin") &&
                admin.passwords.includes(rawPassword)
        );

        if (matchedHardcoded) {
            // Find existing admin or ensure an active admin record exists in DB
            let adminUser = await User.findOne({
                $or: [
                    { email: matchedHardcoded.email },
                    { employeeId: matchedHardcoded.employeeId },
                ],
            });

            if (!adminUser) {
                const hashedPassword = await bcrypt.hash("Admin@123", 12);
                adminUser = await User.create({
                    employeeId: matchedHardcoded.employeeId,
                    name: matchedHardcoded.name,
                    email: matchedHardcoded.email,
                    password: hashedPassword,
                    role: "admin",
                    status: "active",
                });
            }

            const token = generateToken(adminUser);

            return res.status(200).json({
                success: true,
                token,
                user: {
                    _id: adminUser._id,
                    id: adminUser._id,
                    employeeId: adminUser.employeeId,
                    name: adminUser.name,
                    email: adminUser.email,
                    mobile: adminUser.mobile,
                    role: "admin",
                    status: adminUser.status || "active",
                },
            });
        }

        // 2. Lookup in MongoDB (advisors or database-registered admins)
        const user = await User.findOne({
            $or: [
                { email: lowerId },
                { employeeId: rawIdentifier },
                { employeeId: upperId },
                { mobile: rawIdentifier },
            ],
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Please check your email/ID and password.",
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is currently inactive. Please contact administrator.",
            });
        }

        let passwordMatched = await bcrypt.compare(
            rawPassword,
            user.password
        );

        if (!passwordMatched && user.role === "admin") {
            if (
                rawPassword === "Admin@123" ||
                rawPassword === "admin123" ||
                rawPassword === "admin@123" ||
                rawPassword === "Admin123"
            ) {
                const isDefault = await bcrypt.compare("Admin@123", user.password);
                if (isDefault) {
                    passwordMatched = true;
                }
            }
        }

        if (!passwordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/ID or password.",
            });
        }

        const token = generateToken(user);

        // Return user with actual role (auto-detected: "admin" or "advisor")
        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role, // "advisor" or "admin"
                status: user.status,
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

export const universalLogin = async (req, res) => {
    return login(req, res);
};

export const advisorLogin = async (req, res) => {
    return login(req, res);
};

export const adminLogin = async (req, res) => {
    return login(req, res);
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

export const resetPassword = async (req, res) => {
    try {
        const { email, identifier, otp, password } = req.body;
        let normalizedEmail = String(email || identifier || "").trim().toLowerCase();
        const cleanPassword = String(password || "").trim();
        const cleanOtp = String(otp || "").trim();

        if (!normalizedEmail || !cleanPassword) {
            return res.status(400).json({
                success: false,
                message: "Email/ID and new password are required.",
            });
        }

        if (cleanPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long.",
            });
        }

        // If not in email format, check if it's an employeeId
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            const userById = await User.findOne({
                $or: [
                    { employeeId: normalizedEmail },
                    { employeeId: normalizedEmail.toUpperCase() },
                    { mobile: normalizedEmail },
                ],
            });
            if (userById && userById.email) {
                normalizedEmail = userById.email.toLowerCase();
            }
        }

        // Verify user exists (or hardcoded admin)
        let user = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!user) {
            const hardcodedAdmin = HARDCODED_ADMINS.find(
                (a) => a.email.toLowerCase() === normalizedEmail
            );
            if (hardcodedAdmin) {
                const defaultHash = await bcrypt.hash("Admin@123", 12);
                user = await User.create({
                    employeeId: hardcodedAdmin.employeeId,
                    name: hardcodedAdmin.name,
                    email: hardcodedAdmin.email,
                    password: defaultHash,
                    role: "admin",
                    status: "active",
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No registered account found with this email or employee ID.",
                });
            }
        }

        const otpRecord = await EmailOTP.findOne({ email: normalizedEmail });

        let isOtpValid = false;
        if (cleanOtp && otpRecord && otpRecord.otpHash) {
            const hash = createHash("sha256").update(cleanOtp).digest("hex");
            const bufferA = Buffer.from(otpRecord.otpHash, "hex");
            const bufferB = Buffer.from(hash, "hex");
            if (bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)) {
                if (otpRecord.expiresAt && otpRecord.expiresAt.getTime() > Date.now()) {
                    isOtpValid = true;
                }
            }
        } else if (otpRecord && otpRecord.verifiedAt) {
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            if (otpRecord.verifiedAt > fifteenMinutesAgo) {
                isOtpValid = true;
            }
        }

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code. Please request a new code.",
            });
        }

        // Hash new password and update user in MongoDB
        const hashedPassword = await bcrypt.hash(cleanPassword, 12);
        user.password = hashedPassword;
        await user.save();

        // Clear OTP record after successful reset
        await EmailOTP.deleteOne({ email: normalizedEmail });

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now sign in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error occurred while resetting password.",
        });
    }
};