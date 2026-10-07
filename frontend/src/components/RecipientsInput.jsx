import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPLIT_REGEX = /[\s,;]+/;

export default function RecipientsInput({ recipients, onChange }) {
  const [draft, setDraft] = useState("");

  function addEmails(raw) {
    const candidates = raw
      .split(SPLIT_REGEX)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (candidates.length === 0) return;

    const next = new Set(recipients);
    candidates.forEach((c) => next.add(c));
    onChange(Array.from(next));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === "," || e.key === " " || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        addEmails(draft);
        setDraft("");
      }
    } else if (e.key === "Backspace" && !draft && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    if (SPLIT_REGEX.test(text)) {
      e.preventDefault();
      addEmails(text);
      setDraft("");
    }
  }

  function handleBlur() {
    if (draft.trim()) {
      addEmails(draft);
      setDraft("");
    }
  }

  function removeEmail(email) {
    onChange(recipients.filter((r) => r !== email));
  }

  return (
    <div className="recipients-input">
      <div className="recipients-chips">
        {recipients.map((email) => (
          <span
            key={email}
            className={`chip ${EMAIL_REGEX.test(email) ? "" : "chip-invalid"}`}
          >
            {email}
            <button
              type="button"
              className="chip-remove"
              onClick={() => removeEmail(email)}
              aria-label={`Remove ${email}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          className="recipients-text-input"
          value={draft}
          placeholder={recipients.length === 0 ? "Type or paste emails, separated by comma/space/newline" : "Add another..."}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
        />
      </div>
      <p className="hint">
        {recipients.length} recipient{recipients.length === 1 ? "" : "s"} added. Press Enter, comma, space, or paste a list to add.
      </p>
    </div>
  );
}

export { EMAIL_REGEX };
