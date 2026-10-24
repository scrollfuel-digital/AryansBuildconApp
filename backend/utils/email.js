
import { Resend } from "resend";

export const sendVerificationEmail = async (email, otp) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    const replyTo = process.env.EMAIL_REPLY_TO?.trim();

    if (!apiKey || !from) {
        throw new Error(
            "RESEND_API_KEY or EMAIL_FROM is missing"
        );
    }

    if (!email || !otp) {
        throw new Error("Email and OTP are required");
    }

    const safeOtp = String(otp).replace(/\D/g, "");

    if (!safeOtp) {
        throw new Error("Invalid OTP");
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from,
        to: [email],
        ...(replyTo ? { replyTo } : {}),
        subject: "Aryans Buildcon - Email Verification",
        text: `Your verification code is ${safeOtp}. It expires in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2 style="color: #007949;">Aryans Buildcon</h2>
                <p>Your verification code is:</p>
                <h1>${safeOtp}</h1>
                <p>This code expires in 5 minutes.</p>
            </div>
        `,
    });

    if (error) {
        console.error("Resend email error:", {
            message: error.message,
            statusCode: error.statusCode,
        });

        throw new Error("Unable to send verification email");
    }

    console.log("Verification email accepted:", data?.id);

    return data;
};
