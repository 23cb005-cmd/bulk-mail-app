const Email = require("../models/Email");
const { sendMailTo } = require("../utils/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRecipients(recipients) {
  if (!Array.isArray(recipients)) return [];
  const cleaned = recipients
    .map((r) => String(r).trim().toLowerCase())
    .filter((r) => r.length > 0);
  return [...new Set(cleaned)];
}

async function sendBulkMail(req, res) {
  const { subject, body, recipients } = req.body;

  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ message: "Subject is required" });
  }
  if (!body || !String(body).trim()) {
    return res.status(400).json({ message: "Email body is required" });
  }

  const cleanRecipients = normalizeRecipients(recipients);
  if (cleanRecipients.length === 0) {
    return res.status(400).json({ message: "At least one recipient email is required" });
  }

  const invalid = cleanRecipients.filter((r) => !EMAIL_REGEX.test(r));
  if (invalid.length > 0) {
    return res.status(400).json({
      message: "One or more recipient emails are invalid",
      invalidEmails: invalid,
    });
  }

  if (cleanRecipients.length > 500) {
    return res.status(400).json({
      message: "Too many recipients in a single request (limit: 500)",
    });
  }

  const results = [];
  for (const recipient of cleanRecipients) {
    try {
      await sendMailTo(recipient, { subject, body });
      results.push({ email: recipient, status: "sent", error: null });
    } catch (err) {
      results.push({ email: recipient, status: "failed", error: err.message });
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  const failedCount = results.length - sentCount;

  let status = "success";
  if (sentCount === 0) status = "failed";
  else if (failedCount > 0) status = "partial";

  const record = await Email.create({
    subject,
    body,
    recipients: cleanRecipients,
    results,
    status,
    sentCount,
    failedCount,
    sentBy: req.admin ? req.admin.id : null,
  });

  const httpStatus = status === "failed" ? 502 : 200;

  return res.status(httpStatus).json({
    message:
      status === "success"
        ? `Email sent to all ${sentCount} recipient(s).`
        : status === "partial"
        ? `Sent to ${sentCount} recipient(s), failed for ${failedCount}.`
        : "Failed to send email to any recipient.",
    record,
  });
}

async function getHistory(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Email.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Email.countDocuments(),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

async function getHistoryItem(req, res) {
  const record = await Email.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ message: "Record not found" });
  }
  return res.json({ record });
}

module.exports = { sendBulkMail, getHistory, getHistoryItem };
