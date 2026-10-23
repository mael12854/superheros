// Compteurs d'échecs, blocage et alarme : tout est gardé côté serveur.
import { lireJSON, ecrireJSON } from './stockage.js';
import { empreinte } from './session.js';

export function adresseIP(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim();
  return ip || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'inconnue';
}

// Un fichier par appareil (adresse IP hachée, jamais l'IP en clair).
function cheminCompteur(type, req) {
  return `securite/${type}-${empreinte(adresseIP(req))}.json`;
}

export async function lireCompteur(type, req) {
  return lireJSON(cheminCompteur(type, req), { echecs: 0, bloqueJusqua: 0, fenetre: 0 });
}

export async function ecrireCompteur(type, req, compteur) {
  await ecrireJSON(cheminCompteur(type, req), compteur);
}

export function estBloque(compteur) {
  return compteur.bloqueJusqua && compteur.bloqueJusqua > Date.now();
}

export async function lireAlarme() {
  return lireJSON('alarme.json', { active: false });
}

export async function declencherAlarme(raison) {
  await ecrireJSON('alarme.json', { active: true, depuis: Date.now(), raison });
}

export async function arreterAlarme(parQui) {
  await ecrireJSON('alarme.json', { active: false, arreteePar: parQui, arreteeA: Date.now() });
}
