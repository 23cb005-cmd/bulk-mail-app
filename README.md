# Bulk Mail Application (MERN)

A full-stack bulk email sender: React frontend, Node.js/Express backend, MongoDB storage, Nodemailer for delivery, and JWT-based admin login.

## Features

- Admin login (JWT auth) protecting the whole app
- Compose and send an email to many recipients at once (chip-style input with validation)
- Per-recipient send results (sent/failed with error reason) stored in MongoDB
- Email history page with pagination and expandable per-recipient detail
- Graceful error handling: partial failures are reported, not silently dropped

## Project structure

```
backend/   Express API, MongoDB models, Nodemailer integration
frontend/  React (Vite) single-page app
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)
- An SMTP account to send mail (e.g. Gmail with an App Password, or any SMTP provider)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by the seed script to create the admin account |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials used to send mail |
| `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` | From header on outgoing mail |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default `http://localhost:5173`) |

For Gmail: enable 2-Step Verification on the account, then create an **App Password** at https://myaccount.google.com/apppasswords and use that as `SMTP_PASS` (not your normal password).

Create the admin account (reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env`):

```bash
npm run seed:admin
```

Start the API:

```bash
npm run dev      # with auto-restart (nodemon)
# or
npm start
```

The API runs at `http://localhost:5000` by default. Health check: `GET /api/health`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

`frontend/.env` just needs `VITE_API_URL` pointing at the backend (default `http://localhost:5000/api`).

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`, sign in with the admin credentials you seeded, and send mail.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | – | Log in, returns `{ token, admin }` |
| GET | `/api/auth/me` | Bearer | Current admin profile |
| POST | `/api/mail/send` | Bearer | `{ subject, body, recipients: [...] }` → sends to each recipient, persists result |
| GET | `/api/mail/history?page=&limit=` | Bearer | Paginated list of past sends |
| GET | `/api/mail/history/:id` | Bearer | Single send record with full per-recipient results |

All routes are rate-limited and validated server-side (invalid recipient emails, empty subject/body, >500 recipients per request are all rejected before anything is sent).

## Notes

- Email bodies are sent as HTML, so basic HTML markup in the body field is supported.
- `npm audit` on the backend flags advisories inside `nodemon`'s file-watcher dependency chain (`chokidar`/`braces`). This is a dev-only tool not used in production and doesn't process untrusted input, so it was left as-is rather than forcing a breaking downgrade.
- This is a demo/take-home project: for production use you'd want things like refresh tokens, a queue for large recipient batches instead of sequential sending, and a managed transactional email provider (SES, SendGrid, etc.) instead of raw SMTP.
