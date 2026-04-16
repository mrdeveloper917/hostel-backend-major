import nodemailer from "nodemailer";

let transporterPromise;

const createTransporter = async () => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return nodemailer.createTransport({
      jsonTransport: true,
    });
  })();

  return transporterPromise;
};

export const sendOtpEmail = async ({ to, name, otp, expiryMinutes }) => {
  const transporter = await createTransporter();
  const from =
    process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@hostel.local";

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Your Hostel Password Reset OTP",
    text: `Hello ${name || "User"}, your OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f5f7fb;">
        <div style="background:#ffffff;border-radius:18px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <p style="margin:0 0 12px;font-size:14px;color:#64748b;">Smart Hostel Management System</p>
          <h2 style="margin:0 0 12px;color:#0f172a;">Password Reset OTP</h2>
          <p style="margin:0 0 18px;color:#334155;line-height:1.6;">
            Hello ${name || "User"}, use the OTP below to reset your password.
          </p>
          <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#0f172a;background:#e2e8f0;border-radius:16px;padding:16px 20px;text-align:center;">
            ${otp}
          </div>
          <p style="margin:18px 0 0;color:#475569;line-height:1.6;">
            This OTP expires in ${expiryMinutes} minutes. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  if (info.message) {
    console.log("OTP email payload:", info.message.toString());
  }

  return info;
};
