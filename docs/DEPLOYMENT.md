# Déploiement Supabase — 1 novembre 2026

Projet : `kon-fanan` (`wzjbamzlwchaqkcoascj`), région `eu-west-1`.

## Appliqué via CLI

- Supabase CLI `2.122.0`, projet lié depuis le workspace local.
- Migrations `0001_core.sql`, `0002_integrations.sql`, `0003_profile_stats.sql`, `0004_bootstrap_admin.sql`, `0005_discovery_packs.sql`, `0006_public_course_documents.sql` appliquées et présentes dans l’historique distant.
- Premier administrateur demandé par le propriétaire activé par `0004`, sur son UUID Auth vérifié. Le profil est conservé, le mot de passe reste inchangé et la transition est auditée. La migration est idempotente et ne modifie aucun compte si cette identité est absente d’un autre environnement.
- `supabase/seed.sql` appliqué : niveaux, matières et année scolaire uniquement. Aucun compte, mot de passe ou travail fictif créé sur le projet.
- Les 16 Edge Functions sont déployées et actives. Les paramètres `verify_jwt` correspondent à `config.toml`.
- Types TypeScript générés depuis la base distante dans `src/lib/database.generated.ts`.
- Secrets `APP_BASE_URL`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, `GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION`, `INTEGRATION_WORKER_SECRET` configurés.

Les secrets générés sont conservés dans `supabase/.env.local` avec des permissions `0600`, exclus de Git. Conserver ce fichier de façon sûre : la clé de chiffrement est nécessaire à la récupération future des connexions Google. Les identifiants Google Cloud n’ont pas été fournis et ne sont pas inventés.

## Vérifications distantes

- `open_classes` répond HTTP 200 ; liste vide attendue tant que l’administration n’a pas créé de classe.
- Lecture anonyme des profils refusée : HTTP 401 / `42501`.
- Schéma `private` non exposé : HTTP 406 / `PGRST106`.
- Appel du worker sans secret refusé : HTTP 403 / `ACCESS_DENIED`.
- Appel Google status sans session refusé : HTTP 401 / `AUTH_REQUIRED`.
- Les 16 fonctions sont `ACTIVE`, aucune fonction attendue absente, aucun écart de configuration JWT.
- Vérification locale après adaptation du paquet : TypeScript, build et 8 tests Edge réussis. Après ajout des packs : build, 5 tests unitaires, 116 contrôles SQL/RLS et 11 scénarios navigateur distincts réussis (suite de 10 puis contrôles ciblés).
- Contrôle distant après `0004` : compte ciblé `admin / active`, date d’activation présente et un événement d’audit de bootstrap.
- Contrôle distant après `0005` : catalogue anonyme HTTP 200, six niveaux et trois packs à 100/180/270 DH au total, cours publié réel visible avec un titre d’exercice ; aucune consigne ni URL live dans la projection. Lecture anonyme des tables `exercises` et `pack_orders` refusée HTTP 401. Aucun achat réel n’a été créé ou activé pendant ces vérifications.
- Après `0006` : fonction `course-document-url` déployée, `verify_jwt=false` avec contrôles serveur sur la paire cours/fichier. Métadonnées et vrai PDF LOGIQUE répondent HTTP 200 depuis une origine LAN ; contenu `%PDF-` de 511 259 octets, signature 300 secondes, fichier arbitraire refusé HTTP 404. Le navigateur affiche les 17 pages du vrai document avec vidéo intégrée. Validation actuelle : build, 5 tests unitaires, 125 contrôles SQL/RLS, 9 tests Edge et 12 scénarios navigateur réussis. Détails : [COURSE_READER.md](COURSE_READER.md).
- Correction des uploads LAN : `APP_ALLOWED_ORIGINS` configuré avec `http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.7:5173` et les 16 fonctions redéployées. Les quatre endpoints de fichiers autorisent maintenant le preflight de cette origine et renvoient `401 AUTH_REQUIRED` sans session ; une origine inconnue reste refusée. Les vérifications ont porté sur CORS et l’authentification, sans création de fichier réel. La chaîne PDF exercice est vérifiée dans les tests SQL/Edge et la démo navigateur : voir [EXERCISE_PDF.md](EXERCISE_PDF.md).

## Adaptation du paquet image

Le déploiement API refusait le binaire ImageMagick brut (15,4 MB) et sa version gzip (5,3 MB), avec HTTP 413. Le même binaire est maintenant distribué dans `magick.wasm.br` (environ 4,1 MB), décompressé avec `node:zlib` au premier usage et conservé dans l’initialisation du worker.

Le fichier décompressé reste identique à la source testée (SHA-256 `54629cbcf06dd10db38b4d87fa6ab241b248c09c94f2d9689506e5f994ac5f0c`). Les notices ImageMagick et de ses dépendances restent dans `MAGICK-NOTICE`. Les réservations de fichiers importent un module léger séparé et ne chargent pas le moteur de conversion.

## Commandes utilisées

```sh
npx supabase link --project-ref wzjbamzlwchaqkcoascj --yes
npx supabase db push --linked --include-seed --dry-run
npx supabase db push --linked --include-seed --yes
# Activation ciblée du premier administrateur :
npx supabase db push --linked --dry-run
npx supabase db push --linked --yes
npx supabase secrets set --env-file supabase/.env.local --project-ref wzjbamzlwchaqkcoascj
npx supabase functions deploy --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 3
# Reprises ciblées après adaptation du paquet :
npx supabase functions deploy files-prepare --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 1
npx supabase functions deploy files-finalize --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 1
```

## Configuration restant à effectuer

Le frontend n’a pas été publié sur un hébergeur par cette opération. L’origine actuellement configurée est celle du fichier `.env` : `http://localhost:5173`.

- Vérifier les URLs Auth autorisées et le SMTP de recette.
- Autoriser le retour Auth vers les packs avec les paramètres de `/auth/callback`. Le règlement utilise une validation administrative explicite ; pour un paiement en ligne, un prestataire et ses webhooks fiables restent à connecter. Voir [PACKS.md](PACKS.md).
- Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`, l’écran de consentement et le callback dans Google Cloud.
- Planifier le worker avec son secret et tester un vrai cycle Calendar/Meet.
- Lors d’un hébergement du frontend, remplacer l’origine locale dans `VITE_APP_URL`, `APP_BASE_URL` et les URLs Auth.

Ce déploiement confirme la présence de la base et des fonctions. Il ne vaut pas une recette d’email, un upload authentifié réel ou un essai Google Meet de bout en bout.
