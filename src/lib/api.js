// Parle au « vigile » (les routes /api). Le jeton chef reste dans cet onglet seulement.
const CLE = 'm2-chef';

export function lireSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CLE) || 'null');
  } catch {
    return null;
  }
}

export function ecrireSession(session) {
  try {
    if (session) sessionStorage.setItem(CLE, JSON.stringify(session));
    else sessionStorage.removeItem(CLE);
  } catch { /* navigation privée : tant pis */ }
  window.dispatchEvent(new Event('m2-session'));
}

export async function api(chemin, { methode = 'GET', corps } = {}) {
  const session = lireSession();
  const headers = {};
  if (corps !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.jeton) headers.Authorization = `Bearer ${session.jeton}`;
  let res;
  try {
    res = await fetch(`/api/${chemin}`, { method: methode, headers, body: corps !== undefined ? JSON.stringify(corps) : undefined });
  } catch {
    throw Object.assign(new Error('Le QG ne répond pas. Vérifie Internet.'), { statut: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && session) ecrireSession(null);
  if (!res.ok && !('acces' in data) && data.ok !== false) {
    throw Object.assign(new Error(data.erreur || 'Erreur.'), { statut: res.status, data });
  }
  return { ...data, statut: res.status };
}

// Photo d'agent : protégée, donc on la télécharge avec le jeton.
export async function urlPhoto(id) {
  const session = lireSession();
  const res = await fetch(`/api/photo?id=${encodeURIComponent(id)}`, {
    headers: session?.jeton ? { Authorization: `Bearer ${session.jeton}` } : {},
  });
  if (!res.ok) return null;
  return URL.createObjectURL(await res.blob());
}
