
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, otp) => {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 465);
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

    if (!host || !user || !pass) {
        throw new Error("SMTP_HOST, SMTP_USER, or SMTP_PASS is missing");
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
    });

    try {
        return await transporter.sendMail({
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
    } finally {
        transporter.close();
    }
};
