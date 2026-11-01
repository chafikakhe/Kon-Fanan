# Autorisations et données privées

## Source des droits

`auth.uid()` identifie l’acteur. `account_access` porte rôle/statut et n’est pas modifiable par le client. L’inscription publique crée toujours `student/pending`, même si des métadonnées demandent un autre rôle. La suspension et la révocation sont vérifiées avec les relations actuelles, indépendamment d’un JWT encore valide.

Un étudiant doit avoir un compte actif et soit une inscription/autorisation individuelle active, soit un pack actif couvrant exactement la matière et le niveau concernés. Les parents classe/année et la matière doivent être actifs. Le contenu et ses parents doivent être publiés. Un professeur doit conserver une affectation active ; enseigner la même matière ne donne aucun droit sur les copies d’un autre professeur.

La découverte publique utilise une projection dédiée des cours publiés et des seuls titres d’exercices. Elle n’expose ni énoncés, ni fichiers privés, ni liens live. Une demande de pack reste sans droit jusqu’à validation administrative du règlement avec référence vérifiable. Le client ne peut écrire ni le prix ni le statut des commandes ; une redirection de paiement n’active rien. Voir [PACKS.md](PACKS.md).

RLS est activée sur les tables exposées. Les fonctions sensibles utilisent un `search_path` vide, des noms qualifiés, des permissions EXECUTE explicites et des contrôles d’acteur. Les tables privées ne sont pas exposées à PostgREST. La protection des routes React est une aide d’interface ; les tests SQL attaquent aussi les tables et RPC directement.

## Transactions

L’admission verrouille la demande et la classe avant le contrôle de capacité. Inscription, autorisations, activation, audit et notification sont atomiques. Une répétition retourne la même décision. Les RPC de remise figent consigne/barème/date ; les fichiers d’une version remise ne sont plus modifiables. Les corrections brouillon ne sont jamais retournées à l’étudiant. Les résultats de compétition ajoutent une seconde condition de publication.

## Fichiers

Les trois buckets sont privés. `files-prepare` réserve un chemin serveur associé à une ressource autorisée et contrôle les quotas. Storage accepte uniquement ces réservations ; aucune écriture arbitraire ou mise à jour d’objet n’est accordée.

`files-finalize` contrôle la taille réelle, les signatures, le décodage et le format. Les images sont orientées/réencodées avec suppression des métadonnées ; les PDF sont reconstruits sans les actions/annotations du document source. Les SVG, HTML, archives et exécutables sont exclus. Le fichier normalisé est attaché atomiquement. Un fichier rejeté n’est pas publié. Les énoncés et leurs pièces jointes sont figés après la première remise.

`files-read-url` reçoit un identifiant de fichier et retrouve le chemin au serveur. Les liens expirent après 120 secondes pour les copies, 300 pour les documents. Une URL déjà émise reste valide jusqu’à expiration ; un document téléchargé ne peut pas être rappelé.

## Google

Ticket, state et preuve de navigateur à usage unique ; vérification OIDC signature/issuer/audience/expiration/nonce ; tokens chiffrés AES-256-GCM dans `private`. Aucun token Google n’atteint React, une notification ou un journal. Les jobs ont une clé d’idempotence, une révision et un verrou à expiration. L’identifiant d’événement Google est stable. Les conférences pending sont reprises sur le même événement ; une annulation empêche une publication tardive et déclenche la compensation nécessaire.

L’ouverture d’une séance revalide compte, affectation/classe/matière, état et fenêtre serveur. Le lien est limité au domaine exact `meet.google.com` et ouvert avec `noopener,noreferrer`.

## Exploitation

Réduire les accès au dashboard Supabase, aux secrets et aux sauvegardes. Configurer le SMTP, les quotas, le worker et les alertes. Définir les durées de conservation et les procédures d’export/anonymisation avant ouverture publique. La restauration doit inclure séparément PostgreSQL, objets Storage et clés de chiffrement.

La suite PGlite vérifie les permissions et les transitions SQL ; elle ne remplace pas une recette Supabase/Storage réelle, un test de concurrence multi-connexion ou un essai Google réel. Voir `VERIFICATION.md`.
