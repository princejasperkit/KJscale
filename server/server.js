// server/server.js
// Express endpoint to receive job applications, generate a reference number,
// email the application to careers@kjscale.online and send confirmation to applicant.
// Configure via environment variables as shown in .env.example

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend if you host the server with the static site
app.use(express.static(path.join(__dirname, '..', 'public')));

const EMAIL_TO = process.env.EMAIL_TO || 'careers@kjscale.online';

// Create transporter using SMTP credentials from env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

// Simple reference generator: KJS-<base36 timestamp>-<4 digits>
function makeRef() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(1000 + Math.random() * 9000);
  return `KJS-${t}-${r}`;
}

// Basic server-side validation
function validateApplication(data) {
  if (!data) return 'Missing payload';
  const { name, email } = data;
  if (!name || String(name).trim().length < 2) return 'Name is required';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'Valid email is required';
  return null;
}

app.post('/api/apply', async (req, res) => {
  try {
    const payload = req.body;
    const err = validateApplication(payload);
    if (err) return res.status(400).json({ error: err });

    const reference = makeRef();
    const name = String(payload.name).trim();
    const email = String(payload.email).trim();
    const phone = payload.phone ? String(payload.phone).trim() : '';
    const position = payload.position ? String(payload.position).trim() : '';
    const message = payload.message ? String(payload.message).trim() : '';

    const adminHtml = `
      <p>New application received</p>
      <ul>
        <li><strong>Reference:</strong> ${reference}</li>
        <li><strong>Name:</strong> ${escapeHtml(name)}</li>
        <li><strong>Email:</strong> ${escapeHtml(email)}</li>
        <li><strong>Phone:</strong> ${escapeHtml(phone)}</li>
        <li><strong>Position:</strong> ${escapeHtml(position)}</li>
      </ul>
      <h3>Message</h3>
      <pre>${escapeHtml(message)}</pre>
    `;

    // Send email to careers
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: EMAIL_TO,
      subject: `New application: ${position || 'Unknown'} (${reference})`,
      html: adminHtml
    });

    // Send confirmation to applicant
    const applicantHtml = `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thank you for applying for ${escapeHtml(position || 'the role')}. We have received your application (Reference: <strong>${reference}</strong>).</p>
      <p>We will review it in 7-10 business days and contact you if we proceed to the next step.</p>
      <p>— KJscale Careers</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Application received — ${reference}`,
      html: applicantHtml
    });

    return res.json({ reference });
  } catch (error) {
    console.error('Error in /api/apply:', error && error.stack ? error.stack : error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Small utility to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
