# Configuration Supabase et Google

## 1. Base, stockage et identités

Créer un projet Supabase dédié à la recette. Installer la CLI, lier le projet, puis appliquer les migrations :

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Ne pas exposer `private` dans les réglages Data API ou Realtime. Les migrations créent les buckets privés `course-materials`, `student-submissions` et `announcement-materials` et leurs politiques. Les valeurs des limites serveur restent plafonnées à 5 fichiers / 30 Mo par version étudiante, 10 Mo par image et 20 Mo par PDF.

Activer la confirmation d’email, configurer un SMTP de recette, une longueur minimale de mot de passe de 12 caractères et les URLs de retour exactes :

- `https://APP_DOMAIN/auth/callback`
- `https://APP_DOMAIN/auth/callback?retour=…` pour reprendre le choix de pack après confirmation d’email ; autoriser les paramètres de cette route sur le domaine réel.
- `https://APP_DOMAIN/nouveau-mot-de-passe`

Dans Auth, définir `Site URL` sur le domaine de l’application. Vérifier l’inscription, les liens de récupération expirés et le comportement des invitations avec un vrai email de recette.

Si vous changez le port de développement, adaptez aussi `VITE_APP_URL`, `APP_BASE_URL` et les URLs autorisées dans Auth. Les origines doivent correspondre exactement (protocole, nom d’hôte et port).

## 2. Premier administrateur

Créer un compte par Supabase Auth avec une adresse contrôlée et confirmer son email. Récupérer son UUID dans Auth. Exécuter depuis le SQL Editor administrateur, en remplaçant uniquement l’UUID ci-dessous :

```sql
update public.account_access
set role='admin', status='active', activated_at=now()
where user_id='UUID_DU_COMPTE_CONFIRME';
```

Aucun formulaire public ne permet cette opération. Utiliser ensuite l’application pour créer années/classes/matières et inviter les professeurs. Les métadonnées envoyées à l’inscription ne décident jamais du rôle. Protéger l’accès au dashboard Supabase et prévoir la récupération du compte administrateur.

Les niveaux/matières/année de `seed.sql` peuvent être créés depuis les référentiels ou appliqués volontairement à la recette. Aucun effectif ou résultat fictif n’est déployé avec les migrations.

## 3. Secrets Edge

Copier `supabase/.env.example` dans `supabase/.env.local` et renseigner les valeurs. Générer deux secrets indépendants :

```sh
openssl rand -base64 32
openssl rand -hex 32
```

Le premier sert à `GOOGLE_TOKEN_ENCRYPTION_KEY`, le second à `INTEGRATION_WORKER_SECRET`. Conserver la clé de chiffrement avec les sauvegardes de secrets ; les tokens ne sont pas récupérables si elle est perdue. La version actuelle accepte une seule version active de clé : la rotation requiert une réécriture contrôlée des connexions, avant changement de version.

```sh
npx supabase secrets set --env-file supabase/.env.local
npx supabase functions deploy
```

Le runtime fournit `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Ces valeurs ne doivent pas figurer dans un fichier `VITE_`. Les handlers utilisateur vérifient la session avec `auth.getUser` et recontrôlent rôle/statut ; les callbacks OAuth et le worker ont une authentification propre. `config.toml` conserve `verify_jwt=true` pour les fonctions utilisateur.

## 4. Google Cloud

Activer Calendar API, préparer l’écran de consentement, déclarer les comptes de test et créer un client OAuth **application web**. Déclarer exactement :

```text
https://PROJECT_REF.supabase.co/functions/v1/google-oauth-callback
```

Configurer `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et cette URL dans les secrets. Le frontend ne reçoit ni refresh token ni access token Google. Le flux demande `openid email` et `https://www.googleapis.com/auth/calendar.events.owned` avec accès hors ligne.

Le professeur se connecte depuis `/prof/integrations/google`. Le flux utilise ticket court, state à usage unique, cookie HttpOnly/SameSite=Lax, nonce OIDC et chiffrement AES-GCM. Les changements de compte sont bloqués si des événements/jobs futurs dépendent de l’ancienne identité.

En production, vérifier le consentement, les scopes, les utilisateurs autorisés, les quotas et les limites propres au compte Google. Références : [OAuth serveur Google](https://developers.google.com/identity/protocols/oauth2/web-server), [création d’événements et conférences](https://developers.google.com/workspace/calendar/api/guides/create-events), [authentification Edge Supabase](https://supabase.com/docs/guides/functions/auth).

## 5. Planifier le worker

La création d’un Meet est un travail durable en base. Déployer `integration-worker` ne suffit pas : configurer un planificateur externe ou Supabase Cron qui l’appelle environ chaque minute, en `POST`, avec l’en-tête `x-worker-secret: <INTEGRATION_WORKER_SECRET>`. Le secret doit rester dans le planificateur/Vault, jamais dans le navigateur ou une URL publique.

Le worker traite au plus trois jobs par appel, avec verrou, identifiant d’événement stable, réconciliation, reprise bornée et compensation lors d’une annulation. Il nettoie également les fichiers abandonnés. Surveiller les jobs `error` depuis l’interface admin. Une conférence `pending` n’est jamais annoncée comme prête.

## 6. Recette réelle avant ouverture

Le parcours public et les packs nécessitent `0005_discovery_packs.sql`. Les modalités de règlement restent hors application avec validation administrative explicite ; aucun prestataire de paiement en ligne n’est connecté. Configuration et procédure : [PACKS.md](PACKS.md).

Créer deux classes et deux professeurs dans une même matière. Tester une admission concurrente sur la dernière place avec plusieurs connexions PostgreSQL, puis une révocation en session active. Sur un téléphone réel : galerie, caméra, PDF, coupure réseau, reprise, correction et nouvelle version.

Avec un compte Google de recette : OAuth, refus de consentement, création Meet, modification, annulation, révocation et reconnexion. Contrôler l’événement Google, l’absence de doublon, les jobs et l’ouverture dans un nouvel onglet.

Ces essais réseau réels ne peuvent pas être certifiés sans configuration du projet et comptes de test. Finaliser aussi les informations de l’exploitant, le contact administratif, les durées de conservation, la sauvegarde des objets Storage et le monitoring.
