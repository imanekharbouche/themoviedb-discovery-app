# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Fiche détaillée pour chaque film.
- Pages « À propos » et « Page introuvable ».
- Thème clair ou sombre, conservé dans le navigateur.
- API Express intermédiaire pour appeler TMDB sans exposer le jeton dans le navigateur.

Les paramètres par défaut sont la langue `fr-FR`, la région `FR` et la première page.

## Prérequis

- Node.js 24 (version indiquée dans `.nvmrc`).
- npm.
- Un jeton d'accès à l'API TMDB. Vous pouvez en obtenir un depuis les paramètres de votre compte TMDB, dans la section API.

## Installation et démarrage

1. Installez les dépendances :

   ```sh
   npm install
   ```

2. Créez un fichier `.env` à la racine du projet et ajoutez votre jeton d'accès :

   ```dotenv
   TMDB_ACCESS_TOKEN=votre_jeton_d_acces_tmdb
   ```

   Gardez ce jeton privé et ne le publiez pas dans le dépôt.

3. Démarrez le serveur et l'application :

   ```sh
   npm run dev
   ```

4. Ouvrez [http://localhost:5173](http://localhost:5173).

Le serveur Express écoute sur le port `3000`. Vite sert l'interface sur le port `5173` et transmet les requêtes `/api` au serveur Express.

## Création de la base de données

Initialisez le schéma SQLite avec :

```sh
npx tsx src/back-end/backend-cli.ts create-database
```

Le chemin par défaut est `data/movies.sqlite`. Pour choisir un autre fichier :

```sh
npx tsx src/back-end/backend-cli.ts create-database --path ./data/ma-base.sqlite
```

Cette commande conserve les données d’une base existante et active les clés étrangères.

Pour importer ou actualiser les genres depuis le CSV fourni :

```sh
node src/back-end/backend-cli.ts add-genres ./data/genres.csv
node src/back-end/backend-cli.ts --path ./data/ma-base.sqlite add-genres ./data/genres.csv
```

Le CSV comporte exactement les colonnes `id` et `name` (ordre et casse indifférents).
Les identifiants sont des entiers positifs et les noms non vides. Le fichier est
entièrement validé avant l’ouverture de SQLite. Un identifiant répété actualise
la même ligne : le dernier nom du lot est conservé, sans doublon. Le nombre
annoncé correspond aux lignes traitées, y compris les identifiants répétés.

Pour supprimer seulement les genres sans association à un film :

```sh
node src/back-end/backend-cli.ts clean-genres
node src/back-end/backend-cli.ts clean-genres --path ./data/ma-base.sqlite
```

`--path` est accepté avant ou après la commande. Sans cette option, le chemin
est `data/movies.sqlite`. Chaque commande affiche le nombre de genres traités
et le chemin de la base, puis ferme la connexion, même en cas d’échec SQL.
L’import et le nettoyage sont transactionnels : une erreur annule le lot.

Pour importer ou actualiser les pays depuis le CSV fourni :

```sh
node src/back-end/backend-cli.ts add-countries ./data/countries.csv
node src/back-end/backend-cli.ts --path ./data/ma-base.sqlite add-countries ./data/countries.csv
```

Le CSV comporte exactement les colonnes `code` et `name` (ordre et casse indifférents).
Les codes pays contiennent deux lettres majuscules (`FR`, `GB`, `US`) et les noms sont
non vides. Le fichier est validé avant l’ouverture de SQLite et un code répété met à
jour la ligne existante sans créer de doublon.

Pour supprimer uniquement les pays sans association à un film dans `production_countries` :

```sh
node src/back-end/backend-cli.ts clean-countries
node src/back-end/backend-cli.ts clean-countries --path ./data/ma-base.sqlite
```

## API locale

| Méthode | Route                  | Description                                                       |
| ------- | ---------------------- | ----------------------------------------------------------------- |
| `GET`   | `/api/health`          | Vérifie que le serveur répond.                                    |
| `GET`   | `/api/movies/popular`  | Renvoie les films populaires.                                     |
| `GET`   | `/api/movies/:id`      | Renvoie les détails du film correspondant à son identifiant TMDB. |
| `GET`   | `/api/discover/movies` | Renvoie les films TMDB d'une année donnée.                        |

Les routes des films acceptent les paramètres `language`, `page` et `region`. Exemple :

```text
/api/movies/popular?language=fr-FR&page=1&region=FR
```

La route Discover exige `year` au format `YYYY` et accepte aussi `language`, `page`
et `region` :

```text
/api/discover/movies?year=2020&language=en-US&page=2&region=US
```

Une année absente ou invalide renvoie HTTP 400. Une erreur de l'API TMDB, du réseau
ou du JSON renvoie HTTP 500 avec le message `Failed to discover movies`.

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
