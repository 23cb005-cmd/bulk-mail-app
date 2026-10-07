import { useState } from "react";
import apiClient from "../api/client";
import Alert from "../components/Alert";
import RecipientsInput, { EMAIL_REGEX } from "../components/RecipientsInput";

export default function SendMail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const invalidRecipients = recipients.filter((r) => !EMAIL_REGEX.test(r));
  const canSubmit =
    subject.trim() && body.trim() && recipients.length > 0 && invalidRecipients.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!canSubmit) {
      if (invalidRecipients.length > 0) {
        setError(`Fix invalid recipient email(s): ${invalidRecipients.join(", ")}`);
      } else {
        setError("Please fill in subject, body, and at least one recipient.");
      }
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/mail/send", {
        subject: subject.trim(),
        body,
        recipients,
      });
      setResult({ status: data.record.status, message: data.message });
      if (data.record.status === "success") {
        setSubject("");
        setBody("");
        setRecipients([]);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.record) {
        setResult({ status: data.record.status, message: data.message });
      } else {
        setError(data?.message || "Failed to send email. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Send Bulk Email</h1>
      <p className="muted">Compose a message and send it to multiple recipients at once.</p>

      <form className="card" onSubmit={handleSubmit}>
        <Alert type="error" onClose={() => setError("")}>
          {error}
        </Alert>
        {result && (
          <Alert
            type={result.status === "success" ? "success" : result.status === "partial" ? "warning" : "error"}
            onClose={() => setResult(null)}
          >
            {result.message}
          </Alert>
        )}

        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. October Newsletter"
          required
        />

        <label htmlFor="body">Email Body</label>
        <textarea
          id="body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message here. Basic HTML is supported."
          required
        />

        <label>Recipients</label>
        <RecipientsInput recipients={recipients} onChange={setRecipients} />

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Sending..." : `Send to ${recipients.length || ""} recipient${recipients.length === 1 ? "" : "s"}`}
        </button>
      </form>
    </div>
  );
}
