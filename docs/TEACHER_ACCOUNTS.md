# Comptes professeurs

Sur `/admin/professeurs`, « Ajouter un professeur » demande le nom, le prénom, l’email et le mot de passe initial (12 à 128 caractères, sous réserve de la politique Supabase). Le générateur utilise Web Crypto et produit 20 caractères avec majuscules, minuscules, chiffres et symboles. Le mot de passe peut être affiché ou masqué.

Après création, le compte possède immédiatement le rôle `teacher` et le statut `active`. L’email est confirmé par Auth Admin sans envoyer d’invitation ou de lien d’activation. L’administrateur conserve sa session et peut copier les identifiants depuis la confirmation. Ils disparaissent de l’interface à la fermeture ; aucun mot de passe n’est conservé dans les profils, métadonnées, logs ou stockages navigateur. La copie dans le presse-papiers est uniquement déclenchée par l’administrateur. Si le navigateur refuse cette API, la copie manuelle reste possible.

Les affectations de matières et groupes restent gérées depuis le profil professeur, comme auparavant. Les comptes, contenus et affectations existants ne sont pas modifiés par la migration.

## Création atomique

`teacher-create` vérifie le JWT avec Supabase Auth, puis le rôle `admin` et le statut `active` en base. La clé `SUPABASE_SERVICE_ROLE_KEY` reste dans l’environnement Edge. Le frontend ne fait aucun `signUp` ou `signIn` pour créer le professeur.

La RPC réservée au service `authorize_teacher_creation` vérifie également la présence de la migration avant toute création Auth. Auth Admin `createUser` insère d’abord l’identité, puis applique les métadonnées administratives dans la même transaction. Le trigger `private.provision_teacher` traite cette mise à jour et crée l’accès professeur, complète le profil et écrit un audit sans mot de passe. Un échec annule toute la transaction, y compris l’identité Auth. Ce comportement suit la [transaction de création dans Supabase Auth](https://github.com/supabase/auth/blob/master/internal/api/admin.go).

Le marqueur `app_metadata.kon_fanan_teacher.created_by` est réservé à l’API Auth privilégiée. Les métadonnées utilisateur n’accordent aucun rôle. Le créateur est revérifié dans le trigger, avec verrou et limite de 30 créations par heure et par administrateur. Un email existant est refusé sans mise à jour ni suppression du compte correspondant. Les futures mises à jour des métadonnées Auth ne réinitialisent pas le profil ou le statut du professeur.

## Mot de passe personnel

Dans `/profil` → « Sécurité », le professeur saisit son mot de passe actuel, le nouveau et sa confirmation. Après validation locale, une connexion Supabase temporaire vérifie le mot de passe actuel avec un client distinct, sans persistance ni renouvellement automatique. Son identité doit correspondre à celle de la session courante. Seule cette session temporaire est ensuite révoquée (`scope: local`).

La modification utilise la session d’origine et `updateUser({ password, current_password })`. La connexion temporaire est nécessaire car la validation de `current_password` dépend de la configuration du serveur Auth ; voir le [code Supabase Auth](https://github.com/supabase/auth/blob/master/internal/api/user.go). Les champs sont vidés après la tentative. Le nouveau mot de passe est géré exclusivement par Auth et n’est pas accessible dans les données administratives.

## Déploiement

Appliquer la migration additive `supabase/migrations/0007_teacher_accounts.sql` avant de déployer les fonctions et le frontend :

```sh
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase functions deploy teacher-create --use-api
npx supabase functions deploy teacher-invite --use-api
npm run build
```

Redéployer aussi `teacher-invite` retire l’ancien endpoint d’envoi d’invitations (HTTP 410). L’historique des invitations et les comptes existants sont conservés. Aucun nouveau secret n’est nécessaire : URL Supabase, clé publique, clés Edge habituelles et origines autorisées existantes. Conserver la confirmation des emails pour les inscriptions étudiantes. La copie automatique et Web Crypto nécessitent un contexte sécurisé (HTTPS ou localhost).

Le domaine publié doit figurer dans `APP_ALLOWED_ORIGINS` (origines exactes séparées par des virgules). Pour ce projet, `https://kon-fanan.vercel.app` y est autorisé. Après un changement de domaine, vérifier un preflight `OPTIONS` avec son en-tête `Origin` : le statut 204 seul ne suffit pas, `Access-Control-Allow-Origin` doit aussi correspondre au domaine.

Les types de profils et de la nouvelle RPC ont été adaptés localement dans `database.generated.ts` ; ils pourront être régénérés depuis le schéma une fois la migration déployée.

## Vérifications

```sh
npm run typecheck
npm run build
npm test
npm run test:sql
npm run check:edge
npm run test:edge
npm run test:auth:browser
```

Les tests SQL exécutent la séquence Auth réelle « insertion puis métadonnées administratives » dans PostgreSQL/PGlite et injectent un échec de profil pour vérifier le rollback complet. Ils couvrent les rôles, les métadonnées falsifiées, les limites et la conservation des données existantes. Les tests Edge utilisent le vrai SDK Supabase avec des réponses HTTP contrôlées pour vérifier les autorisations, les doublons, les erreurs fournisseur et l’absence de secrets dans la réponse.

Le test navigateur utilise une API HTTP isolée : génération/affichage, création, liste, copie, fermeture, session admin conservée, doublon, connexion professeur, confirmation incohérente, mot de passe actuel erroné, modification, absence de mots de passe dans le stockage, refus de l’ancien mot de passe et connexion avec le nouveau. Il valide le parcours et le contrat HTTP ; il ne certifie pas un fournisseur Auth réel.

Pour la recette avec Supabase Auth réel, démarrer une instance **locale jetable** (Docker et CLI Supabase), appliquer les migrations et servir les fonctions :

```sh
npx supabase start
npx supabase db reset
npx supabase functions serve --env-file supabase/.env.local
```

Renseigner dans l’environnement de test `KF_AUTH_TEST_ANON_KEY` et `KF_AUTH_TEST_SERVICE_ROLE_KEY` avec les clés de cette instance, puis lancer :

```sh
npm run test:auth:integration
```

L’URL par défaut est `http://127.0.0.1:54321` (`KF_AUTH_TEST_URL` permet un autre port local). Le script refuse une URL distante, crée uniquement ses identités de recette et les nettoie. Il teste réellement Auth Admin, l’email confirmé, les rôles, le doublon, le refus des non-administrateurs, la vérification du mot de passe actuel, le changement, le refus de l’ancien et la connexion avec le nouveau. Aucun identifiant secret n’est imprimé.

Cette recette Auth réelle n’a pas pu démarrer pendant l’implémentation : aucune instance Supabase locale ni ses clés de test n’étaient disponibles.

Le 20 novembre 2026, la migration `0007` a été appliquée par CLI au projet lié `wzjbamzlwchaqkcoascj`, puis `teacher-create` et `teacher-invite` ont été déployées. Les deux fonctions sont `ACTIVE` avec vérification JWT. Les colonnes de noms, le trigger et les droits de la RPC serveur ont été vérifiés en base ; les deux endpoints refusent les appels sans session avec HTTP 401. Aucun compte de recette distant n’a été créé et le parcours authentifié complet reste à valider avec un compte de recette. Voir [DEPLOYMENT.md](DEPLOYMENT.md).
