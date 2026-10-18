import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";

// Credentials for the public demo. They come from the build environment rather
// than being hardcoded, so the real values live in CI config instead of git.
// Unset (the local-dev default) hides the hint entirely.
const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  }

  function fillDemoCredentials() {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p className="muted">Sign in to send bulk emails and view history.</p>

        {demoEmail && demoPassword && (
          <div className="demo-creds">
            <div className="demo-creds-head">
              <span className="demo-creds-title">Demo credentials</span>
              <button
                type="button"
                className="btn-fill"
                onClick={fillDemoCredentials}
              >
                Use these
              </button>
            </div>
            <dl className="demo-creds-list">
              <dt>Email</dt>
              <dd>{demoEmail}</dd>
              <dt>Password</dt>
              <dd>{demoPassword}</dd>
            </dl>
          </div>
        )}

        <Alert type="error" onClose={() => setError("")}>
          {error}
        </Alert>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
