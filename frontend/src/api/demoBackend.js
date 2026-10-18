// Client-side stand-in for the API, used by the public demo where there is no
// server to talk to. It is wired in as an axios adapter so every call site,
// interceptor and error path in the app stays exactly as it is against the real
// backend — only the transport changes.
//
// Validation here deliberately mirrors backend/src/controllers/mailController.js
// so the demo rejects the same input the real API would.
import { AxiosError } from "axios";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;

const STORAGE_KEY = "demo:history";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reserved/undeliverable domains (RFC 2606). Treating these as failures lets
// the per-recipient error reporting actually be seen in the demo instead of
// every send trivially succeeding.
const UNDELIVERABLE = /@(?:example\.(?:com|org|net)|test|invalid|localhost)$/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mongo-ish 24-char hex, so keys and ids look like the real thing.
function objectId() {
  let out = "";
  for (let i = 0; i < 24; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedHistory();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or unavailable storage should not break the demo.
    return [];
  }
}

function writeHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private-mode storage limits are not worth surfacing here.
  }
}

// One success and one partial failure, so the History page and its status
// badges have something to show before the visitor sends anything.
function seedHistory() {
  const now = Date.now();
  const items = [
    {
      _id: objectId(),
      subject: "Welcome to the team",
      body: "<p>Glad to have you aboard. Your first-week schedule is attached.</p>",
      recipients: ["priya@acme.co", "sam@acme.co"],
      results: [
        { email: "priya@acme.co", status: "sent", error: null },
        { email: "sam@acme.co", status: "sent", error: null },
      ],
      status: "success",
      sentCount: 2,
      failedCount: 0,
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      _id: objectId(),
      subject: "Quarterly newsletter",
      body: "<p>A roundup of everything that shipped this quarter.</p>",
      recipients: ["dev@acme.co", "nobody@example.com"],
      results: [
        { email: "dev@acme.co", status: "sent", error: null },
        {
          email: "nobody@example.com",
          status: "failed",
          error: "Recipient address rejected: domain not found",
        },
      ],
      status: "partial",
      sentCount: 1,
      failedCount: 1,
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    },
  ];
  writeHistory(items);
  return items;
}

function ok(config, data, status = 200) {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
    request: { demo: true },
  };
}

function fail(config, data, status) {
  return Promise.reject(
    new AxiosError(
      data.message || "Request failed",
      AxiosError.ERR_BAD_RESPONSE,
      config,
      { demo: true },
      ok(config, data, status)
    )
  );
}

function normalizeRecipients(recipients) {
  if (!Array.isArray(recipients)) return [];
  const cleaned = recipients
    .map((r) => String(r).trim().toLowerCase())
    .filter((r) => r.length > 0);
  return [...new Set(cleaned)];
}

async function handleLogin(config, payload) {
  await sleep(400);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    return fail(config, { message: "Email and password are required" }, 400);
  }
  if (email !== String(DEMO_EMAIL).toLowerCase() || password !== DEMO_PASSWORD) {
    return fail(config, { message: "Invalid credentials" }, 401);
  }

  return ok(config, {
    // Shaped like a JWT for realism; nothing ever verifies it.
    token: `demo.${btoa(email)}.token`,
    admin: { id: objectId(), email, name: "Demo Admin" },
  });
}

async function handleSend(config, payload) {
  const { subject, body, recipients } = payload;

  if (!subject || !String(subject).trim()) {
    return fail(config, { message: "Subject is required" }, 400);
  }
  if (!body || !String(body).trim()) {
    return fail(config, { message: "Email body is required" }, 400);
  }

  const clean = normalizeRecipients(recipients);
  if (clean.length === 0) {
    return fail(config, { message: "At least one recipient email is required" }, 400);
  }

  const invalid = clean.filter((r) => !EMAIL_REGEX.test(r));
  if (invalid.length > 0) {
    return fail(
      config,
      { message: "One or more recipient emails are invalid", invalidEmails: invalid },
      400
    );
  }
  if (clean.length > 500) {
    return fail(
      config,
      { message: "Too many recipients in a single request (limit: 500)" },
      400
    );
  }

  // Roughly track how long a real sequential send would feel, without making
  // a large batch unbearable to sit through.
  await sleep(Math.min(300 + clean.length * 120, 2500));

  const results = clean.map((email) =>
    UNDELIVERABLE.test(email)
      ? {
          email,
          status: "failed",
          error: "Reserved domain (RFC 2606) — simulated delivery failure",
        }
      : { email, status: "sent", error: null }
  );

  const sentCount = results.filter((r) => r.status === "sent").length;
  const failedCount = results.length - sentCount;

  let status = "success";
  if (sentCount === 0) status = "failed";
  else if (failedCount > 0) status = "partial";

  const record = {
    _id: objectId(),
    subject: String(subject).trim(),
    body,
    recipients: clean,
    results,
    status,
    sentCount,
    failedCount,
    createdAt: new Date().toISOString(),
  };

  writeHistory([record, ...readHistory()]);

  const message =
    status === "success"
      ? `Email sent to all ${sentCount} recipient(s).`
      : status === "partial"
        ? `Sent to ${sentCount} recipient(s), failed for ${failedCount}.`
        : "Failed to send email to any recipient.";

  // The real API answers 502 when nothing got through, and SendMail reads the
  // record off the error response in that case.
  if (status === "failed") {
    return fail(config, { message, record }, 502);
  }
  return ok(config, { message, record });
}

async function handleHistory(config) {
  await sleep(250);
  // Mirrors the backend's .sort({ createdAt: -1 }); insertion order alone is
  // not enough, since the seeded records are not stored newest-first.
  const all = readHistory().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const page = Math.max(parseInt(config.params?.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(config.params?.limit, 10) || 20, 1), 100);
  const start = (page - 1) * limit;

  return ok(config, {
    items: all.slice(start, start + limit),
    page,
    limit,
    total: all.length,
    totalPages: Math.max(Math.ceil(all.length / limit), 1),
  });
}

export async function demoAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const path = String(config.url || "").split("?")[0].replace(/\/+$/, "");

  let payload = {};
  if (config.data) {
    payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  }

  if (method === "post" && path.endsWith("/auth/login")) {
    return handleLogin(config, payload);
  }
  if (method === "get" && path.endsWith("/auth/me")) {
    await sleep(150);
    return ok(config, {
      admin: { id: objectId(), email: DEMO_EMAIL, name: "Demo Admin" },
    });
  }
  if (method === "post" && path.endsWith("/mail/send")) {
    return handleSend(config, payload);
  }
  if (method === "get" && path.includes("/mail/history")) {
    return handleHistory(config);
  }

  return fail(config, { message: "Route not found" }, 404);
}
