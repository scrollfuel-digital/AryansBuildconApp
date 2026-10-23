
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

    if (!user || !pass) {
        throw new Error(
            `SMTP credentials missing: user=${Boolean(user)}, pass=${Boolean(pass)}`
        );
    }

    const isGmail =
        (process.env.SMTP_HOST || "").toLowerCase().includes("gmail") ||
        user.toLowerCase().includes("gmail");

    const transportOptions = isGmail
        ? {
            service: "gmail",
            auth: {
                user,
                pass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        }
        : {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 465),
            secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
            auth: {
                user,
                pass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        };

    const transporter = nodemailer.createTransport(transportOptions);

    try {

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || user,
            to: email,
            subject: "Aryans Buildcon - Email Verification",
            text: `Your verification code is ${otp}. It expires in 5 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Aryans Buildcon</h2>
                    <p>Your verification code is:</p>
                    <h1>${otp}</h1>
                    <p>This code expires in 5 minutes.</p>
                </div>
            `,
        });

        return info;
    } finally {
        transporter.close();
    }
};
