import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Alert from "../components/Alert";

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const { data } = await apiClient.get("/mail/history", { params: { page, limit: 10 } });
        if (!cancelled) {
          setItems(data.items);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load email history.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="page">
      <h1>Email History</h1>
      <p className="muted">Previously sent bulk email campaigns.</p>

      <Alert type="error" onClose={() => setError("")}>
        {error}
      </Alert>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="muted">No emails have been sent yet.</p>
      ) : (
        <>
          <div className="history-list">
            {items.map((item) => (
              <div key={item._id} className="card history-item">
                <div
                  className="history-item-header"
                  onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                >
                  <div>
                    <strong>{item.subject}</strong>
                    <div className="muted small">{formatDate(item.createdAt)}</div>
                  </div>
                  <div className="history-item-meta">
                    <span className="small muted">
                      {item.sentCount} sent / {item.failedCount} failed
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>

                {expandedId === item._id && (
                  <div className="history-item-details">
                    <p className="muted small">Recipients ({item.recipients.length}):</p>
                    <ul className="recipient-result-list">
                      {item.results.map((r) => (
                        <li key={r.email} className={r.status === "sent" ? "ok" : "fail"}>
                          {r.email} — {r.status}
                          {r.error ? `: ${r.error}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="small muted">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
