# Marque super-héros enfantine

_Started 2026-10-23 14:22 UTC_

---

## User

brand guidelines enfantines des super héros, tenu par Maël, 10 ans, et Marin, 6 ans. Plein d'outils comme la vérification d'entrée et de sortie du batiment, avec ce que la personne aime manger entrée platn dessert, date naissance, code superhéros, adresse, code postal, etc.

## Assistant



## Assistant

_[tool: ask_user]_

_[tool: ask_user]_

J'ai ouvert un formulaire avec quelques questions sur le nom de l'équipe, les héros, les outils à inclure, la vérification d'entrée et le ton. J'attends tes réponses pour commencer.

## User

Answered — ds: Design system left to Claude; heros: Maël = informaticien et technicien, Marin = le reste; livrable: Brand guidelines (logo, couleurs, typo, règles), Contrôle d'entrée/sortie du QG, Fiche d'inscription super-héros, Carte d'identité / badge imprimable, Registre des visiteurs, Générateur de code secret; usage: Les deux; fiche: Nom de super-héros, Date de naissance, Code super-héros, Adresse, Code postal, Ville, Entrée préférée, Plat préféré, Dessert préféré, Couleur préférée, Photo; verif: On tape le code secret → accès autorisé/refusé; lecteur: Les enfants seuls; ton: Sérieux co…

## Assistant

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

J'ai fait la charte de l'Agence M². Elle contient la mission, Maël et Marin, le logo, 6 couleurs, 3 polices, les éléments d'interface et les deux contrôles :

- **Entrée (sécurité maximale)** : 16 questions, une par écran, toutes tapées au clavier. Le site répond OUI ou NON seulement à la fin, sans dire quelle réponse est fausse. Après 3 NON de suite, l'alarme sonne et le clavier est bloqué 1 minute.
- **Sortie (sécurité normale)** : 8 questions. Une faute d'une lettre est acceptée, le site dit tout de suite si c'est faux, et on peut réessayer autant qu'on veut.

Le nom « Agence M² » (Maël + Marin) et les réponses d'exemple (Captain Circuit, Rennes…) sont inventés, à remplacer par les vrais. Les photos de Maël et Marin sont des cases vides à remplir. Les outils eux-mêmes ne sont pas construits, puisque tu les feras avec Claude Code.

## User

Maël et Marin Domenech

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

J'ai ajouté le nom Domenech dans la mission, sur les cartes de Maël et Marin, et dans la réponse d'exemple « nom de famille » du contrôle d'entrée.

## User

on peut peut-être éviter Supabase et faire avec github issues ou bien un blob vercel?

## Assistant

Oui, ça marche. Mon avis :

**GitHub Issues : à éviter.**
- Ça n'est pas fait pour stocker des données. Il y a des limites d'appels et c'est lent.
- Le jeton GitHub ne doit pas être dans le navigateur, donc il faut quand même un petit serveur.
- Une erreur de réglage du dépôt, et les adresses et dates de naissance des enfants deviennent publiques.

**Vercel Blob : bien adapté.**
- Un fichier JSON par agent (`agents/captain-circuit.json`) et un fichier par jour pour le registre (`registre/2026-10-23.json`).
- Une route API Vercel (`/api/verifier`) fait la comparaison côté serveur. Le navigateur ne voit jamais les vraies réponses ni les codes. Il reçoit seulement OUI ou NON, ce qui colle à la règle « le site ne dit pas quelle réponse est fausse ».
- Attention : par défaut, les fichiers Blob sont accessibles à toute personne qui a le lien. Demande à Claude Code de vérifier qu'ils sont en accès privé, ou de ne jamais renvoyer leur adresse au navigateur.

**Encore plus simple, si tout se passe sur un seul ordinateur ou une seule tablette au QG :** le stockage du navigateur (localStorage). Pas de serveur, pas de compte, gratuit. L'inconvénient : les données sont perdues si on vide le navigateur, et rien n'est partagé entre appareils.

Ma recommandation : **Vercel Blob + une route API**, avec les codes secrets hachés plutôt qu'écrits en clair.

## User

comment ça une route API

## Assistant

Une route API, c'est un petit morceau de code qui tourne **sur le serveur de Vercel**, pas dans le navigateur des enfants.

**Sans route API (dangereux) :**
1. Le navigateur télécharge la fiche de Captain Circuit, avec son vrai code secret.
2. Il compare lui-même avec ce que l'enfant a tapé.
3. N'importe qui qui ouvre les outils du navigateur (F12) peut lire tous les codes, adresses et desserts préférés.

**Avec une route API (sûr) :**
1. Le navigateur envoie seulement ce que l'enfant a tapé à `/api/verifier`.
2. Le code sur le serveur lit la fiche dans Vercel Blob et compare.
3. Il renvoie juste `{ "acces": "OUI" }` ou `{ "acces": "NON" }`.
4. Les vraies réponses ne quittent jamais le serveur.

C'est comme un vigile à la porte : on lui donne ses réponses, il vérifie dans son carnet, il dit oui ou non, mais on ne voit jamais son carnet.

Concrètement, c'est un fichier `api/verifier.js` dans le projet. Vercel le transforme automatiquement en adresse web. Tu peux demander à Claude Code : « crée une route API `/api/verifier` qui compare les réponses avec la fiche stockée dans Vercel Blob et renvoie seulement OUI ou NON ».

## User

ecris le dnas les guidelines, pour CLaude Code, et bien beaucoup d'autres outils

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

J'ai ajouté deux sections à la fin de la charte :

- **08 — Pour Claude Code** : comment le site fonctionne, du navigateur à la route API, puis Vercel Blob et la réponse OUI ou NON. Elle liste aussi les fichiers stockés, les routes API, les règles de sécurité et le format d'une fiche agent.
- **09 — Les outils du QG** : 18 outils. Les 6 marqués PRIORITÉ sont l'entrée, la sortie, la fiche d'inscription, le générateur de code, le registre et le badge. Les 12 en BONUS incluent par exemple « Qui est au QG ? », l'alarme, les messages secrets, les anniversaires et le menu du QG.

Tu peux donner la page à Claude Code et lui dire : « construis les outils PRIORITÉ en suivant cette charte ».

