export default function Alert({ type = "info", children, onClose }) {
  if (!children) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
