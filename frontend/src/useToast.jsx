import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (msg, type = 'info') => {
    setToast({ msg, type, key: Date.now() });
    setTimeout(() => setToast(null), 4200);
  };

  const Toast = () =>
    toast ? (
      <div key={toast.key} className={`toast toast-${toast.type}`}>
        {toast.msg}
      </div>
    ) : null;

  return { show, Toast };
}