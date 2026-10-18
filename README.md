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

## Deployment

Live frontend: **https://23cb005-cmd.github.io/bulk-mail-app/**

The two halves deploy separately: the React app is static and goes on GitHub
Pages, while the API needs a Node host plus MongoDB and SMTP.

### Frontend (GitHub Pages)

Pages serves the site from the `/bulk-mail-app/` subpath, so the build is
parameterised rather than assuming the domain root:

- `BASE_PATH` sets Vite's `base` (defaults to `/` so local dev is unchanged)
- `BrowserRouter` takes its `basename` from `import.meta.env.BASE_URL`
- `404.html` is a copy of `index.html`, because Pages has no rewrite rules and
  would otherwise 404 on a deep link like `/history` instead of letting React
  Router handle it

To publish a new build, the `gh-pages` branch holds the compiled output:

```bash
cd frontend
BASE_PATH=/bulk-mail-app/ VITE_API_URL=<your-api-url> npm run build
cp dist/index.html dist/404.html && touch dist/.nojekyll
# then commit dist/ to the gh-pages branch
```

`.github/workflows/deploy-frontend.yml` automates exactly this on every push to
`master`, reading the API origin from a `VITE_API_URL` repository variable
(Settings > Secrets and variables > Actions > Variables). Pushing that workflow
file needs a token with the `workflow` scope:

```bash
gh auth refresh -h github.com -s workflow
git add .github && git commit -m "Add Pages deploy workflow" && git push
```

Then switch Pages to Actions mode so the workflow owns the deploy:

```bash
gh api -X PUT repos/23cb005-cmd/bulk-mail-app/pages -f build_type=workflow
```

### Backend (Render + MongoDB Atlas)

The API is not deployed yet — until it is, the live frontend loads but login
fails, since there is nothing to authenticate against.

1. Create a free MongoDB Atlas cluster, add a database user, and allow network
   access from anywhere (`0.0.0.0/0`) so Render can reach it. Copy the
   connection string.
2. Create a Gmail App Password (requires 2-Step Verification) at
   https://myaccount.google.com/apppasswords — this is `SMTP_PASS`.
3. In Render, choose **New > Blueprint** and point it at this repo.
   `render.yaml` defines the service; Render prompts for each secret rather than
   reading it from git, and generates `JWT_SECRET` itself.
4. Once live, seed the admin account from the Render shell:
   `npm run seed:admin`
5. Point the frontend at the API by setting the `VITE_API_URL` repository
   variable to `https://<your-service>.onrender.com/api` and rebuilding.

Keep `CLIENT_ORIGIN` as a bare origin (`https://23cb005-cmd.github.io`) with no
path or trailing slash — that is the value CORS compares the request origin
against. Render's free plan also idles after inactivity, so the first request
after a quiet period takes roughly a minute to wake the service.

## Notes

- Email bodies are sent as HTML, so basic HTML markup in the body field is supported.
- `npm audit` on the backend flags advisories inside `nodemon`'s file-watcher dependency chain (`chokidar`/`braces`). This is a dev-only tool not used in production and doesn't process untrusted input, so it was left as-is rather than forcing a breaking downgrade.
- This is a demo/take-home project: for production use you'd want things like refresh tokens, a queue for large recipient batches instead of sequential sending, and a managed transactional email provider (SES, SendGrid, etc.) instead of raw SMTP.
