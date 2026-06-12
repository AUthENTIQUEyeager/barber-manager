// sync/syncManager.js
import { getPendingPrestations, markPrestationSynced } from '../db/indexeddb.js';

const API_URL = import.meta.env.VITE_API_URL;

let syncInterval = null;
let isSyncing = false;

export async function syncPendingData(token) {
  if (isSyncing || !navigator.onLine || !token) return;
  isSyncing = true;

  try {
    const pending = await getPendingPrestations();
    if (pending.length === 0) { isSyncing = false; return; }

    const res = await fetch(`${API_URL}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prestations: pending }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) { isSyncing = false; return; }

    const { synced } = await res.json();
    for (const s of synced) {
      if (s.local_id) {
        await markPrestationSynced(s.local_id, s.server_id);
      }
    }

    console.log(`✅ Sync: ${synced.length} prestation(s) synchronisée(s)`);
  } catch (err) {
    console.warn('Sync échouée (hors ligne?):', err.message);
  } finally {
    isSyncing = false;
  }
}

export function startAutoSync(getToken, interval = 20000) {
  stopAutoSync();

  // Sync immédiate
  syncPendingData(getToken());

  // Sync périodique
  syncInterval = setInterval(() => {
    if (navigator.onLine) syncPendingData(getToken());
  }, interval);

  // Sync au retour de connexion
  window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie — synchronisation...');
    syncPendingData(getToken());
  });
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
