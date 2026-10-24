// Tests des règles de la charte, avec un stockage local temporaire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.DOSSIER_DONNEES = mkdtempSync(path.join(tmpdir(), 'm2-'));
delete process.env.BLOB_READ_WRITE_TOKEN;
delete process.env.BLOB_STORE_ID;
const { router, codeTropFacile } = await import('../server/routes.js');
const { ageLe, aujourdhui } = await import('../server/temps.js');

let ip = 1;
const fauxReq = (jeton, adresse = '10.0.0.1') => ({ headers: { 'x-forwarded-for': adresse, authorization: jeton ? `Bearer ${jeton}` : '' } });
const appel = (m, r, corps = {}, jeton, q = '', adresse) => router(m, r, fauxReq(jeton, adresse), corps, new URLSearchParams(q));

const mael = {
  nomHeros: 'Captain Circuit', prenom: 'Maël', nom: 'Domenech', dateNaissance: '12/03/2016',
  adresse: '4 rue des Lilas', codePostal: '35000', ville: 'Rennes', entree: 'Tomates mozzarella',
  plat: 'Lasagnes', dessert: 'Mousse au chocolat', couleur: 'Bleu', pouvoir: 'Pirater les ordinateurs',
  chef: 'Maël', code: '4827',
};
const bonnesReponses = () => ({
  ...mael, nomHeros: 'CAPTAIN circuit', prenom: 'mael', dateNaissance: '12 / 03 / 2016',
  age: String(ageLe('2016-03-12')), lettres: '14',
});

let jeton;

test('installation du premier chef, puis plus jamais', async () => {
  const r = await appel('POST', 'installation', mael);
  assert.equal(r.ok, true);
  assert.equal(r.agent.role, 'chef');
  assert.equal(r.agent.codeHache, undefined);
  jeton = r.jeton;
  await assert.rejects(appel('POST', 'installation', { ...mael, nomHeros: 'Autre' }), /déjà installé/);
});

test('les routes chef refusent sans jeton', async () => {
  await assert.rejects(appel('GET', 'agents'), /chefs/);
  const r = await appel('GET', 'agents', {}, jeton);
  assert.equal(r.agents.length, 1);
  assert.equal(r.agents[0].codeHache, undefined);
});

test('connexion chef', async () => {
  const ok = await appel('POST', 'chef/connexion', { nomHeros: 'captain circuit', code: '4827' }, null, '', '10.9.9.9');
  assert.equal(ok.ok, true);
  const non = await appel('POST', 'chef/connexion', { nomHeros: 'captain circuit', code: '1111' }, null, '', '10.9.9.9');
  assert.equal(non.statut, 401);
});

test('entrée : OUI avec toutes les bonnes réponses (sans majuscules ni accents)', async () => {
  const r = await appel('POST', 'entree', { reponses: bonnesReponses() });
  assert.equal(r.acces, 'OUI');
  const reg = await appel('GET', 'registre', {}, null, `date=${aujourdhui()}`);
  assert.equal(reg.lignes.at(-1).type, 'entree');
  const p = await appel('GET', 'presents');
  assert.equal(p.agents[0].etat, 'dedans');
});

test('entrée : une seule erreur = NON sans dire laquelle, 3 NON = alarme et blocage', async () => {
  const adr = '10.0.0.77';
  const faux = { reponses: { ...bonnesReponses(), dessert: 'Gâteau au citron' } };
  const r1 = await appel('POST', 'entree', faux, null, '', adr);
  assert.equal(r1.acces, 'NON');
  assert.match(r1.message, /Essai 1 sur 3/);
  assert.doesNotMatch(JSON.stringify(r1), /dessert/i);
  await appel('POST', 'entree', faux, null, '', adr);
  const r3 = await appel('POST', 'entree', faux, null, '', adr);
  assert.equal(r3.alarme, true);
  const bloque = await appel('POST', 'entree', { reponses: bonnesReponses() }, null, '', adr);
  assert.equal(bloque.statut, 423);
  assert.equal((await appel('GET', 'alarme')).active, true);
  await assert.rejects(appel('POST', 'alarme/arret'), /chefs/);
  await appel('POST', 'alarme/arret', {}, jeton);
  assert.equal((await appel('GET', 'alarme')).active, false);
});

test('liste rouge : accès refusé direct', async () => {
  await appel('PUT', 'liste-rouge', { liste: [{ nom: 'Captain Circuit', raison: 'test' }] }, jeton);
  const r = await appel('POST', 'entree', { reponses: bonnesReponses() }, null, '', '10.0.0.5');
  assert.equal(r.acces, 'NON');
  await appel('PUT', 'liste-rouge', { liste: [] }, jeton);
});

test('sortie : une faute d\'une lettre acceptée, réponse à chaque étape', async () => {
  const rep = { nomHeros: 'Captain Circuitt', dateNaissance: '12/03/2016', ville: 'Renes', plat: 'Lasagne', couleur: 'bleu', destination: 'Mission au parc', retour: '18:30', code: '4827' };
  for (let e = 1; e <= 7; e++) assert.equal((await appel('POST', 'sortie/etape', { etape: e, reponses: rep })).acces, 'OUI', 'étape ' + e);
  assert.equal((await appel('POST', 'sortie/etape', { etape: 3, reponses: { ...rep, ville: 'Paris' } })).acces, 'NON');
  assert.equal((await appel('POST', 'sortie/etape', { etape: 8, reponses: { ...rep, code: '9999' } })).acces, 'NON');
  const fin = await appel('POST', 'sortie/etape', { etape: 8, reponses: rep });
  assert.equal(fin.acces, 'OUI');
  const p = await appel('GET', 'presents');
  assert.equal(p.agents[0].etat, 'dehors');
});

test('générateur : pas de codes faciles ni déjà pris', async () => {
  for (const c of ['0000', '1111', '1234', '4321', '1212', '12a4', '123', '1234567', '123456', '121212', '845845']) assert.equal(codeTropFacile(c), true, c);
  assert.equal(codeTropFacile('4827'), false);
  assert.equal(codeTropFacile('583916'), false, 'un code à 6 chiffres est accepté');
  const { code } = await appel('POST', 'code/nouveau', {}, jeton);
  assert.match(code, /^\d{4}$/);
  assert.notEqual(code, '4827');
  await assert.rejects(appel('POST', 'agents', { ...mael, nomHeros: 'Turbo Marin', code: '4827' }, jeton), /déjà pris/);
  const r = await appel('POST', 'agents', { ...mael, nomHeros: 'Turbo Marin', prenom: 'Marin', code }, jeton);
  assert.equal(r.agent.numero, '002');
});

test('menu, anniversaires, missions, gadgets, mot du jour', async () => {
  const a = await appel('GET', 'anniversaires');
  assert.equal(a.anniversaires.length, 2);
  const m = await appel('POST', 'missions', { nom: 'Opération biscuit', agents: ['Captain Circuit'] }, jeton);
  assert.equal(m.mission.resultat, 'en cours');
  assert.equal((await appel('GET', 'missions')).missions.length, 1);
  const g = await appel('PUT', 'gadgets', { gadgets: [{ nom: 'Talkie-walkie', emprunteur: 'Turbo Marin', retour: '2026-11-01' }] }, jeton);
  assert.equal(g.gadgets.length, 1);
  const mot = await appel('GET', 'mot-du-jour', {}, jeton);
  assert.ok(mot.mot.length > 2);
  const menu = await appel('GET', 'menu');
  assert.equal(menu.nbPresents, 0);
});

test('visiteurs : compte en attente, validé par un chef, puis entrée et sortie', async () => {
  const papi = {
    prenom: 'Jean', nom: 'Dupont', lien: 'Grand-père', code: '5917', dateNaissance: '02/04/1955',
    adresse: '12 rue du Port', codePostal: '29200', ville: 'Brest', entree: 'Huîtres', plat: 'Galette',
    dessert: 'Far breton', couleur: 'Vert', pouvoir: 'Raconter des histoires', chef: 'Marin',
  };
  await assert.rejects(appel('POST', 'visiteurs', { ...papi, code: '1234' }), /trop facile/);
  const c = await appel('POST', 'visiteurs', papi);
  assert.equal(c.visiteur.statut, 'en-attente');
  assert.equal(c.visiteur.codeHache, undefined);
  const rep = {
    prenom: 'jean', nom: 'DUPONT', dateNaissance: '02 / 04 / 1955', age: String(ageLe('1955-04-02')),
    adresse: '12 rue du port', codePostal: '29200', ville: 'brest', entree: 'huitres', plat: 'galette',
    dessert: 'far breton', couleur: 'vert', pouvoir: 'raconter des histoires', chef: 'marin', code: '5917',
  };
  const adr = '10.0.1.1';
  assert.equal((await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', adr)).acces, 'NON', 'pas encore validé');
  await assert.rejects(appel('POST', 'visiteurs/statut', { id: c.visiteur.id, statut: 'valide' }), /chefs/);
  await appel('POST', 'visiteurs/statut', { id: c.visiteur.id, statut: 'valide' }, jeton);
  assert.equal((await appel('POST', 'visiteurs/entree', { reponses: { ...rep, plat: 'Crêpe' } }, null, '', adr)).acces, 'NON', 'une réponse fausse sur 14');
  const e = await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', adr);
  assert.equal(e.acces, 'OUI');
  const p = await appel('GET', 'presents');
  assert.equal(p.visiteurs.length, 1);
  assert.equal((await appel('POST', 'visiteurs/sortie', { reponses: { prenom: 'Jean', nom: 'Dupond', code: '0000' } })).acces, 'NON');
  assert.equal((await appel('POST', 'visiteurs/sortie', { reponses: { prenom: 'Jean', nom: 'Dupond', code: '5917' } })).acces, 'OUI');
  const reg = await appel('GET', 'registre');
  assert.equal(reg.lignes.at(-1).visiteur, true);
  const liste = await appel('GET', 'visiteurs', {}, jeton);
  assert.equal(liste.visiteurs.length, 1);
});

test('code admin : ouvre les outils chef, refusé si faux', async () => {
  process.env.CODE_ADMIN = '987650';
  const non = await appel('POST', 'chef/connexion', { admin: true, code: '987651' }, null, '', '10.7.7.7');
  assert.equal(non.statut, 401);
  const oui = await appel('POST', 'chef/connexion', { admin: true, code: '987650' }, null, '', '10.7.7.8');
  assert.equal(oui.ok, true);
  assert.ok((await appel('GET', 'agents', {}, oui.jeton)).agents.length >= 1);
  delete process.env.CODE_ADMIN;
});

test('visiteur ancien sans toutes les données : alerte, refusé, puis complété par un chef', async () => {
  const { ecrireJSON } = await import('../server/stockage.js');
  const bcrypt = (await import('bcryptjs')).default;
  await ecrireJSON('visiteurs/v-ancien-copain.json', {
    id: 'v-ancien-copain', prenom: 'Ancien', nom: 'Copain', lien: 'Copain',
    codeHache: bcrypt.hashSync('7351', 4), statut: 'valide', creeLe: new Date().toISOString(),
  });
  assert.equal((await appel('GET', 'etat')).visiteursIncomplets, 1);
  const liste = await appel('GET', 'visiteurs', {}, jeton);
  assert.ok(liste.visiteurs.find((v) => v.id === 'v-ancien-copain').manquants.includes('plat'));
  const rep = {
    prenom: 'Ancien', nom: 'Copain', dateNaissance: '01/01/2017', age: String(ageLe('2017-01-01')),
    adresse: '1 rue A', codePostal: '35000', ville: 'Rennes', entree: 'Soupe', plat: 'Pâtes',
    dessert: 'Yaourt', couleur: 'Jaune', pouvoir: 'Voler', chef: 'Maël', code: '7351',
  };
  assert.equal((await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', '10.0.2.1')).acces, 'NON');
  await assert.rejects(appel('POST', 'visiteurs/completer', { id: 'v-ancien-copain', ...rep }), /chefs/);
  const c = await appel('POST', 'visiteurs/completer', { id: 'v-ancien-copain', ...rep, code: '' }, jeton);
  assert.deepEqual(c.visiteur.manquants, []);
  assert.equal((await appel('GET', 'etat')).visiteursIncomplets, 0);
  assert.equal((await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', '10.0.2.2')).acces, 'OUI');
});

test('code admin = le premier chef (un seul compte)', async () => {
  process.env.CODE_ADMIN = '987650';
  const r = await appel('POST', 'chef/connexion', { admin: true, code: '987650' }, null, '', '10.8.0.1');
  assert.equal(r.nomHeros, 'Captain Circuit', 'le code admin connecte en tant que chef n° 001');
  const parNom = await appel('POST', 'chef/connexion', { nomHeros: 'Captain Circuit', code: '987650' }, null, '', '10.8.0.2');
  assert.equal(parNom.ok, true, 'le premier chef peut utiliser le code admin');
  const autre = await appel('POST', 'chef/connexion', { nomHeros: 'Turbo Marin', code: '987650' }, null, '', '10.8.0.3');
  assert.equal(autre.statut, 401, 'pas les autres chefs');
  await appel('POST', 'alarme/arret', {}, r.jeton);
  assert.equal((await appel('GET', 'alarme')).arreteePar, 'Captain Circuit');
  delete process.env.CODE_ADMIN;
});

test('un chef peut modifier la fiche d\'un agent (dessert préféré)', async () => {
  await assert.rejects(appel('POST', 'agents/modifier', { id: 'turbo-marin', dessert: 'Tiramisu' }), /chefs/);
  const r = await appel('POST', 'agents/modifier', { id: 'turbo-marin', dessert: 'Tiramisu' }, jeton);
  assert.equal(r.agent.dessert, 'Tiramisu');
  assert.equal(r.agent.nomHeros, 'Turbo Marin');
  assert.equal(r.agent.codeHache, undefined);
});

test('un chef peut modifier la fiche d\'un visiteur (et son code)', async () => {
  const r = await appel('POST', 'visiteurs/completer', { id: 'v-jean-dupont', dessert: 'Tiramisu', code: '6481' }, jeton);
  assert.equal(r.visiteur.dessert, 'Tiramisu');
  assert.equal(r.visiteur.prenom, 'Jean');
  const rep = {
    prenom: 'Jean', nom: 'Dupont', dateNaissance: '02/04/1955', age: String(ageLe('1955-04-02')),
    adresse: '12 rue du Port', codePostal: '29200', ville: 'Brest', entree: 'Huîtres', plat: 'Galette',
    dessert: 'Tiramisu', couleur: 'Vert', pouvoir: 'Raconter des histoires', chef: 'Marin', code: '6481',
  };
  assert.equal((await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', '10.0.9.1')).acces, 'OUI');
});

test('le code admin marche aussi à l\'entrée et à la sortie pour le premier chef', async () => {
  process.env.CODE_ADMIN = '987650';
  const entree = await appel('POST', 'entree', { reponses: { ...bonnesReponses(), code: '987650' } }, null, '', '10.6.0.1');
  assert.equal(entree.acces, 'OUI');
  const rep = { nomHeros: 'Captain Circuit', dateNaissance: '12/03/2016', ville: 'Rennes', plat: 'Lasagnes', couleur: 'Bleu', destination: 'Parc', retour: '18:30', code: '987650' };
  assert.equal((await appel('POST', 'sortie/etape', { etape: 8, reponses: rep }, null, '', '10.6.0.2')).acces, 'OUI');
  // Pas pour les autres agents
  const marin = { nomHeros: 'Turbo Marin', dateNaissance: '05/11/2019', ville: 'Rennes', plat: 'Galette', couleur: 'Bleu', destination: 'Parc', retour: '18:30', code: '987650' };
  assert.equal((await appel('POST', 'sortie/etape', { etape: 8, reponses: marin }, null, '', '10.6.0.3')).acces, 'NON');
  delete process.env.CODE_ADMIN;
});

test('visiteur pas encore validé : message clair avec le bon code, sans compter d\'erreur', async () => {
  const f = {
    prenom: 'Adeline', nom: 'Domenech', lien: 'Maman', dateNaissance: '01/02/1985', adresse: '4 rue des Lilas',
    codePostal: '35000', ville: 'Rennes', entree: 'Salade', plat: 'Risotto', dessert: 'Tarte', couleur: 'Rose',
    pouvoir: 'Tout savoir', chef: 'Maël', code: '3958',
  };
  await appel('POST', 'visiteurs', f);
  const s1 = await appel('POST', 'visiteurs/sortie', { reponses: { prenom: 'Adeline', nom: 'Domenech', code: '3958' } }, null, '', '10.5.0.1');
  assert.match(s1.message, /pas encore validé/);
  const s2 = await appel('POST', 'visiteurs/sortie', { reponses: { prenom: 'Adeline', nom: 'Domenech', code: '1111' } }, null, '', '10.5.0.1');
  assert.doesNotMatch(s2.message, /validé/, 'mauvais code : on ne dit rien');
  const rep = { ...f, age: String(ageLe('1985-02-01')) };
  for (let i = 0; i < 3; i++) {
    const e = await appel('POST', 'visiteurs/entree', { reponses: rep }, null, '', '10.5.0.2');
    assert.match(e.message, /pas encore validé/);
    assert.notEqual(e.alarme, true, 'pas d\'alarme pour un compte en attente');
  }
  await appel('POST', 'visiteurs/statut', { id: 'v-adeline-domenech', statut: 'valide' }, jeton);
  assert.equal((await appel('POST', 'visiteurs/sortie', { reponses: { prenom: 'Adeline', nom: 'Domenech', code: '3958' } }, null, '', '10.5.0.3')).acces, 'OUI');
});
