# PDF d’exercice et reprise de l’envoi

Dans `/prof/cours/:courseId/exercices/nouveau`, choisir un fichier dans **PDF de l’exercice** avant de cliquer sur **Enregistrer l’exercice**. Le titre reste obligatoire. La consigne peut être saisie ou portée par le PDF. Les fichiers doivent être des PDF non vides de 20 Mo maximum ; le serveur vérifie aussi leur format réel et normalise le document.

Un nouveau document crée d’abord un exercice brouillon, puis utilise la chaîne existante `files-prepare` → Storage privé → `files-finalize`. La publication demandée n’intervient qu’après la validation du fichier. Si l’envoi échoue, le formulaire conserve le fichier et l’UUID du brouillon pour réessayer sans créer un autre exercice. Une consigne automatique renvoyant au PDF est enregistrée après validation si le texte était vide.

Les documents existants restent gérés depuis le même écran d’édition. Les fichiers d’exercice sont attachés à `exercise_resources`, ne sont pas des PDF de cours publics et restent soumis aux droits de la matière/du pack. Après une première remise, l’ajout et la modification de l’énoncé restent verrouillés côté serveur. Aucune migration de base n’est nécessaire pour cette fonctionnalité, car ces tables et contrôles existent déjà.

## Origine LAN et CORS

La panne observée sur l’adresse LAN venait de la politique d’origine : la réponse OPTIONS était HTTP 204, mais sans `Access-Control-Allow-Origin` pour `http://192.168.1.7:5173`. Le navigateur bloquait donc l’appel Edge avant le téléversement. Le même endpoint autorisait `http://localhost:5173`.

Le helper utilise maintenant l’URL canonique `APP_BASE_URL` plus la liste explicite `APP_ALLOWED_ORIGINS`. L’instance hébergée autorise localhost, 127.0.0.1 et l’adresse LAN demandée sur le port 5173. Les 16 fonctions ont été redéployées avec ce helper. Les endpoints privés conservent l’exigence de session et leurs vérifications de rôle et de cible.

Les contrôles distants sur `files-prepare`, `files-finalize`, `files-read-url` et `files-delete` confirment le CORS de l’origine LAN et une réponse `401 AUTH_REQUIRED` du handler sans session. Une origine inconnue reste sans autorisation CORS. Aucun exercice ou fichier fictif n’a été ajouté au projet hébergé pour ces tests.

Les essais navigateur utilisent la démo isolée ; les permissions et le rattachement des PDF sont testés dans PostgreSQL/PGlite, et la normalisation PDF dans les tests Edge. Une création authentifiée réelle avec le PDF choisi par le professeur reste à effectuer depuis son navigateur.
