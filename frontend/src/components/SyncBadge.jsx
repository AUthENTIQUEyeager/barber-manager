import React, { useState, useEffect } from 'react';
import { getPendingPrestations } from '../db/indexeddb.js';

export default function SyncBadge() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    const check = async () => { const p = await getPendingPrestations(); setPending(p.length); };
    check();
    const t = setInterval(check, 5000);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); clearInterval(t); };
  }, []);

  if (!online) return (
    <span className="sync-badge offline">
      <span className="sync-dot" />Hors ligne
    </span>
  );
  if (pending > 0) return (
    <span className="sync-badge pending">
      <span className="sync-dot" />{pending} en attente
    </span>
  );
  return (
    <span className="sync-badge online">
      <span className="sync-dot" />En ligne
    </span>
  );
}
