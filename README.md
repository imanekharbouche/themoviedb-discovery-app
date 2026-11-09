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

Après l'installation des dépendances, créez et initialisez la base SQLite avec le CLI du backend :

```sh
npx tsx src/back-end/backend-cli.ts create-database
```

Par défaut, le fichier `data/movies.sqlite` est créé avec le schéma nécessaire. Pour choisir un autre emplacement, utilisez l'option `--path` :

```sh
npx tsx src/back-end/backend-cli.ts create-database --path ./data/ma-base.sqlite
```

La commande initialise le schéma sans supprimer les données d'une base existante.

Pour importer ou actualiser les genres depuis le fichier CSV fourni :

```sh
npx tsx src/back-end/backend-cli.ts add-genres ./data/genres.csv
npx tsx src/back-end/backend-cli.ts add-genres ./data/genres.csv --path ./data/ma-base.sqlite
```

Pour supprimer les genres qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-genres
```

Les commandes affichent le nombre de genres traités et le chemin de la base utilisée.

Pour importer ou actualiser les pays depuis le fichier CSV fourni :

```sh
npx tsx src/back-end/backend-cli.ts add-countries ./data/countries.csv
npx tsx src/back-end/backend-cli.ts add-countries ./data/countries.csv --path ./data/ma-base.sqlite
```

Pour supprimer les pays qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-countries
npx tsx src/back-end/backend-cli.ts clean-countries --path ./data/ma-base.sqlite
```

Le [MCD et le schéma relationnel](docs/database-model.md) décrivent les
entités, les cardinalités et les contraintes utilisées pour le tableau de bord.

## Storybook

Storybook permet de visualiser les composants et les futures variantes du
tableau de bord sans démarrer l'API :

```sh
npm run storybook
```

Le serveur est disponible sur [http://localhost:6006](http://localhost:6006).
Pour générer une version statique, utilisez `npm run build-storybook`.

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
