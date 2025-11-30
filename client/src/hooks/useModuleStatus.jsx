import { useEffect, useState } from 'react';

// Hook: fetches /api/<moduleKey>/status and returns a status object
// Returned shape: { loading: boolean, ok?: boolean, data?: any, error?: string }
export default function useModuleStatus(moduleKey) {
  const [status, setStatus] = useState({ loading: true });

  useEffect(() => {
    let mounted = true;
    setStatus({ loading: true });

    fetch(`/api/${moduleKey}/status`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setStatus({ loading: false, ok: true, data });
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus({ loading: false, ok: false, error: err.message });
      });

    return () => {
      mounted = false;
    };
  }, [moduleKey]);

  return status;
}
