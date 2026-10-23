# QG de l'Agence M²

Le site de l'Agence M² (**M**aël + **M**arin Domenech) : contrôle d'entrée et de sortie du QG, fiches d'agents, comptes visiteurs et 18 outils, construits d'après la charte (`public/charte.html`, maquette d'origine dans `project/`).

## Comment ça marche

```
Navigateur ──► /api (le « vigile », une fonction Vercel) ──► Vercel Blob privé (le « carnet »)
           ◄── seulement { "acces": "OUI" } ou "NON"
```

- Les vraies réponses et les codes ne quittent jamais le serveur.
- Codes secrets hachés avec bcrypt. Comparaison sans majuscules ni accents.
- Entrée : 16 questions, réponse seulement à la fin. 3 NON de suite = alarme + clavier bloqué 1 minute (compteur côté serveur).
- Sortie : 8 questions vérifiées une par une, une faute d'1 lettre acceptée.
- Visiteurs : ils créent leur compte sur `/visiteurs`, un chef le valide, puis ils passent un contrôle plus court (même alarme, même liste rouge).

## Mise en ligne (Vercel)

Variables d'environnement à régler dans Vercel → Settings → Environment Variables :

| Variable | Rôle |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Ajoutée toute seule quand on relie un store **Blob privé** au projet (Storage → Blob). |
| `SESSION_SECRET` | Au moins 32 caractères au hasard. Signe les sessions des chefs. |
| `CODE_ADMIN` | Le code admin (chiffres). Ouvre tous les outils chef et sert à installer le QG. **Jamais dans le code.** |

Première fois : ouvrir `/installation`, remplir la fiche du premier chef et taper le code admin.

## Sur l'ordinateur

```bash
npm install
npm run dev     # site sur http://localhost:5173, API sur :3001, données dans .donnees/
npm test        # vérifie les règles de la charte
```

Sans `BLOB_READ_WRITE_TOKEN`, les données sont rangées dans le dossier `.donnees/` (ignoré par git).

## Où sont les choses

- `api/index.js` : la seule fonction Vercel (toutes les routes `/api/*` y arrivent).
- `server/routes.js` : toutes les routes et les règles de sécurité.
- `server/stockage.js` : Vercel Blob privé, ou dossier local.
- `src/pages/` : une page par outil. `src/composants/` : les pièces de la charte (boutons, cases du code, écran d'étape…).
