// routes/contactRoutes.js
import express from "express";
import nodemailer from "nodemailer";
import Contact from "../models/Contact.js"; // optional: comment out if you don't want DB saving
const router = express.Router();

/**
 * Expected body:
 * { name: string, email: string, message: string }
 *
 * Env (recommended):
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_FROM, CONTACT_TO
 */

function validatePayload(body) {
  const { name, email, message } = body || {};
  if (!name || !email || !message) return "name, email and message are required";
  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string")
    return "invalid field types";
  // very light email regex
  if (!/^\S+@\S+\.\S+$/.test(email)) return "invalid email";
  return null;
}

async function createTransporter() {
  // Use SMTP settings from env
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass && port) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });
  }

  // No SMTP configured — fallback to ethereal (dev) to avoid failing
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

router.post("/", async (req, res) => {
  try {
    const err = validatePayload(req.body);
    if (err) return res.status(400).json({ ok: false, error: err });

    const { name, email, message } = req.body;

    // Save to DB (optional). If you don't want DB storage, comment this out.
    try {
      await Contact.create({ name, email, message });
    } catch (dbErr) {
      // Log DB error but continue so email still sends
      console.warn("Contact save failed:", dbErr.message || dbErr);
    }

    // Send email to admin/you
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.CONTACT_FROM || `"Moodify Contact" <${process.env.SMTP_USER || "noreply@example.com"}>`,
      to: process.env.CONTACT_TO || process.env.SMTP_USER || "owner@example.com",
      subject: `New Contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong></p>
             <p>${message.replace(/\n/g, "<br/>")}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    // If using ethereal test account, include preview URL (dev convenience)
    const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

    return res.json({ ok: true, message: "Message received", preview });
  } catch (err) {
    console.error("Contact endpoint error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
