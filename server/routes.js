// Le « vigile » : toutes les routes API de l'Agence M².
// Règle d'or : les vraies réponses et les codes ne quittent JAMAIS le serveur.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { lireJSON, ecrireJSON, lister, supprimer, lireBinaire, ecrireBinaire, modeStockage } from './stockage.js';
import { normaliser, chiffres, identique, presque, slug, compterLettres, dateISO, memeDate, distance } from './texte.js';
import { aujourdhui, heure, ageLe, dateValide } from './temps.js';
import { creerJeton, lireJeton, secret } from './session.js';
import {
  lireCompteur, ecrireCompteur, estBloque, lireAlarme, declencherAlarme, arreterAlarme,
} from './securite.js';
import { MOTS_DU_JOUR } from './mots.js';

const COUT_BCRYPT = 10;
const BLOCAGE_MS = 60 * 1000;

class ErreurHttp extends Error {
  constructor(statut, message, extra = {}) {
    super(message);
    this.statut = statut;
    this.extra = extra;
  }
}

// ---------- Agents ----------

async function tousLesAgents() {
  const chemins = await lister('agents/');
  const agents = await Promise.all(chemins.filter((c) => c.endsWith('.json')).map((c) => lireJSON(c)));
  return agents.filter(Boolean).sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));
}

async function lireAgent(id) {
  if (!id || !/^[a-z0-9-]+$/.test(id)) return null;
  return lireJSON(`agents/${id}.json`);
}

function agentSansSecret(agent) {
  const { codeHache, ...reste } = agent;
  return reste;
}

function agentPublic(agent) {
  return { id: agent.id, numero: agent.numero, nomHeros: agent.nomHeros, role: agent.role };
}

const CHAMPS_TEXTE = ['nomHeros', 'prenom', 'nom', 'adresse', 'codePostal', 'ville', 'entree', 'plat', 'dessert', 'couleur', 'pouvoir', 'chef'];

function codeTropFacile(code) {
  if (!/^\d{4,6}$/.test(code)) return true; // 4 à 6 chiffres
  const d = code.split('').map(Number);
  if (d.every((x) => x === d[0])) return true; // 0000, 1111…
  const monte = d.every((x, i) => i === 0 || x === d[i - 1] + 1); // 1234
  const descend = d.every((x, i) => i === 0 || x === d[i - 1] - 1); // 4321
  if (monte || descend) return true;
  const motif = (p) => d.every((x, i) => i < p || x === d[i - p]);
  if (motif(2) || (d.length === 6 && motif(3))) return true; // 1212, 123123
  return false;
}

async function codeDejaPris(code, agents) {
  for (const a of agents) {
    if (a.codeHache && (await bcrypt.compare(code, a.codeHache))) return true;
  }
  return false;
}

async function nouveauCode(agents) {
  for (let i = 0; i < 50; i++) {
    const code = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    if (codeTropFacile(code)) continue;
    if (await codeDejaPris(code, agents)) continue;
    return code;
  }
  throw new ErreurHttp(500, 'Impossible de trouver un code libre.');
}

async function creerAgent(corps, role) {
  const fiche = {};
  for (const champ of CHAMPS_TEXTE) {
    const v = String(corps[champ] ?? '').trim().slice(0, 120);
    if (!v) throw new ErreurHttp(400, `Le champ « ${champ} » est vide.`);
    fiche[champ] = v;
  }
  fiche.codePostal = chiffres(fiche.codePostal);
  if (fiche.codePostal.length !== 5) throw new ErreurHttp(400, 'Le code postal doit avoir 5 chiffres.');
  const naissance = dateISO(corps.dateNaissance);
  if (!naissance) throw new ErreurHttp(400, 'Date de naissance invalide (JJ / MM / AAAA).');
  const code = String(corps.code ?? '');
  if (codeTropFacile(code)) throw new ErreurHttp(400, 'Code secret trop facile ou invalide (4 à 6 chiffres).');

  const id = slug(fiche.nomHeros);
  if (!id) throw new ErreurHttp(400, 'Nom de héros invalide.');
  const agents = await tousLesAgents();
  if (agents.some((a) => a.id === id)) throw new ErreurHttp(409, 'Ce nom de héros est déjà pris.');
  if (await codeDejaPris(code, agents)) throw new ErreurHttp(409, 'Ce code secret est déjà pris.');

  const max = agents.reduce((m, a) => Math.max(m, parseInt(a.numero, 10) || 0), 0);
  const agent = {
    id,
    numero: String(max + 1).padStart(3, '0'),
    ...fiche,
    dateNaissance: naissance,
    codeHache: await bcrypt.hash(code, COUT_BCRYPT),
    photo: null,
    role: role === 'chef' ? 'chef' : 'agent',
    creeLe: new Date().toISOString(),
  };

  if (corps.photo) {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(corps.photo);
    if (!m) throw new ErreurHttp(400, 'Photo invalide (JPEG attendu).');
    const octets = Buffer.from(m[1], 'base64');
    if (octets.length > 600 * 1024) throw new ErreurHttp(400, 'Photo trop lourde.');
    agent.photo = `photos/${id}.jpg`;
    await ecrireBinaire(agent.photo, octets, 'image/jpeg');
  }
  await ecrireJSON(`agents/${id}.json`, agent);
  return agent;
}

// ---------- Registre et présence ----------

async function noter(type, agent, details = {}) {
  const jour = aujourdhui();
  const h = heure();
  const chemin = `registre/${jour}.json`;
  const registre = await lireJSON(chemin, []);
  registre.push({ heure: h, type, agentId: agent.id, nomHeros: agent.nomHeros, ...details });
  await ecrireJSON(chemin, registre);
  const presence = await lireJSON('presence.json', {});
  presence[agent.id] = { etat: type === 'entree' ? 'dedans' : 'dehors', depuis: `${jour} ${h}` };
  await ecrireJSON('presence.json', presence);
  return h;
}

// ---------- Liste rouge ----------

async function surListeRouge(reponses) {
  const liste = await lireJSON('liste-rouge.json', []);
  const candidats = [reponses.nomHeros, reponses.prenom, `${reponses.prenom ?? ''} ${reponses.nom ?? ''}`]
    .map(normaliser)
    .filter(Boolean);
  return liste.some((p) => candidats.includes(normaliser(p.nom)));
}

// ---------- Contrôle d'entrée (sécurité maximale) ----------

const HACHE_LEURRE = bcrypt.hashSync('0000', COUT_BCRYPT);

async function verifierEntree(reponses) {
  if (await surListeRouge(reponses)) return null;
  const agent = await lireAgent(slug(reponses.nomHeros));
  if (!agent) {
    await bcrypt.compare(String(reponses.code ?? ''), HACHE_LEURRE); // même durée, pour ne rien laisser deviner
    return null;
  }
  const r = reponses;
  const tests = [
    identique(r.nomHeros, agent.nomHeros),
    identique(r.prenom, agent.prenom),
    identique(r.nom, agent.nom),
    memeDate(r.dateNaissance, agent.dateNaissance),
    chiffres(r.age) === String(ageLe(agent.dateNaissance)),
    identique(r.adresse, agent.adresse),
    chiffres(r.codePostal) === agent.codePostal,
    identique(r.ville, agent.ville),
    identique(r.entree, agent.entree),
    identique(r.plat, agent.plat),
    identique(r.dessert, agent.dessert),
    identique(r.couleur, agent.couleur),
    identique(r.pouvoir, agent.pouvoir),
    identique(r.chef, agent.chef),
    chiffres(r.lettres) === String(compterLettres(agent.nomHeros)),
  ];
  const codeOk = await bcrypt.compare(String(r.code ?? ''), agent.codeHache);
  return tests.every(Boolean) && codeOk ? agent : null;
}

// Même règle pour les agents et les visiteurs : 3 NON de suite = alarme + blocage 1 min.
async function controleEntree(req, verifier) {
  const compteur = await lireCompteur('entree', req);
  if (estBloque(compteur)) {
    return { statut: 423, corps: { acces: 'NON', bloque: true, bloqueJusqua: compteur.bloqueJusqua, message: 'Clavier bloqué. Attends la fin du compte à rebours.' } };
  }
  const qui = await verifier();
  if (qui) {
    await ecrireCompteur('entree', req, { echecs: 0, bloqueJusqua: 0 });
    const h = await noter('entree', qui, qui.visiteur ? { visiteur: true } : {});
    return { acces: 'OUI', message: `Bienvenue, ${qui.nomHeros}. Entrée notée à ${h}.`, nomHeros: qui.nomHeros, heure: h };
  }
  const echecs = (compteur.echecs || 0) + 1;
  if (echecs >= 3) {
    const bloqueJusqua = Date.now() + BLOCAGE_MS;
    await ecrireCompteur('entree', req, { echecs: 0, bloqueJusqua });
    await declencherAlarme('3 NON de suite au contrôle d\'entrée');
    return { acces: 'NON', alarme: true, bloque: true, bloqueJusqua, message: 'Identité non confirmée. Essai 3 sur 3. ALARME !' };
  }
  await ecrireCompteur('entree', req, { echecs, bloqueJusqua: 0 });
  return { acces: 'NON', essai: echecs, message: `Identité non confirmée. Essai ${echecs} sur 3.` };
}

function routeEntree(req, corps) {
  return controleEntree(req, () => verifierEntree(corps.reponses || {}));
}

// ---------- Visiteurs ----------
// Un visiteur crée son compte lui-même, puis un chef le valide.
// Entrée : 14 questions (comme les agents, sans le nom de héros ni la question piège),
// même alarme et même liste rouge. Sortie : prénom, nom et code.

// Les réponses demandées au contrôle d'entrée des visiteurs (+ le lien avec l'Agence).
const CHAMPS_VISITEUR = ['prenom', 'nom', 'dateNaissance', 'adresse', 'codePostal', 'ville', 'entree', 'plat', 'dessert', 'couleur', 'pouvoir', 'chef', 'lien'];

// Liste des données qui manquent à un visiteur (les anciens comptes n'avaient que prénom, nom, lien, code).
function champsManquants(v) {
  const manque = CHAMPS_VISITEUR.filter((c) => !String(v[c] ?? '').trim());
  if (!v.codeHache) manque.push('code');
  return manque;
}

// Vérifie et nettoie les champs envoyés. « partiel » = on ne garde que ceux qui sont remplis.
function nettoyerChampsVisiteur(corps, partiel) {
  const fiche = {};
  for (const champ of CHAMPS_VISITEUR) {
    const brut = String(corps[champ] ?? '').trim().slice(0, 120);
    if (!brut) {
      if (partiel) continue;
      throw new ErreurHttp(400, `Le champ « ${champ} » est vide.`);
    }
    if (champ === 'dateNaissance') {
      const d = dateISO(brut);
      if (!d) throw new ErreurHttp(400, 'Date de naissance invalide (JJ / MM / AAAA).');
      fiche[champ] = d;
    } else if (champ === 'codePostal') {
      const cp = chiffres(brut);
      if (cp.length !== 5) throw new ErreurHttp(400, 'Le code postal doit avoir 5 chiffres.');
      fiche[champ] = cp;
    } else fiche[champ] = brut;
  }
  return fiche;
}

const MAX_VISITEURS_EN_ATTENTE = 30;

function idVisiteur(prenom, nom) {
  const s = slug(`${prenom ?? ''} ${nom ?? ''}`);
  return s ? `v-${s}` : '';
}

async function lireVisiteur(id) {
  if (!id || !/^v-[a-z0-9-]+$/.test(id)) return null;
  return lireJSON(`visiteurs/${id}.json`);
}

async function tousLesVisiteurs() {
  const chemins = await lister('visiteurs/');
  const v = (await Promise.all(chemins.map((c) => lireJSON(c)))).filter(Boolean);
  return v.sort((a, b) => (b.creeLe || '').localeCompare(a.creeLe || ''));
}

function visiteurSansSecret(v) {
  const { codeHache, ...reste } = v;
  return reste;
}

function nomVisiteur(v) {
  return `${v.prenom} ${v.nom}`;
}

async function creerVisiteur(corps) {
  const fiche = nettoyerChampsVisiteur(corps, false);
  const code = String(corps.code ?? '');
  if (codeTropFacile(code)) throw new ErreurHttp(400, 'Code secret trop facile ou invalide (4 à 6 chiffres, pas 1234 ni 0000).');
  const id = idVisiteur(fiche.prenom, fiche.nom);
  if (!id) throw new ErreurHttp(400, 'Prénom ou nom invalide.');
  const tous = await tousLesVisiteurs();
  if (tous.some((v) => v.id === id)) throw new ErreurHttp(409, 'Un compte existe déjà avec ce prénom et ce nom.');
  if (tous.filter((v) => v.statut === 'en-attente').length >= MAX_VISITEURS_EN_ATTENTE) {
    throw new ErreurHttp(429, 'Trop de comptes en attente. Demande à un chef de les valider d\'abord.');
  }
  const visiteur = {
    id, ...fiche,
    codeHache: await bcrypt.hash(code, COUT_BCRYPT),
    statut: 'en-attente',
    creeLe: new Date().toISOString(),
  };
  await ecrireJSON(`visiteurs/${id}.json`, visiteur);
  return visiteur;
}

async function verifierEntreeVisiteur(r) {
  if (await surListeRouge({ nomHeros: '', prenom: r.prenom, nom: r.nom })) return null;
  const v = await lireVisiteur(idVisiteur(r.prenom, r.nom));
  const codeOk = await bcrypt.compare(String(r.code ?? ''), v?.codeHache || HACHE_LEURRE);
  // Un visiteur à qui il manque des données ne peut pas entrer.
  if (!v || v.statut !== 'valide' || !codeOk || champsManquants(v).length > 0) return null;
  const tests = [
    identique(r.prenom, v.prenom),
    identique(r.nom, v.nom),
    memeDate(r.dateNaissance, v.dateNaissance),
    chiffres(r.age) === String(ageLe(v.dateNaissance)),
    identique(r.adresse, v.adresse),
    chiffres(r.codePostal) === v.codePostal,
    identique(r.ville, v.ville),
    identique(r.entree, v.entree),
    identique(r.plat, v.plat),
    identique(r.dessert, v.dessert),
    identique(r.couleur, v.couleur),
    identique(r.pouvoir, v.pouvoir),
    identique(r.chef, v.chef),
  ];
  if (!tests.every(Boolean)) return null;
  return { id: v.id, nomHeros: nomVisiteur(v), visiteur: true };
}

async function routeSortieVisiteur(req, corps) {
  const r = corps.reponses || {};
  const compteur = await lireCompteur('sortie', req);
  if (estBloque(compteur)) {
    return { statut: 429, corps: { acces: 'NON', message: 'Trop d\'essais d\'un coup. Attends un peu, puis réessaie.' } };
  }
  let v = await lireVisiteur(idVisiteur(r.prenom, r.nom));
  if (!v) {
    const cible = normaliser(`${r.prenom ?? ''} ${r.nom ?? ''}`);
    const proches = (await tousLesVisiteurs()).filter((x) => distance(normaliser(nomVisiteur(x)), cible) <= 1);
    v = proches.length === 1 ? proches[0] : null;
  }
  const codeOk = await bcrypt.compare(String(r.code ?? ''), v?.codeHache || HACHE_LEURRE);
  if (!v || v.statut !== 'valide' || !codeOk) {
    const maintenant = Date.now();
    const fenetre = compteur.fenetre && maintenant - compteur.fenetre < 10 * 60 * 1000 ? compteur.fenetre : maintenant;
    const echecs = fenetre === compteur.fenetre ? (compteur.echecs || 0) + 1 : 1;
    await ecrireCompteur('sortie', req, echecs >= 10 ? { echecs: 0, fenetre: 0, bloqueJusqua: maintenant + BLOCAGE_MS } : { echecs, fenetre, bloqueJusqua: 0 });
    return { acces: 'NON', message: 'Ce n\'est pas ça. Réessaie.' };
  }
  const nomHeros = nomVisiteur(v);
  const h = await noter('sortie', { id: v.id, nomHeros }, { visiteur: true });
  return { acces: 'OUI', nomHeros, heure: h, message: `Au revoir, ${nomHeros}. Sortie notée à ${h}.` };
}

// ---------- Contrôle de sortie (sécurité normale) ----------

async function trouverAgentApproche(nomHeros) {
  const n = normaliser(nomHeros);
  if (!n) return null;
  const exact = await lireAgent(slug(nomHeros));
  if (exact) return exact;
  const agents = await tousLesAgents();
  const proches = agents.filter((a) => distance(normaliser(a.nomHeros), n) <= 1);
  return proches.length === 1 ? proches[0] : null;
}

function heureValide(v) {
  const c = chiffres(v);
  if (c.length !== 4) return false;
  return +c.slice(0, 2) < 24 && +c.slice(2) < 60;
}

const ETAPES_SORTIE = [
  (r, a) => Boolean(a),
  (r, a) => memeDate(r.dateNaissance, a.dateNaissance),
  (r, a) => presque(r.ville, a.ville),
  (r, a) => presque(r.plat, a.plat),
  (r, a) => presque(r.couleur, a.couleur),
  (r) => normaliser(r.destination).length > 0,
  (r) => heureValide(r.retour),
];

async function routeSortieEtape(req, corps) {
  const etape = Number(corps.etape);
  const r = corps.reponses || {};
  if (!Number.isInteger(etape) || etape < 1 || etape > 8) throw new ErreurHttp(400, 'Étape invalide.');
  const agent = await trouverAgentApproche(r.nomHeros);
  const faux = { acces: 'NON', etape, message: etape === 8 ? 'Code incorrect. Réessaie.' : 'Ce n\'est pas ça. Réessaie.' };
  for (let i = 0; i < Math.min(etape, 7); i++) {
    if (!agent || !ETAPES_SORTIE[i](r, agent)) {
      return i + 1 === etape ? faux : { ...faux, message: 'Recommence depuis le début.', recommencer: true };
    }
  }
  if (etape < 8) return { acces: 'OUI', etape };

  // Étape 8 : le code. Essais illimités, mais un robot ne peut pas tout essayer d'un coup.
  const compteur = await lireCompteur('sortie', req);
  if (estBloque(compteur)) {
    return { statut: 429, corps: { acces: 'NON', etape, message: 'Trop d\'essais d\'un coup. Attends un peu, puis réessaie.', bloqueJusqua: compteur.bloqueJusqua } };
  }
  if (!(await bcrypt.compare(String(r.code ?? ''), agent.codeHache))) {
    const maintenant = Date.now();
    const fenetre = compteur.fenetre && maintenant - compteur.fenetre < 10 * 60 * 1000 ? compteur.fenetre : maintenant;
    const echecs = fenetre === compteur.fenetre ? (compteur.echecs || 0) + 1 : 1;
    await ecrireCompteur('sortie', req, { echecs: echecs >= 10 ? 0 : echecs, fenetre: echecs >= 10 ? 0 : fenetre, bloqueJusqua: echecs >= 10 ? maintenant + BLOCAGE_MS : 0 });
    return faux;
  }
  const destination = String(r.destination).trim().slice(0, 80);
  const c = chiffres(r.retour);
  const retour = `${c.slice(0, 2)}:${c.slice(2)}`;
  const h = await noter('sortie', agent, { destination, retour });
  return { acces: 'OUI', etape, nomHeros: agent.nomHeros, heure: h, message: `À bientôt, ${agent.nomHeros}. Sortie notée à ${h}.` };
}

// ---------- Chefs ----------

// Le code admin vit seulement dans les variables d'environnement Vercel (CODE_ADMIN).
function codeAdminOk(code) {
  const attendu = process.env.CODE_ADMIN || '';
  if (!/^\d{4,}$/.test(attendu)) return false;
  const a = Buffer.from(String(code ?? ''));
  const b = Buffer.from(attendu);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const ADMIN = { id: 'admin', nomHeros: 'Admin', role: 'chef' };

async function exigerChef(req) {
  const auth = req.headers.authorization || '';
  const data = lireJeton(auth.replace(/^Bearer\s+/i, ''));
  if (!data) throw new ErreurHttp(401, 'Réservé aux chefs. Connecte-toi.');
  if (data.id === 'admin') {
    if (!process.env.CODE_ADMIN) throw new ErreurHttp(401, 'Mode admin désactivé.');
    return ADMIN;
  }
  const agent = await lireAgent(data.id);
  if (!agent || agent.role !== 'chef') throw new ErreurHttp(403, 'Réservé aux chefs.');
  return agent;
}

async function routeConnexion(req, corps) {
  const compteur = await lireCompteur('chef', req);
  if (estBloque(compteur)) {
    return { statut: 423, corps: { ok: false, bloqueJusqua: compteur.bloqueJusqua, message: 'Trop d\'erreurs. Attends 1 minute.' } };
  }
  if (corps.admin) {
    if (codeAdminOk(corps.code)) {
      await ecrireCompteur('chef', req, { echecs: 0, bloqueJusqua: 0 });
      return { ok: true, jeton: creerJeton(ADMIN), nomHeros: ADMIN.nomHeros };
    }
  }
  const agent = corps.admin ? null : await lireAgent(slug(corps.nomHeros));
  const codeOk = await bcrypt.compare(String(corps.code ?? ''), agent?.codeHache || HACHE_LEURRE);
  if (agent && agent.role === 'chef' && codeOk) {
    await ecrireCompteur('chef', req, { echecs: 0, bloqueJusqua: 0 });
    return { ok: true, jeton: creerJeton(agent), nomHeros: agent.nomHeros };
  }
  const echecs = (compteur.echecs || 0) + 1;
  await ecrireCompteur('chef', req, echecs >= 3 ? { echecs: 0, bloqueJusqua: Date.now() + BLOCAGE_MS } : { echecs, bloqueJusqua: 0 });
  return { statut: 401, corps: { ok: false, message: corps.admin ? 'Code admin incorrect.' : 'Nom de chef ou code incorrect.' } };
}

async function existeUnChef() {
  return (await tousLesAgents()).some((a) => a.role === 'chef');
}

// ---------- Mot de passe du jour ----------

function motDuJour(jour = aujourdhui()) {
  const h = crypto.createHmac('sha256', secret()).update('mot-' + jour).digest();
  return MOTS_DU_JOUR[h.readUInt32BE(0) % MOTS_DU_JOUR.length];
}

// ---------- Anniversaires ----------

function prochainAnniversaire(naissanceISO, jourISO) {
  const [, mn, jn] = naissanceISO.split('-').map(Number);
  const [a, m, j] = jourISO.split('-').map(Number);
  const auj = Date.UTC(a, m - 1, j);
  let annee = a;
  let date = Date.UTC(annee, mn - 1, jn);
  if (date < auj) {
    annee++;
    date = Date.UTC(annee, mn - 1, jn);
  }
  const [an] = naissanceISO.split('-').map(Number);
  return { dans: Math.round((date - auj) / 86400000), age: annee - an, jour: jn, mois: mn };
}

// ---------- Missions ----------

const RESULTATS = ['en cours', 'réussie', 'ratée'];

async function routeMissionEcrire(corps) {
  const nom = String(corps.nom ?? '').trim().slice(0, 100);
  if (!nom) throw new ErreurHttp(400, 'Donne un nom à la mission.');
  const date = dateISO(corps.date) || aujourdhui();
  const resultat = RESULTATS.includes(corps.resultat) ? corps.resultat : 'en cours';
  const agents = Array.isArray(corps.agents) ? corps.agents.map((x) => String(x).slice(0, 60)).slice(0, 30) : [];
  const notes = String(corps.notes ?? '').slice(0, 1000);
  const id = corps.id && /^[a-z0-9-]+$/.test(corps.id) ? corps.id : `${date}-${crypto.randomBytes(3).toString('hex')}`;
  const mission = { id, nom, date, resultat, agents, notes };
  await ecrireJSON(`missions/${id}.json`, mission);
  return mission;
}

async function toutesLesMissions() {
  const chemins = await lister('missions/');
  const missions = (await Promise.all(chemins.map((c) => lireJSON(c)))).filter(Boolean);
  return missions.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- Gadgets et liste rouge ----------

function nettoyerGadgets(liste) {
  if (!Array.isArray(liste)) throw new ErreurHttp(400, 'Liste invalide.');
  return liste.slice(0, 200).map((g) => ({
    id: /^[a-z0-9]+$/.test(g.id || '') ? g.id : crypto.randomBytes(4).toString('hex'),
    nom: String(g.nom ?? '').trim().slice(0, 80),
    emprunteur: String(g.emprunteur ?? '').trim().slice(0, 60),
    retour: dateValide(g.retour) ? g.retour : '',
  })).filter((g) => g.nom);
}

function nettoyerListeRouge(liste) {
  if (!Array.isArray(liste)) throw new ErreurHttp(400, 'Liste invalide.');
  return liste.slice(0, 100).map((p) => ({
    nom: String(p.nom ?? '').trim().slice(0, 60),
    raison: String(p.raison ?? '').trim().slice(0, 120),
  })).filter((p) => p.nom);
}

// ---------- Aiguillage ----------

export async function router(methode, route, req, corps, query) {
  const R = `${methode} ${route}`;
  switch (R) {
    case 'GET etat': {
      const compteur = await lireCompteur('entree', req);
      return {
        installe: await existeUnChef(),
        alarme: await lireAlarme(),
        bloqueJusqua: estBloque(compteur) ? compteur.bloqueJusqua : 0,
        // Seulement un nombre : pas de nom, pas de donnée personnelle.
        visiteursIncomplets: (await tousLesVisiteurs()).filter((v) => champsManquants(v).length > 0).length,
        stockage: modeStockage,
      };
    }

    case 'POST installation': {
      if (await existeUnChef()) throw new ErreurHttp(403, 'Le QG est déjà installé.');
      // En ligne, il faut le code admin pour installer le QG.
      if (process.env.CODE_ADMIN ? !codeAdminOk(corps.codeAdmin) : Boolean(process.env.VERCEL)) {
        throw new ErreurHttp(403, process.env.CODE_ADMIN ? 'Code admin incorrect.' : 'CODE_ADMIN n\'est pas réglé sur Vercel.');
      }
      const agent = await creerAgent(corps, 'chef');
      return { ok: true, agent: agentSansSecret(agent), jeton: creerJeton(agent) };
    }

    case 'POST chef/connexion':
      return routeConnexion(req, corps);

    case 'POST entree':
      return routeEntree(req, corps);

    case 'POST sortie/etape':
      return routeSortieEtape(req, corps);

    case 'POST visiteurs': {
      const v = await creerVisiteur(corps);
      return { ok: true, visiteur: visiteurSansSecret(v) };
    }

    case 'GET visiteurs':
      await exigerChef(req);
      return { visiteurs: (await tousLesVisiteurs()).map((v) => ({ ...visiteurSansSecret(v), manquants: champsManquants(v) })) };

    case 'POST visiteurs/completer': {
      await exigerChef(req);
      const v = await lireVisiteur(corps.id);
      if (!v) throw new ErreurHttp(404, 'Visiteur introuvable.');
      const ajouts = nettoyerChampsVisiteur(corps, true);
      // Le prénom et le nom donnent l'identifiant du compte : on ne les change pas ici.
      delete ajouts.prenom;
      delete ajouts.nom;
      Object.assign(v, ajouts);
      if (corps.code) {
        const code = String(corps.code);
        if (codeTropFacile(code)) throw new ErreurHttp(400, 'Code secret trop facile ou invalide.');
        v.codeHache = await bcrypt.hash(code, COUT_BCRYPT);
      }
      await ecrireJSON(`visiteurs/${v.id}.json`, v);
      return { ok: true, visiteur: { ...visiteurSansSecret(v), manquants: champsManquants(v) } };
    }

    case 'POST visiteurs/statut': {
      const chef = await exigerChef(req);
      const v = await lireVisiteur(corps.id);
      if (!v) throw new ErreurHttp(404, 'Visiteur introuvable.');
      v.statut = corps.statut === 'valide' ? 'valide' : 'en-attente';
      v.validePar = v.statut === 'valide' ? chef.nomHeros : null;
      await ecrireJSON(`visiteurs/${v.id}.json`, v);
      return { ok: true, visiteur: visiteurSansSecret(v) };
    }

    case 'DELETE visiteurs': {
      await exigerChef(req);
      const v = await lireVisiteur(query.get('id'));
      if (!v) throw new ErreurHttp(404, 'Visiteur introuvable.');
      await supprimer(`visiteurs/${v.id}.json`);
      return { ok: true };
    }

    case 'POST visiteurs/entree':
      return controleEntree(req, () => verifierEntreeVisiteur(corps.reponses || {}));

    case 'POST visiteurs/sortie':
      return routeSortieVisiteur(req, corps);

    case 'GET agents':
      await exigerChef(req);
      return { agents: (await tousLesAgents()).map(agentSansSecret) };

    case 'POST agents': {
      await exigerChef(req);
      const agent = await creerAgent(corps, corps.role);
      return { ok: true, agent: agentSansSecret(agent) };
    }

    case 'DELETE agents': {
      const chef = await exigerChef(req);
      const agent = await lireAgent(query.get('id'));
      if (!agent) throw new ErreurHttp(404, 'Agent introuvable.');
      if (agent.id === chef.id) throw new ErreurHttp(400, 'Un chef ne peut pas se supprimer lui-même.');
      if (agent.photo) await supprimer(agent.photo);
      await supprimer(`agents/${agent.id}.json`);
      return { ok: true };
    }

    case 'POST agents/code': {
      await exigerChef(req);
      const agent = await lireAgent(corps.id);
      if (!agent) throw new ErreurHttp(404, 'Agent introuvable.');
      const code = String(corps.code ?? '');
      if (codeTropFacile(code)) throw new ErreurHttp(400, 'Code trop facile ou invalide.');
      const autres = (await tousLesAgents()).filter((a) => a.id !== agent.id);
      if (await codeDejaPris(code, autres)) throw new ErreurHttp(409, 'Ce code est déjà pris.');
      agent.codeHache = await bcrypt.hash(code, COUT_BCRYPT);
      await ecrireJSON(`agents/${agent.id}.json`, agent);
      return { ok: true };
    }

    case 'GET photo': {
      await exigerChef(req);
      const agent = await lireAgent(query.get('id'));
      if (!agent?.photo) throw new ErreurHttp(404, 'Pas de photo.');
      const f = await lireBinaire(agent.photo);
      if (!f) throw new ErreurHttp(404, 'Pas de photo.');
      return { binaire: f.donnees, type: 'image/jpeg' };
    }

    case 'POST code/nouveau': {
      // Ouvert sans chef seulement pendant l'installation (avant le premier chef).
      if (await existeUnChef()) await exigerChef(req);
      return { code: await nouveauCode(await tousLesAgents()) };
    }

    case 'GET registre': {
      const date = query.get('date') || aujourdhui();
      if (!dateValide(date)) throw new ErreurHttp(400, 'Date invalide.');
      return { date, lignes: await lireJSON(`registre/${date}.json`, []) };
    }

    case 'GET presents': {
      const presence = await lireJSON('presence.json', {});
      const agents = await tousLesAgents();
      const visiteurs = (await tousLesVisiteurs()).filter((v) => presence[v.id]?.etat === 'dedans');
      return {
        agents: agents.map((a) => ({
          ...agentPublic(a),
          etat: presence[a.id]?.etat || 'dehors',
          depuis: presence[a.id]?.depuis || null,
        })),
        visiteurs: visiteurs.map((v) => ({ id: v.id, nom: nomVisiteur(v), lien: v.lien, depuis: presence[v.id].depuis })),
      };
    }

    case 'GET alarme':
      return lireAlarme();

    case 'POST alarme/arret': {
      const chef = await exigerChef(req);
      await arreterAlarme(chef.nomHeros);
      return { ok: true };
    }

    case 'GET mot-du-jour':
      await exigerChef(req);
      return { date: aujourdhui(), mot: motDuJour() };

    case 'GET missions':
      return { missions: await toutesLesMissions() };

    case 'POST missions':
      await exigerChef(req);
      return { ok: true, mission: await routeMissionEcrire(corps) };

    case 'DELETE missions': {
      await exigerChef(req);
      const id = query.get('id') || '';
      if (!/^[a-z0-9-]+$/.test(id)) throw new ErreurHttp(400, 'Mission invalide.');
      await supprimer(`missions/${id}.json`);
      return { ok: true };
    }

    case 'GET anniversaires': {
      const jour = aujourdhui();
      const agents = await tousLesAgents();
      return {
        aujourdhui: jour,
        anniversaires: agents
          .map((a) => ({ nomHeros: a.nomHeros, ...prochainAnniversaire(a.dateNaissance, jour) }))
          .sort((x, y) => x.dans - y.dans),
      };
    }

    case 'GET menu': {
      const presence = await lireJSON('presence.json', {});
      const agents = (await tousLesAgents()).filter((a) => presence[a.id]?.etat === 'dedans');
      const unique = (champ) => [...new Map(agents.map((a) => [normaliser(a[champ]), a[champ]])).values()];
      return { nbPresents: agents.length, entrees: unique('entree'), plats: unique('plat'), desserts: unique('dessert') };
    }

    case 'GET gadgets':
      return { gadgets: await lireJSON('gadgets.json', []) };

    case 'PUT gadgets': {
      await exigerChef(req);
      const gadgets = nettoyerGadgets(corps.gadgets);
      await ecrireJSON('gadgets.json', gadgets);
      return { ok: true, gadgets };
    }

    case 'GET liste-rouge':
      await exigerChef(req);
      return { liste: await lireJSON('liste-rouge.json', []) };

    case 'PUT liste-rouge': {
      await exigerChef(req);
      const liste = nettoyerListeRouge(corps.liste);
      await ecrireJSON('liste-rouge.json', liste);
      return { ok: true, liste };
    }

    default:
      throw new ErreurHttp(404, 'Route inconnue.');
  }
}

// Point d'entrée commun : Vercel (api/index.js) et le serveur local (server/dev.js).
export async function gerer(req, res) {
  const url = new URL(req.url, 'http://local');
  let route = url.searchParams.get('__route') || url.pathname.replace(/^\/api\/?/, '');
  route = route.replace(/^\/+|\/+$/g, '');
  url.searchParams.delete('__route');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    let corps = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      if (req.body !== undefined && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) corps = req.body || {};
      else {
        const brut = typeof req.body === 'string' ? req.body : await lireCorps(req);
        corps = brut ? JSON.parse(brut) : {};
      }
    }
    const resultat = await router(req.method, route, req, corps, url.searchParams);
    if (resultat?.binaire) {
      res.statusCode = 200;
      res.setHeader('Content-Type', resultat.type);
      res.end(resultat.binaire);
      return;
    }
    const statut = resultat?.statut || 200;
    envoyer(res, statut, resultat?.statut ? resultat.corps : resultat);
  } catch (e) {
    if (e instanceof ErreurHttp) return envoyer(res, e.statut, { erreur: e.message, ...e.extra });
    if (e instanceof SyntaxError) return envoyer(res, 400, { erreur: 'Requête illisible.' });
    console.error(e);
    const message = /Store Vercel Blob non relié/.test(e?.message) ? e.message : 'Erreur du serveur.';
    envoyer(res, 500, { erreur: message });
  }
}

function envoyer(res, statut, objet) {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(objet));
}

function lireCorps(req) {
  return new Promise((resolve, reject) => {
    let taille = 0;
    const morceaux = [];
    req.on('data', (m) => {
      taille += m.length;
      if (taille > 2 * 1024 * 1024) {
        reject(new ErreurHttp(413, 'Trop gros.'));
        req.destroy();
      } else morceaux.push(m);
    });
    req.on('end', () => resolve(Buffer.concat(morceaux).toString('utf8')));
    req.on('error', reject);
  });
}

export { codeTropFacile, motDuJour, prochainAnniversaire };
