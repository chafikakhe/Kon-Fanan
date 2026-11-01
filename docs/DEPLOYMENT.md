# Déploiement Supabase — 1 novembre 2026

Projet : `kon-fanan` (`wzjbamzlwchaqkcoascj`), région `eu-west-1`.

## Appliqué via CLI

- Supabase CLI `2.122.0`, projet lié depuis le workspace local.
- Migrations `0001_core.sql`, `0002_integrations.sql`, `0003_profile_stats.sql` appliquées et présentes dans l’historique distant.
- `supabase/seed.sql` appliqué : niveaux, matières et année scolaire uniquement. Aucun compte, mot de passe ou travail fictif créé sur le projet.
- Les 15 Edge Functions sont déployées et actives. Les paramètres `verify_jwt` correspondent à `config.toml`.
- Types TypeScript générés depuis la base distante dans `src/lib/database.generated.ts`.
- Secrets `APP_BASE_URL`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, `GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION`, `INTEGRATION_WORKER_SECRET` configurés.

Les secrets générés sont conservés dans `supabase/.env.local` avec des permissions `0600`, exclus de Git. Conserver ce fichier de façon sûre : la clé de chiffrement est nécessaire à la récupération future des connexions Google. Les identifiants Google Cloud n’ont pas été fournis et ne sont pas inventés.

## Vérifications distantes

- `open_classes` répond HTTP 200 ; liste vide attendue tant que l’administration n’a pas créé de classe.
- Lecture anonyme des profils refusée : HTTP 401 / `42501`.
- Schéma `private` non exposé : HTTP 406 / `PGRST106`.
- Appel du worker sans secret refusé : HTTP 403 / `ACCESS_DENIED`.
- Appel Google status sans session refusé : HTTP 401 / `AUTH_REQUIRED`.
- Les 15 fonctions sont `ACTIVE`, aucune fonction attendue absente, aucun écart de configuration JWT.
- Vérification locale après adaptation du paquet : TypeScript, build et 8 tests Edge réussis. Les 68 contrôles SQL/RLS restent réussis.

## Adaptation du paquet image

Le déploiement API refusait le binaire ImageMagick brut (15,4 MB) et sa version gzip (5,3 MB), avec HTTP 413. Le même binaire est maintenant distribué dans `magick.wasm.br` (environ 4,1 MB), décompressé avec `node:zlib` au premier usage et conservé dans l’initialisation du worker.

Le fichier décompressé reste identique à la source testée (SHA-256 `54629cbcf06dd10db38b4d87fa6ab241b248c09c94f2d9689506e5f994ac5f0c`). Les notices ImageMagick et de ses dépendances restent dans `MAGICK-NOTICE`. Les réservations de fichiers importent un module léger séparé et ne chargent pas le moteur de conversion.

## Commandes utilisées

```sh
npx supabase link --project-ref wzjbamzlwchaqkcoascj --yes
npx supabase db push --linked --include-seed --dry-run
npx supabase db push --linked --include-seed --yes
npx supabase secrets set --env-file supabase/.env.local --project-ref wzjbamzlwchaqkcoascj
npx supabase functions deploy --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 3
# Reprises ciblées après adaptation du paquet :
npx supabase functions deploy files-prepare --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 1
npx supabase functions deploy files-finalize --project-ref wzjbamzlwchaqkcoascj --use-api --jobs 1
```

## Configuration restant à effectuer

Le frontend n’a pas été publié sur un hébergeur par cette opération. L’origine actuellement configurée est celle du fichier `.env` : `http://localhost:5173`.

- Créer/confirmer le premier compte et attribuer son rôle admin selon `SETUP.md`.
- Vérifier les URLs Auth autorisées et le SMTP de recette.
- Configurer `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`, l’écran de consentement et le callback dans Google Cloud.
- Planifier le worker avec son secret et tester un vrai cycle Calendar/Meet.
- Lors d’un hébergement du frontend, remplacer l’origine locale dans `VITE_APP_URL`, `APP_BASE_URL` et les URLs Auth.

Ce déploiement confirme la présence de la base et des fonctions. Il ne vaut pas une recette d’email, un upload authentifié réel ou un essai Google Meet de bout en bout.
