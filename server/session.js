// Le « laissez-passer » des chefs : un jeton signé par le serveur.
import crypto from 'node:crypto';

const DUREE_MS = 12 * 60 * 60 * 1000; // 12 heures

export function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.VERCEL) {
    throw new Error('SESSION_SECRET manquant : ajoute-le dans les variables d\'environnement Vercel.');
  }
  return 'secret-de-developpement-local-uniquement';
}

function signer(texte) {
  return crypto.createHmac('sha256', secret()).update(texte).digest('base64url');
}

export function creerJeton(agent) {
  const contenu = Buffer.from(
    JSON.stringify({ id: agent.id, nomHeros: agent.nomHeros, exp: Date.now() + DUREE_MS }),
  ).toString('base64url');
  return `${contenu}.${signer(contenu)}`;
}

export function lireJeton(jeton) {
  if (typeof jeton !== 'string' || !jeton.includes('.')) return null;
  const [contenu, signature] = jeton.split('.');
  const attendu = signer(contenu);
  const a = Buffer.from(signature || '');
  const b = Buffer.from(attendu);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(contenu, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function empreinte(texte) {
  return crypto.createHmac('sha256', secret()).update(String(texte)).digest('hex').slice(0, 24);
}
