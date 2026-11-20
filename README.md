# Kon-fanan

Application web React 19, TypeScript strict, Vite et React Router, avec backend Supabase Auth/PostgreSQL/Storage/Edge Functions. Interface en français, landing éditoriale crème et trois espaces photographiques en verre sombre.

## Lancer le projet

Prérequis : Node.js ≥ 22.13 et npm.

```sh
npm ci
npm run dev
```

Ouvrir l’URL affichée par Vite (par défaut `http://localhost:5173`). Si ce port est occupé, Vite en choisit un autre. Pour un port fixe :

```sh
npm run dev -- --host 127.0.0.1 --port 5279 --strictPort
```

Sans variables Supabase, le serveur de développement propose une **démonstration explicite** depuis `/connexion`. Les boutons Étudiant, Professeur et Admin ouvrent trois comptes fictifs. Les actions locales sont conservées dans la session du navigateur ; les fichiers déposés restent dans IndexedDB de ce navigateur. Aucun appel Google, email ou stockage distant n’est simulé comme réussi. Les cours d’exemple n’embarquent aucune vidéo réelle.

La démonstration est désactivée par défaut dans un build de production. Pour construire une prévisualisation de démonstration isolée : `VITE_ENABLE_DEMO=true npm run build`. Avec une URL et une clé Supabase, le mode réel prend toujours la priorité et ne se replie jamais sur la démo en cas d’erreur.

## Connexion au backend

```sh
cp .env.example .env.local
```

Renseigner `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `VITE_APP_URL`, puis redémarrer Vite. Seules ces valeurs publiques vont dans le frontend. Les comptes et les rôles proviennent de Supabase, pas d’un choix sur le formulaire de connexion.

Pour un Supabase local (Docker et CLI Supabase requis) :

```sh
npx supabase start
npx supabase db reset
npx supabase functions serve --env-file supabase/.env.local
```

Les migrations versionnées sont dans `supabase/migrations`. `seed.sql` contient uniquement les six niveaux, quatre matières et l’année scolaire. Il ne crée aucun mot de passe ou compte privilégié. Pour un projet hébergé, suivre [SETUP.md](docs/SETUP.md). Le déploiement réalisé sur le projet fourni est documenté dans [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Ce qui est implémenté

- Landing, connexion/inscription/confirmation, récupération, admission, suspension, notifications et profil.
- Découverte publique niveau → matière → cours → exercice, packs de 1/2/3 matières à 100/180/270 DH au total, reprise après connexion, demandes et validation administrative du règlement. Aucun paiement en ligne simulé ; détails dans [PACKS.md](docs/PACKS.md).
- Vidéo intégrée directement et livre PDF sous la vidéo : double page, navigation, zoom, affichage agrandi et lecture mobile. Les PDF attachés aux cours publiés sont consultables sans compte ; les documents d’exercice restent protégés. Voir [COURSE_READER.md](docs/COURSE_READER.md).
- Admin : admissions avec classe et matières, capacité, classes, étudiants et droits, professeurs et affectations, référentiels, modération/transfert de contenus, état des intégrations et journal.
- Comptes professeurs créés directement par l’administration avec email et mot de passe initial, copie des identifiants sans email automatique et changement personnel depuis Mon profil → Sécurité. Migration et recette : [TEACHER_ACCOUNTS.md](docs/TEACHER_ACCOUNTS.md).
- Professeur : groupes, cours/vidéos/exercices, choix d’un PDF dès la création d’exercice avec reprise d’envoi, copies et corrections brouillon/publiées, nouvelle version, challenges/concours et résultats, annonces, séances et connexion Google. Voir [EXERCISE_PDF.md](docs/EXERCISE_PDF.md).
- Étudiant : matières autorisées, lecture et progression déclarative, dépôt photo/galerie/PDF avec aperçu, brouillon et reprise d’erreur, historique, corrections, défis et séances.
- RLS sur les tables exposées, commandes SQL transactionnelles, schéma privé non exposé, buckets privés, validation serveur des fichiers, OAuth serveur chiffré et jobs Meet durables.

Les règles et limites de la livraison sont détaillées dans [VERIFICATION.md](docs/VERIFICATION.md). Une démonstration locale ne prouve pas une intégration réelle.

## Vérifier

```sh
npm run typecheck
npm run build
npm test
npm run test:sql
npm run check:edge
npm run test:edge
npm run test:auth:browser
npx playwright install chromium
KF_TEST_PORT=5281 npm run test:e2e
```

Les tests SQL exécutent les migrations dans PostgreSQL WASM/PGlite avec des identités `anon`, `student`, `teacher`, `admin` et `service_role`. Les services Auth/Storage sont représentés par un schéma de test ; les appels réseau aux fournisseurs ne sont pas couverts par ce test.

`test:auth:browser` couvre le parcours professeur avec des réponses HTTP isolées. La recette sur Auth réel est séparée : `npm run test:auth:integration`, avec un Supabase local et les variables décrites dans [TEACHER_ACCOUNTS.md](docs/TEACHER_ACCOUNTS.md).

Playwright démarre une démonstration isolée sur un port distinct du serveur réel, sans modifier `.env`. Sa configuration neutralise les variables Supabase pour ce processus et refuse de réutiliser un serveur existant ; choisir un port libre avec `KF_TEST_PORT`.

Les tests navigateur vérifient les trois rôles à 360, 390, 768, 1024 et 1440 px, les admissions, le dépôt/correction, l’isolation des routes et des contrôles axe. Les scénarios de dépôt fixent l’horloge du navigateur avant ou après l’échéance du jeu de démonstration, pour tester explicitement la réussite et le refus sans dépendre de la date d’exécution. Sans `KF_TEST_PORT`, le serveur de test utilise `127.0.0.1:5279`. Les captures de contrôle se trouvent dans `screenshots/`.

## Déployer

```sh
npm run build
npm run preview
```

Publier `dist/` sur un hébergeur SPA. Les fichiers `_redirects` et `_headers` sont fournis pour les hébergeurs compatibles ; configurer l’équivalent ailleurs. Adapter la CSP si un domaine Supabase personnalisé est utilisé. Le backend, les secrets, les redirections Auth, les emails, le consentement Google et le worker se configurent séparément : [SETUP.md](docs/SETUP.md).

Sur Vercel, `vercel.json` réécrit les URL vers `index.html` pour permettre l’ouverture directe et le rechargement des routes React (`/connexion`, `/admin/professeurs`, `/prof/groupes`, etc.). Le fichier `_redirects` seul n’est pas une configuration de routage Vercel. Les fichiers statiques existants restent servis normalement. Voir la [configuration SPA Vite de Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

## Organisation

```text
src/app/          session, données, contrôles de route et shell des rôles
src/components/  composants et états partagés
src/pages/       domaines et compositions des écrans
src/lib/         types, validation, dates, Supabase et démonstration isolée
supabase/        migrations, seed et fonctions Edge
 tests/          tests métier, SQL/RLS, Edge et navigateur
 docs/           configuration, sécurité, pages et rapport de vérification
```

Les documents originaux du cahier des charges et des prompts restent à la racine. [PAGES.md](docs/PAGES.md) répertorie les routes. [DESIGN.md](docs/DESIGN.md) décrit les choix visuels et les sources photographiques.

Le moteur de normalisation d’images utilise ImageMagick, attribué à ImageMagick Studio LLC, via `@imagemagick/magick-wasm`. Le binaire distribué et les notices de ses dépendances sont dans `supabase/functions/_shared/magick.wasm.br` et `MAGICK-NOTICE`. Les contrats des RPC et fonctions sont répertoriés dans [API.md](docs/API.md).
