// db/indexeddb.js — Wrapper IndexedDB pour BarberManager
const DB_NAME = 'BarberManagerDB';
const DB_VERSION = 1;

let db = null;

export async function openDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;

      // Prestations locales (offline queue)
      if (!d.objectStoreNames.contains('prestations_queue')) {
        const store = d.createObjectStore('prestations_queue', { keyPath: 'local_id' });
        store.createIndex('synced', 'synced');
        store.createIndex('created_at', 'created_at');
      }

      // Cache coiffures
      if (!d.objectStoreNames.contains('coiffures')) {
        d.createObjectStore('coiffures', { keyPath: 'id' });
      }

      // Cache coiffeurs
      if (!d.objectStoreNames.contains('coiffeurs')) {
        d.createObjectStore('coiffeurs', { keyPath: 'id' });
      }

      // Cache prestations serveur
      if (!d.objectStoreNames.contains('prestations')) {
        const ps = d.createObjectStore('prestations', { keyPath: 'id' });
        ps.createIndex('coiffeur_id', 'coiffeur_id');
        ps.createIndex('created_at', 'created_at');
      }

      // Auth / session
      if (!d.objectStoreNames.contains('session')) {
        d.createObjectStore('session', { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ─── Helpers génériques ─────────────────────────────────────

async function tx(storeName, mode, fn) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = d.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(storeName) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const store = d.transaction(storeName, 'readonly').objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── QUEUE PRESTATIONS OFFLINE ───────────────────────────────

export async function queuePrestation(prestation) {
  const local_id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const item = { ...prestation, local_id, synced: false, created_at: new Date().toISOString() };
  await tx('prestations_queue', 'readwrite', (s) => s.add(item));
  return item;
}

export async function getPendingPrestations() {
  const all = await getAll('prestations_queue');
  return all.filter(p => !p.synced);
}

export async function markPrestationSynced(local_id, server_id) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const store = d.transaction('prestations_queue', 'readwrite').objectStore('prestations_queue');
    const getReq = store.get(local_id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.synced = true;
        item.server_id = server_id;
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getAllLocalPrestations() {
  const all = await getAll('prestations_queue');
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ─── CACHE COIFFURES ─────────────────────────────────────────

export async function cacheCoiffures(coiffures) {
  const d = await openDB();
  const store = d.transaction('coiffures', 'readwrite').objectStore('coiffures');
  coiffures.forEach(c => store.put(c));
}

export async function getCoiffures() {
  return getAll('coiffures');
}

// ─── CACHE COIFFEURS ─────────────────────────────────────────

export async function cacheCoiffeurs(coiffeurs) {
  const d = await openDB();
  const store = d.transaction('coiffeurs', 'readwrite').objectStore('coiffeurs');
  coiffeurs.forEach(c => store.put(c));
}

export async function getCoiffeurs() {
  return getAll('coiffeurs');
}

// ─── CACHE PRESTATIONS SERVEUR ───────────────────────────────

export async function cachePrestations(prestations) {
  const d = await openDB();
  const store = d.transaction('prestations', 'readwrite').objectStore('prestations');
  prestations.forEach(p => store.put(p));
}

export async function getPrestationsCache() {
  const all = await getAll('prestations');
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ─── SESSION ─────────────────────────────────────────────────

export async function saveSession(data) {
  await tx('session', 'readwrite', (s) => s.put({ key: 'current', ...data }));
}

export async function getSession() {
  return tx('session', 'readonly', (s) => s.get('current'));
}

export async function clearSession() {
  await tx('session', 'readwrite', (s) => s.delete('current'));
}
