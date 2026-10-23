// Le « carnet du vigile » : lecture et écriture des fichiers de l'Agence.
// En ligne : Vercel Blob en accès PRIVÉ (variable BLOB_READ_WRITE_TOKEN).
// Sur l'ordinateur (sans jeton) : un dossier local .donnees/ pour tester.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const avecBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const DOSSIER_LOCAL = path.resolve(process.env.DOSSIER_DONNEES || '.donnees');

let blobSdk;
async function blob() {
  if (!blobSdk) blobSdk = await import('@vercel/blob');
  return blobSdk;
}

function cheminSur(chemin) {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(chemin) || chemin.includes('..')) {
    throw new Error('Chemin interdit : ' + chemin);
  }
  return chemin;
}

async function streamVersBuffer(stream) {
  const morceaux = [];
  const lecteur = stream.getReader();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    morceaux.push(Buffer.from(value));
  }
  return Buffer.concat(morceaux);
}

export async function lireBinaire(chemin) {
  cheminSur(chemin);
  if (avecBlob) {
    const { get } = await blob();
    const res = await get(chemin, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return { donnees: await streamVersBuffer(res.stream), type: res.blob.contentType };
  }
  try {
    return { donnees: await fs.readFile(path.join(DOSSIER_LOCAL, chemin)), type: typeDepuisNom(chemin) };
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function ecrireBinaire(chemin, donnees, type) {
  cheminSur(chemin);
  if (avecBlob) {
    const { put } = await blob();
    await put(chemin, donnees, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: type,
      cacheControlMaxAge: 60,
    });
    return;
  }
  const complet = path.join(DOSSIER_LOCAL, chemin);
  await fs.mkdir(path.dirname(complet), { recursive: true });
  await fs.writeFile(complet, donnees);
}

export async function lireJSON(chemin, parDefaut = null) {
  const f = await lireBinaire(chemin);
  if (!f) return parDefaut;
  return JSON.parse(f.donnees.toString('utf8'));
}

export async function ecrireJSON(chemin, objet) {
  await ecrireBinaire(chemin, Buffer.from(JSON.stringify(objet, null, 2)), 'application/json');
}

export async function supprimer(chemin) {
  cheminSur(chemin);
  if (avecBlob) {
    const { del, head } = await blob();
    try {
      const info = await head(chemin);
      await del(info.url);
    } catch (e) {
      if (!/not.?found/i.test(String(e?.message || e?.name))) throw e;
    }
    return;
  }
  await fs.rm(path.join(DOSSIER_LOCAL, chemin), { force: true });
}

// Liste les chemins qui commencent par « prefixe » (ex. « agents/ »).
export async function lister(prefixe) {
  cheminSur(prefixe);
  if (avecBlob) {
    const { list } = await blob();
    const chemins = [];
    let cursor;
    do {
      const page = await list({ prefix: prefixe, cursor });
      chemins.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return chemins;
  }
  const dossier = path.join(DOSSIER_LOCAL, prefixe);
  try {
    const noms = await fs.readdir(dossier);
    return noms.map((n) => prefixe + n);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function typeDepuisNom(nom) {
  if (nom.endsWith('.json')) return 'application/json';
  if (nom.endsWith('.jpg')) return 'image/jpeg';
  return 'application/octet-stream';
}

export const modeStockage = avecBlob ? 'vercel-blob' : 'local';
