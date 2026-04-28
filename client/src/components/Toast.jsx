import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

let _addToast = null;

export function showToast(message, type = 'success') {
  if (_addToast) _addToast(message, type);
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => { _addToast = addToast; return () => { _addToast = null; }; }, [addToast]);

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : '✕'}</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
