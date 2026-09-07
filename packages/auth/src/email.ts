import { env } from "@kosh-app/env/server";
import nodemailer from "nodemailer";

const RESEND_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 15_000;

async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = `Kosh App <${env.EMAIL_FROM}>`;

  if (env.RESEND_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(`Resend API ${res.status}: ${detail}`);
      }
    } finally {
      clearTimeout(timer);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });
  await transporter.sendMail({ from, to, subject, html });
}

export async function sendVerificationEmail({
  to,
  url,
  otp,
  name,
}: {
  to: string;
  url?: string;
  otp?: string;
  name?: string;
}) {
  const otpDigitsHtml = otp
    ? `<div class="otp-container">
        <div class="otp-title">Your 6-Digit Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-subtitle">Enter this code in the Kosh Mobile App or Website</div>
       </div>`
    : "";

  const linkHtml = url
    ? `<p style="margin-top: 24px;">Or click the button below to verify directly in your browser:</p>
       <div class="btn-container">
         <a href="${url}" class="btn" target="_blank">Verify Email Address</a>
       </div>
       <div class="link-alt">
         Or copy and paste this link in your browser:<br>
         <a href="${url}" style="color: #16a34a;">${url}</a>
       </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Kosh Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #1f2937; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .logo { font-size: 26px; font-weight: 800; color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 24px; letter-spacing: -0.5px; }
    h1 { font-size: 22px; font-weight: 700; margin-top: 0; color: #111827; letter-spacing: -0.3px; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px; }
    .otp-container { background-color: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #15803d; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; margin: 8px 0; }
    .otp-subtitle { font-size: 12px; color: #16a34a; font-weight: 500; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25); }
    .footer { margin-top: 36px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
    .link-alt { font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 16px; background: #f9fafb; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Kosh (कोष)</div>
    <h1>Verify your email address</h1>
    <p>Namaste ${name ? name : "there"},</p>
    <p>Thank you for creating an account with <strong>Kosh App</strong>. Please verify your email address to activate your account and start managing your group savings securely.</p>
    ${otpDigitsHtml}
    ${linkHtml}
    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">If you did not request this email, please safely ignore it.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Kosh App. Built for community savings groups in Nepal.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({
    to,
    subject: `Verify your Kosh App Account ${otp ? `(Code: ${otp})` : ""}`,
    html,
  });
}

export async function sendResetPasswordEmail({
  to,
  url,
  otp,
  name,
}: {
  to: string;
  url?: string;
  otp?: string;
  name?: string;
}) {
  const otpDigitsHtml = otp
    ? `<div class="otp-container">
        <div class="otp-title">Your 6-Digit Reset Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-subtitle">Enter this code in the Kosh App to reset your password</div>
       </div>`
    : "";

  const linkHtml = url
    ? `<p style="margin-top: 24px;">Click the button below to set a new password:</p>
       <div class="btn-container">
         <a href="${url}" class="btn" target="_blank">Reset Password</a>
       </div>
       <div class="link-alt">
         Or copy and paste this link in your browser:<br>
         <a href="${url}" style="color: #2563eb;">${url}</a>
       </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Kosh Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #1f2937; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .logo { font-size: 26px; font-weight: 800; color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 24px; letter-spacing: -0.5px; }
    h1 { font-size: 22px; font-weight: 700; margin-top: 0; color: #111827; letter-spacing: -0.3px; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 20px; }
    .otp-container { background-color: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #1d4ed8; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; margin: 8px 0; }
    .otp-subtitle { font-size: 12px; color: #2563eb; font-weight: 500; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
    .footer { margin-top: 36px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
    .link-alt { font-size: 12px; color: #6b7280; word-break: break-all; margin-top: 20px; background: #f9fafb; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Kosh (कोष)</div>
    <h1>Reset your password</h1>
    <p>Namaste ${name ? name : "there"},</p>
    <p>We received a request to reset the password for your <strong>Kosh App</strong> account.</p>
    ${otpDigitsHtml}
    ${linkHtml}
    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Kosh App. Built for community savings groups in Nepal.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({
    to,
    subject: `Reset your Kosh App Password ${otp ? `(Code: ${otp})` : ""}`,
    html,
  });
}
