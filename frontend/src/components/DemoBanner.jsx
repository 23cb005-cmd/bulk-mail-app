import { isDemoMode } from "../api/demoBackend";

// A bulk mailer that silently pretends to deliver would be misleading, so the
// demo says so on every page. Renders nothing outside demo mode.
export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="demo-banner" role="status">
      <strong>Demo mode</strong> — no backend is connected. Sign-in, sending and
      history are simulated in your browser and saved to local storage.{" "}
      <strong>No email is actually delivered.</strong>
    </div>
  );
}
