// api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    signal: options.signal || AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }

  return res.json();
}

// Helper raccourci
export const api = {
  get: (path, token) => apiFetch(path, { method: 'GET' }, token),
  post: (path, body, token) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: (path, body, token) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
  delete: (path, token) => apiFetch(path, { method: 'DELETE' }, token)
};
