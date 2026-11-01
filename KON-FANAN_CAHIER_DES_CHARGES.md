# Kon-fanan — Cahier des charges fonctionnel et technique

Version : 1.0 · Date : 31 octobre 2026 · Stack demandée : React + Supabase.

**Objectif :** fournir un document de référence suffisamment précis pour développer la plateforme web Kon-fanan, depuis la structure du projet jusqu'à sa mise en production. Ce document décrit le produit, les règles métier, les données, les droits, les intégrations, les parcours et les critères de validation. Il ne constitue pas une application déjà développée ni des migrations SQL prêtes à exécuter.

**Design :** l'identité visuelle sera décrite ensuite dans `DESIGN.md`. Les couleurs, typographies, illustrations et compositions restent à définir. Les écrans, actions, états et contraintes d'accessibilité décrits ici font partie du fonctionnement à conserver.

**Lecture des exigences :** les besoins explicitement exprimés sont identifiés comme confirmés. Les détails nécessaires pour les rendre développables sont des **choix proposés pour la V1**, modifiables par le propriétaire du projet. Ils ne doivent pas être présentés comme des décisions déjà prises par celui-ci.

**Repères de lecture :** sections 1–3 pour le périmètre, 4–10 pour les parcours et écrans, 11–14 pour l'architecture/données/sécurité, 15 pour Google Meet, 16–18 pour les contrats et la configuration, 19–21 pour les tests et la livraison, 22–25 pour le futur design, les instructions d'implémentation et les références.

## 1. Vision du produit

Kon-fanan est une plateforme pédagogique destinée aux élèves de la première année de collège à la troisième année de lycée. Elle réunit des cours, leurs vidéos explicatives, leurs exercices, les copies des élèves, des challenges/concours et des annonces de séances en direct.

L'administrateur organise les classes et les professeurs. Il accepte chaque étudiant et décide précisément des matières auxquelles cet étudiant peut accéder. Le professeur publie son contenu, reçoit les travaux de ses étudiants et annonce ses séances. L'étudiant étudie les contenus autorisés et transmet les photos de ses réponses au professeur responsable.

Une annonce de séance peut créer automatiquement un événement Google Calendar avec un lien Google Meet, au nom du professeur ayant connecté son compte Google.

### 1.1 Besoins confirmés

| ID | Besoin |
|---|---|
| B01 | Trois espaces distincts : administrateur, professeur et étudiant. |
| B02 | Niveaux scolaires allant de la 1ère année collège à la 3ème année lycée. |
| B03 | Création des classes, gestion de leur effectif et affectation de plusieurs professeurs. |
| B04 | Acceptation des étudiants par l'administrateur. |
| B05 | Attribution individuelle des matières accessibles après acceptation. |
| B06 | Publication par le professeur de cours accompagnés d'exercices et de vidéos explicatives. |
| B07 | Envoi de photos des exercices réalisés au professeur responsable du cours. |
| B08 | Challenges et concours pédagogiques. |
| B09 | Annonces des professeurs et meetings avec titre. |
| B10 | Connexion Google du professeur, saisie du titre/date/heure/groupe, création automatique de Google Meet via Calendar API et Supabase Edge Functions. |
| B11 | Affichage du lien dans l'annonce et ouverture de Google Meet dans un nouvel onglet. |
| B12 | Application web React avec backend Supabase. |

### 1.2 Choix proposés pour obtenir une V1 complète

| Sujet non précisé initialement | Choix proposé |
|---|---|
| Langue de l'interface | Français pour la V1 ; préparer les traductions et la compatibilité arabe/RTL. Les contenus pédagogiques peuvent être en français, arabe ou darija. |
| Organisation | Une plateforme administrée par une seule organisation ; plusieurs administrateurs possibles. |
| Année scolaire | Toutes les classes appartiennent à une année scolaire. Les anciennes années sont archivables. |
| Effectif « 50 » | Capacité maximale d'une classe, avec affichage séparé de l'effectif réel. |
| Inscription | Email et mot de passe, email confirmé, puis demande d'admission. |
| Compte professeur | Invitation ou création contrôlée par l'administrateur ; aucune auto-inscription comme professeur. |
| Classe de l'étudiant | Une seule classe active par année scolaire dans la V1. |
| Deux professeurs d'une matière | L'accès à une matière donne accès aux contenus publiés de tous ses professeurs affectés à la classe. Un abonnement à un seul professeur serait une règle différente. |
| Correction | Commentaire du professeur et note facultative ; publication explicite de la correction. |
| Concours/challenges | Énoncé avec fichiers, dates, remise de photos/PDF et correction manuelle. QCM automatique prévu en évolution. |
| Vidéo de cours | Lien YouTube/Vimeo autorisé, affiché dans un lecteur intégré lorsque le fournisseur le permet. Hébergement privé de vidéos à grande échelle en évolution. |
| Meeting | Une séance concerne un seul groupe classe + matière + professeur. Séances multi-groupes en évolution. |
| Notifications | Notifications internes à la plateforme. Emails automatiques de sécurité/authentification ; autres emails et WhatsApp hors V1. |
| Paiement | Aucun paiement ou abonnement dans la V1. L'administrateur attribue les accès. |
| Progression | L'étudiant marque un cours comme commencé/terminé ; aucune prétention à mesurer automatiquement sa compréhension. |

Ces choix servent de base d'implémentation ; les paramètres métier doivent rester faciles à modifier.

## 2. Périmètre de livraison

### 2.1 Inclus dans la V1

- Authentification, confirmation d'email, récupération de mot de passe et déconnexion.
- Admission, suspension, gestion des classes, matières et affectations.
- Cours, documents, vidéos externes, exercices et progression.
- Dépôt de copies, historique des versions et correction manuelle.
- Challenges/concours avec classement facultatif, limité au groupe concerné.
- Annonces et Google Meet automatique avec gestion des erreurs.
- Notifications internes, recherche, filtres et pagination.
- Sécurité PostgreSQL RLS, Storage privé et contrôle des opérations serveur.
- Interface utilisable sur téléphone, tablette et ordinateur.
- Tests des permissions et des parcours essentiels, documentation d'exploitation.

### 2.2 Évolutions distinctes

Paiement, espace parent, messagerie privée, forum, application mobile native, IA de correction, certificats, QCM autocorrigé, compétitions nationales publiques, visioconférence intégrée, enregistrement automatique des séances, streaming vidéo privé, séances récurrentes et synchronisation bidirectionnelle complète de Google Calendar.

Ne pas ajouter ces fonctionnalités à la V1 au détriment des fonctions confirmées. Prévoir des limites de modules qui permettent de les ajouter ensuite.

## 3. Vocabulaire et organisation pédagogique

| Terme | Définition et exemple |
|---|---|
| Niveau | Année d'étude : « 3ème année collège ». Référentiel configurable. |
| Année scolaire | Période administrative, par exemple « 2026–2027 ». |
| Classe | Groupe concret : « 3ème collège A », année 2026–2027, capacité 50. |
| Matière | Mathématiques, philosophie, français… |
| Matière de classe | Association d'une matière à une classe. |
| Espace pédagogique | Association classe + matière + professeur. C'est le périmètre des contenus du professeur. |
| Inscription de classe | Appartenance d'un étudiant à une classe, distincte de ses droits par matière. |
| Autorisation matière | Droit attribué par l'administrateur à cet étudiant dans cette classe. |
| Cours | Leçon avec titre, contenu, vidéo et documents, rattachée à un espace pédagogique. |
| Exercice | Travail lié à un cours, pouvant recevoir une copie. |
| Copie | Travail personnel d'un étudiant, composé de versions et de fichiers. |
| Annonce | Message adressé aux étudiants autorisés d'un espace pédagogique. |
| Séance/meeting | Annonce avec horaire et lien Google Meet. |

```text
Année scolaire
└── Classe → niveau, capacité
    ├── Étudiants inscrits → autorisations matière individuelles
    └── Matières de la classe
        └── Espaces des professeurs
            ├── Cours → vidéo, documents → exercices → copies → corrections
            ├── Challenges / concours → participations → résultats
            └── Annonces → séances Google Meet
```

**Exemple de référence :** Salma appartient à « 3ème collège A » et possède uniquement l'autorisation mathématiques. Elle voit les contenus de mathématiques de cette classe. Elle ne voit pas les contenus de philosophie, ni les mathématiques d'une autre classe, même si elle connaît leurs URL.

Préparer six entrées initiales dans le référentiel : 1ère, 2ème et 3ème année collège ; 1ère, 2ème et 3ème année lycée. Les libellés et éventuelles filières sont administrables. Les matières sont configurées par classe ; aucune matière ne doit être automatiquement attribuée à tous les niveaux.

## 4. Identités, rôles et cycle de vie

### 4.1 Rôles applicatifs

Valeurs techniques : `admin`, `teacher`, `student`. Un seul rôle applicatif par compte pour la V1. Le rôle applicatif est distinct du rôle technique PostgreSQL `authenticated`.

| Action | Administrateur actif | Professeur actif | Étudiant actif et autorisé |
|---|---|---|---|
| Gérer niveaux, années et matières | Oui | Lecture de son périmètre | Lecture utile à son parcours |
| Créer classes et fixer capacités | Oui | Non | Non |
| Accepter/refuser des admissions | Oui | Non | Sa demande uniquement |
| Attribuer/retirer les accès matière | Oui | Non | Non |
| Affecter les professeurs | Oui | Non | Non |
| Créer/modifier un cours | Intervention administrative tracée | Dans ses espaces actifs | Non |
| Lire un cours | Oui | Ses espaces actifs | Publié, classe et matière autorisées |
| Voir une copie et ses fichiers | Oui, pour administration | Si responsable de la cible | Sa propre copie, avec accès courant |
| Corriger une copie | Oui, intervention tracée | Si responsable de la cible | Non |
| Créer une annonce/séance | Modération ; ne pas utiliser le compte Google d'un professeur à son insu | Dans ses espaces actifs | Non |
| Connecter un compte Google | Seulement pour sa propre identité si une fonction future le nécessite | Son propre compte | Inutile en V1 |
| Lire des tokens Google | Jamais dans l'interface | Jamais dans l'interface | Jamais |
| Consulter les journaux d'administration | Oui | Non | Non |

Un professeur ne reçoit pas accès aux copies des autres professeurs simplement parce qu'ils enseignent dans la même classe ou la même matière.

### 4.2 Statuts du compte

`pending` : compte créé, accès pédagogique non encore validé.

`active` : compte activé ; les permissions détaillées restent nécessaires.

`rejected` : demande refusée ; affichage du résultat et d'un message administratif approprié.

`suspended` : accès pédagogique bloqué ; les données historiques restent conservées selon la politique de conservation.

`archived` : compte retiré de l'usage courant, sans suppression physique automatique.

Le rôle et le statut sont protégés côté serveur. Un étudiant ne peut pas devenir professeur en modifiant son profil, les métadonnées de son compte ou une requête réseau.

### 4.3 Inscription et connexion

1. L'étudiant saisit nom d'affichage, email, mot de passe et classe souhaitée.
2. Supabase Auth crée son identité et gère la vérification de l'email.
3. Un mécanisme serveur crée un profil et un accès `student/pending`, de manière idempotente. Les données envoyées par le navigateur ne décident pas du rôle.
4. Après confirmation, l'étudiant soumet sa demande d'admission.
5. Il voit une page d'attente et l'état de sa demande, sans contenu pédagogique.
6. L'administrateur sélectionne la classe finale et au moins une matière avant d'accepter.
7. L'étudiant retrouve ses accès à la prochaine requête valide, sans devoir créer un autre compte.

Prévoir les états email non confirmé, compte déjà existant, lien expiré, mot de passe oublié, refus et suspension. Les messages de récupération ne doivent pas révéler publiquement si une adresse possède un compte.

Les professeurs reçoivent une invitation sécurisée. Le premier administrateur est créé par une procédure d'initialisation serveur documentée, jamais par un formulaire public ou un mot de passe inscrit dans le dépôt.

## 5. Espace administrateur

### 5.1 Tableau de bord

Afficher les demandes en attente, étudiants actifs, professeurs actifs, classes et effectifs, cours publiés et problèmes d'intégration nécessitant une action. Les chiffres proviennent des données autorisées ; aucun indicateur fictif.

### 5.2 Classes et affectations

Formulaire classe : nom, niveau, année scolaire, capacité entière positive et statut actif/archivé. La liste montre par exemple « 37 / 50 étudiants ».

Sur une classe, l'administrateur peut :

- Ajouter ou retirer des matières.
- Affecter un ou plusieurs professeurs à chaque matière.
- Consulter les étudiants et leurs autorisations individuelles.
- Modifier la capacité, sans la réduire sous l'effectif actif actuel.
- Archiver la classe en fin d'année.

Retirer une affectation bloque immédiatement les nouvelles actions du professeur dans cet espace. Par choix V1, ses contenus déjà publiés restent consultables par les étudiants autorisés tant que l'administrateur ne les archive pas. Le transfert de responsabilité vers un autre professeur est une opération administrative explicite et tracée.

### 5.3 Acceptation atomique d'un étudiant

L'opération doit s'exécuter dans **une transaction PostgreSQL**, via une fonction métier :

1. Vérifier l'administrateur actif et verrouiller la demande.
2. Verrouiller la classe cible et vérifier qu'elle est active.
3. Vérifier que l'étudiant ne possède pas une autre inscription active dans cette année.
4. Compter les inscriptions actives et vérifier la capacité.
5. Vérifier que toutes les matières sélectionnées appartiennent à cette classe.
6. Créer l'inscription et les autorisations, activer le compte si nécessaire, accepter la demande.
7. Enregistrer l'audit et un événement de notification dans la même transaction.

Une erreur annule toutes ces modifications. Deux admissions concurrentes ne doivent jamais dépasser la capacité. Une répétition de la même commande ne doit créer ni deuxième inscription ni deuxième notification.

### 5.4 Modification des autorisations

L'administrateur peut accorder ou révoquer une matière sans modifier le compte Auth. Chaque changement comporte auteur, date et éventuellement motif interne.

Après révocation, bloquer les nouvelles lectures de contenu, dépôts, ouvertures de fichiers et demandes de lien de séance de cette matière. Vider les caches de l'interface à la prochaine actualisation d'autorisation. Une URL de fichier déjà signée peut rester utilisable jusqu'à son expiration ; un fichier téléchargé ne peut pas être rappelé.

### 5.5 Transfert et nouvelle année

Un transfert clôt l'ancienne inscription, révoque les anciennes autorisations et crée les nouvelles dans une transaction, avec contrôle de capacité. Les copies restent attachées à leur contexte historique. Elles demeurent consultables par l'administrateur et le professeur compétent ; l'étudiant perd l'accès pédagogique à l'ancien contexte selon la règle V1.

Une nouvelle année scolaire ne déplace pas automatiquement tous les élèves. Prévoir une opération administrative explicite. La duplication de contenus d'une année à l'autre crée de nouveaux identifiants et ne duplique jamais les copies ni les notes des élèves.

## 6. Espace professeur : cours et exercices

### 6.1 Tableau de bord

Afficher les classes/matières affectées, cours récents, copies à corriger, prochaines séances et état de connexion Google. L'état « Google à reconnecter » doit expliquer l'action nécessaire.

### 6.2 Cours

Champs : espace pédagogique, titre, résumé, chapitre facultatif, ordre d'affichage, contenu riche sécurisé, langue du contenu, lien vidéo facultatif pendant le brouillon, documents, statut et date de publication.

Cycle : `draft → published → archived`. Le professeur peut enregistrer un brouillon incomplet. Pour publier, exiger un titre, un espace autorisé, un contenu exploitable et une vidéo valide, conformément au besoin de cours accompagné de son explication. Il peut préparer les exercices avant la publication du cours.

Un cours publié doit disposer d'au moins un exercice prêt à publier ; la commande de publication initiale peut publier le cours et les exercices sélectionnés dans une seule transaction. Si cette règle doit devenir facultative, elle doit être modifiée explicitement dans la configuration produit.

Fonctions : créer, prévisualiser, modifier, publier, classer et archiver. Supprimer physiquement uniquement un brouillon sans dépendances. Un cours utilisé par des copies s'archive ; il ne disparaît pas en cascade avec les travaux.

Pour une vidéo YouTube/Vimeo, accepter une URL normalisée depuis une liste de fournisseurs autorisés et fabriquer l'intégration à partir de l'identifiant reconnu. Ne pas accepter de code iframe arbitraire. Un lien externe ou « non répertorié » ne constitue pas une protection contre le partage hors de la plateforme.

### 6.3 Exercices

Champs : cours parent, titre, consigne, documents, ordre, difficulté facultative, date limite facultative, retard autorisé ou non, barème maximal positif proposé à 20, statut et consignes de remise.

La V1 accepte des réponses par photos/PDF accompagnées d'un texte facultatif. La date limite et les conditions de nouvelle remise sont contrôlées avec l'heure serveur.

Un exercice n'est visible à l'étudiant que si lui-même et son cours sont publiés. Après réception d'une copie, ne pas changer silencieusement le barème ou l'énoncé de référence : geler les champs structurants ou créer une nouvelle version explicitement annoncée. Le contexte noté est conservé sur la version de copie.

### 6.4 Tableau des copies

Filtres par classe, matière, cours, exercice et état. Afficher étudiant, date de remise, retard éventuel, nombre de fichiers, version et état de correction. L'enseignant ne récupère que les lignes de son périmètre.

La correction comprend un commentaire et éventuellement une note. Le professeur enregistre d'abord un brouillon, puis publie. Une correction en brouillon n'est jamais retournée à l'étudiant par l'API. Une modification après publication est tracée et produit une notification de mise à jour.

Le professeur peut demander une nouvelle version et fixer un délai de réouverture. Cette autorisation reste liée à une copie précise ; elle ne rouvre pas l'exercice pour toute la classe.

## 7. Espace étudiant et remise des travaux

### 7.1 Accueil étudiant

Afficher ses matières, cours à poursuivre, exercices en attente, corrections disponibles, challenges ouverts et prochaines séances. Un étudiant accepté sans autorisation active voit un message explicite et un moyen d'identifier l'administration, pas un catalogue accessible par défaut.

### 7.2 Consultation d'un cours

Afficher titre, professeur, classe/matière, contenu, vidéo, documents et exercices liés. Les liens entre cours précédent/suivant ne doivent traverser que des contenus autorisés. La progression est individuelle.

### 7.3 Parcours de remise

1. Ouvrir un exercice autorisé et vérifier son délai.
2. Sélectionner une ou plusieurs photos depuis le téléphone, prendre une photo si le navigateur le permet ou joindre un PDF.
3. Prévisualiser, retirer un fichier et ajouter un commentaire facultatif.
4. Enregistrer un brouillon côté serveur et téléverser les fichiers dans un espace privé.
5. Attendre la validation effective de tous les fichiers.
6. Cliquer « Envoyer mon travail ».
7. Le serveur recontrôle droits, délai et fichiers, puis fige la version avec son horodatage.
8. Afficher une confirmation avec date et état « Envoyé ». Le professeur reçoit une notification interne.

Un téléchargement partiel ne vaut pas remise. Si le réseau échoue, conserver le brouillon et permettre une reprise sans dupliquer les objets validés.

### 7.4 Versions et corrections

États d'une copie : `draft`, `submitted`, `changes_requested`, `reviewed`. Une version soumise est immuable. Une demande de modification permet de créer une nouvelle version numérotée ; les anciennes restent consultables par les personnes autorisées.

La copie est unique par étudiant et exercice, ou par étudiant et compétition. Les versions appartiennent à cette copie. La correction est attachée à une version précise pour éviter qu'une note concerne des fichiers remplacés après évaluation.

L'étudiant ne peut pas modifier une note, publier une correction, déplacer sa copie vers un autre exercice ou écraser un fichier soumis. La publication de la correction et le passage de la copie à `reviewed` sont atomiques.

## 8. Challenges et concours

Le besoin de concours est confirmé ; le format suivant est un choix proposé pour la V1.

Le professeur crée un élément de type `challenge` ou `contest` dans un espace pédagogique avec : titre, présentation, énoncé, pièces jointes, dates d'ouverture/fermeture, barème, règles et option de classement.

Cycle : `draft → published → closed → archived`, avec `cancelled` possible. La période effective de participation dépend toujours de l'heure serveur, même si un traitement planifié de clôture prend du retard.

L'étudiant autorisé consulte le sujet et remet sa participation selon le même système de copies et de versions. Une seule participation logique par étudiant ; pas de nouvelles versions après clôture, sauf réouverture individuelle explicite.

La correction est manuelle. Le professeur publie les résultats après la clôture. Le classement est désactivé par défaut ; s'il est activé, il est visible seulement dans le groupe autorisé, sous un pseudonyme généré et sans email. Des notes égales donnent le même rang. Aucun classement global interclasses dans la V1.

Ne pas exposer les copies des autres participants. Un résultat non publié ne doit pas être devinable via une vue, un tri, une notification ou une requête directe. Le classement doit être une projection serveur limitée, pas un accès à toute la table des corrections.

Pour une compétition, même une évaluation marquée `published` par le professeur reste invisible à l'étudiant tant que `results_published_at` n'est pas défini sur la compétition. Cette condition s'applique aux notes, commentaires, notifications et classements. Publier une correction de compétition la prépare ; publier les résultats libère les corrections et notifications ensemble. Pour un exercice ordinaire, la publication de sa correction suffit.

## 9. Annonces, séances et notifications

### 9.1 Annonce simple

Titre, message, espace pédagogique, statut, date de publication et éventuelle pièce jointe. Le professeur voit les groupes qui lui sont affectés et choisit le destinataire. Le groupe correspond à une classe et une matière, pas à tous les élèves de l'établissement.

Une annonce peut être publiée sans séance. Une annonce de séance comporte en plus un meeting et son état de préparation.

### 9.2 Séance

Champs du formulaire : titre, description facultative, groupe, date, heure de début, heure de fin, fuseau, cours associé facultatif.

Valeur initiale du fuseau : `Africa/Casablanca`. Stocker les instants en `timestamptz`, conserver le nom IANA du fuseau et convertir correctement à l'affichage. Ne pas coder un décalage constant UTC+1. Afficher le fuseau à côté de l'horaire.

La publication lance une opération serveur durable. Le professeur voit « Création du lien en cours ». Par choix V1, l'annonce de séance n'est visible aux étudiants qu'une fois le lien prêt et la publication finalisée.

États métier : `draft`, `publishing`, `scheduled`, `cancelled`, `finished`, `error`. L'état de synchronisation Google est suivi séparément. Le bouton « Rejoindre le cours » est disponible pour une séance publiée non annulée, avec lien valide et autorisation courante ; proposer son activation 15 minutes avant le début et jusqu'à la fin prévue. Ce délai d'affichage est un paramètre produit, pas une mesure de sécurité de Google Meet.

### 9.3 Notifications internes

Événements : admission acceptée/refusée, accès matière modifié, cours publié, nouvelle annonce, séance créée/modifiée/annulée, travail remis, correction publiée, nouvelle version demandée et résultats disponibles.

La notification contient un destinataire, un type, une référence, une date et `read_at`. Le contenu stocké doit rester minimal : ne pas inclure un lien Meet ou des données sensibles dans une notification dont le contexte pourrait être révoqué. L'ouverture de la cible refait le contrôle d'accès.

Créer les notifications depuis une outbox transactionnelle, avec une clé de déduplication. Une republication accidentelle ou un retry ne doit pas produire plusieurs notifications identiques. L'étudiant peut uniquement marquer ses notifications comme lues.

## 10. Pages et navigation à développer

Les routes ci-dessous sont un contrat de navigation proposé. Le navigateur facilite le parcours ; les droits restent imposés par le backend.

| Route | Contenu et actions attendus |
|---|---|
| `/` | Présentation concise, connexion, inscription ; aucun contenu pédagogique privé. |
| `/connexion` | Connexion, erreurs utiles, lien mot de passe oublié. |
| `/inscription` | Création du compte étudiant et parcours de demande. |
| `/auth/callback` | Traitement du retour Supabase Auth ; distinct du callback Google Calendar serveur. |
| `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` | Récupération sécurisée. |
| `/admission` | Demande, attente, refus et informations de décision. |
| `/compte-suspendu` | État du compte et indication de contact administratif. |
| `/admin` | Tableau de bord. |
| `/admin/admissions` | Filtrer les demandes, ouvrir, accepter avec matières ou refuser. |
| `/admin/classes`, `/admin/classes/:id` | Classes, capacité, matières, professeurs, étudiants. |
| `/admin/etudiants`, `/admin/etudiants/:id` | Profil administratif, inscription, droits et historique. |
| `/admin/professeurs`, `/admin/professeurs/:id` | Invitations, statut et affectations. |
| `/admin/referentiels` | Années scolaires, niveaux, matières et paramètres. |
| `/admin/contenus` | Recherche, modération, archivage et transfert de responsabilité. |
| `/admin/integrations`, `/admin/audit` | Problèmes de synchronisation sans secrets, historique administratif. |
| `/prof` | Tableau de bord professeur. |
| `/prof/groupes`, `/prof/groupes/:id` | Espaces pédagogiques et étudiants autorisés de chacun. |
| `/prof/cours`, `/prof/cours/nouveau`, `/prof/cours/:id` | Liste, création et édition du cours et de ses exercices. |
| `/prof/copies`, `/prof/copies/:id` | Remises, visualisation privée des fichiers et correction. |
| `/prof/competitions`, `/prof/competitions/:id` | Énoncé, période, participations et publication des résultats. |
| `/prof/annonces`, `/prof/seances` | Création, publication, modification et annulation. |
| `/prof/integrations/google` | Connecter, état, reconnecter, déconnecter. |
| `/etudiant` | Tableau de bord étudiant. |
| `/etudiant/matieres`, `/etudiant/matieres/:id` | Ses seules matières et les professeurs correspondants. |
| `/etudiant/cours/:id` | Contenu, vidéo, documents, progression et exercices. |
| `/etudiant/exercices/:id` | Énoncé, brouillon, dépôt et correction. |
| `/etudiant/mes-travaux` | Historique autorisé des remises et résultats. |
| `/etudiant/competitions`, `/etudiant/competitions/:id` | Compétitions autorisées et sa participation. |
| `/etudiant/annonces`, `/etudiant/seances` | Informations et séances de son périmètre. |
| `/notifications`, `/profil` | Notifications personnelles et informations de profil modifiables. |
| `/403`, route inconnue | Accès indisponible ou page introuvable, sans révéler de détails privés. |

Pour chaque écran de liste : chargement, vide, succès, erreur, filtres, pagination et éventuel accès retiré. Pour chaque formulaire : validation, enregistrement en cours, succès, erreur récupérable et protection contre un double envoi.

## 11. Architecture technique proposée

```text
React + TypeScript + Vite
├── Supabase Auth : session et identité
├── Data API + RLS : lectures autorisées
├── RPC PostgreSQL : opérations métier atomiques
├── Storage privé : documents et copies
└── Edge Functions : OAuth, fichiers sensibles, invitations et intégrations
    ├── PostgreSQL privé : tokens chiffrés, opérations durables, audit
    └── Google Calendar API → événement + conférence Google Meet

Worker planifié → reprend les opérations en attente et l'outbox
Realtime facultatif → actualise l'interface, sans remplacer les règles serveur
```

### 11.1 Frontend

Choix proposés : React, TypeScript strict, Vite, React Router, TanStack Query, React Hook Form et Zod. Le système de composants et le choix CSS seront arrêtés dans `DESIGN.md`. La documentation React décrit Vite parmi les outils permettant de construire une application React depuis zéro ; l'architecture SPA retenue ici est un choix du projet. [Documentation React](https://react.dev/learn/build-a-react-app-from-scratch)

Utiliser des versions stables compatibles au démarrage réel du développement et committer le lockfile. Ne pas supposer qu'un numéro de version cité dans une ancienne réponse reste le bon.

Répartir le code par domaine : identité, admissions, classes, autorisations, cours, remises, compétitions, annonces, séances et notifications. Les composants ne doivent pas contenir les secrets ni les règles d'autorisation définitives.

### 11.2 Backend

PostgreSQL porte les relations, contraintes et transactions. Supabase Auth porte les identités. Les Edge Functions exécutent les échanges externes et opérations privilégiées après vérification de l'appelant.

Privilégier les lectures avec le JWT de l'utilisateur pour appliquer RLS. Réserver le client serveur privilégié aux opérations qui en ont besoin. Une clé serveur ne remplace pas une vérification du rôle et du périmètre.

### 11.3 Arborescence indicative

```text
kon-fanan/
  docs/
    CAHIER_DES_CHARGES.md
    DESIGN.md
    SETUP.md
    DEPLOYMENT.md
    SECURITY.md
  src/
    app/                    # router, providers, session, layouts
    components/             # composants partagés
    features/
      auth/ admissions/ classes/ access/
      courses/ submissions/ competitions/
      announcements/ meetings/ notifications/
    lib/                    # clients, dates, validation, erreurs
    locales/                # chaînes de l'interface
    types/database.types.ts # généré depuis le schéma réel
  supabase/
    config.toml
    migrations/
    seed.sql                # données locales fictives uniquement
    functions/
      _shared/
      teacher-invite/
      google-oauth-start/
      google-oauth-redirect/
      google-oauth-callback/
      google-disconnect/
      meetings-publish/
      meetings-update/
      meetings-cancel/
      meetings-join/
      integration-worker/
      files-prepare/
      files-finalize/
      files-read-url/
  tests/                    # intégration, RLS, parcours navigateur
  .env.example
  package.json
```

## 12. Modèle relationnel de référence

Cette section est le contrat de données à traduire en migrations SQL versionnées. Elle ne remplace pas les migrations, leurs politiques RLS et leurs tests.

### 12.1 Conventions

- Identifiants UUID, horodatages `timestamptz`, noms SQL en `snake_case`.
- `created_at` et `updated_at` sur les entités modifiables ; `created_by` quand pertinent.
- `row_version` entier sur les entités éditables pour détecter les modifications concurrentes.
- Clés étrangères explicites, contraintes `CHECK`, unicités et index des FK utilisés.
- États définis par enums ou contraintes ; pas de texte libre pour les rôles.
- Montants de notes en `numeric`, jamais en flottant ; score entre zéro et le barème.
- Schéma `public` exposé uniquement avec permissions explicites et RLS ; schéma `private` non exposé à la Data API ni à Realtime.

### 12.2 Identités et administration

| Table | Champs structurants et contraintes |
|---|---|
| `profiles` | `id` PK/FK vers `auth.users.id`, `display_name`, `preferred_language`. Ne pas recopier ici les tokens ni rendre les emails visibles à tous. |
| `account_access` | `user_id` PK/FK, `role`, `status`, `activated_at`, `suspended_at`. Écriture serveur seulement. |
| `academic_years` | `id`, `label` unique, `starts_on`, `ends_on`, `is_current`, `status`. Début < fin ; au plus une année courante. |
| `levels` | `id`, `code` unique, `label`, `cycle` collège/lycée, `sort_order`, `is_active`. |
| `subjects` | `id`, `code` unique, `label`, `is_active`. |
| `classes` | `id`, `academic_year_id`, `level_id`, `name`, `capacity`, `status`. Unique année + nom ; capacité > 0. Ajouter l'unicité composite nécessaire à la FK classe/année ci-dessous. |
| `class_subjects` | `id`, `class_id`, `subject_id`, `is_active`. Unique classe + matière. |
| `teaching_spaces` | `id`, `class_subject_id`, `teacher_id`, `is_active`, `assigned_by`, `assigned_at`. Unique matière de classe + professeur. Le professeur doit avoir le rôle approprié. |
| `admission_requests` | `id`, `student_id`, `requested_class_id`, `status` pending/accepted/rejected/withdrawn, `decided_by`, `decided_at`, `public_message`, `accepted_enrollment_id`. Une seule demande en attente par étudiant ; champs de décision protégés. |
| `class_enrollments` | `id`, `student_id`, `class_id`, `academic_year_id`, `status` active/ended, `joined_at`, `ended_at`. FK composite classe + année ; index unique partiel étudiant + année lorsque actif. |
| `student_subject_access` | `id`, `enrollment_id`, `class_subject_id`, `status` active/revoked, `granted_by`, `granted_at`, `revoked_at`. Unique inscription + matière de classe. Vérifier qu'elles appartiennent à la même classe. |
| `platform_settings` | Paramètres autorisés et typés : fuseau par défaut, limites de fichiers, fenêtre de connexion à une séance. Aucun secret. Modification administrateur validée côté serveur. |

Les contraintes entre tables, par exemple « matière et inscription de la même classe », doivent être imposées par FK composites lorsque possible, sinon par triggers et fonctions métier. Un contrôle Zod dans React n'est pas suffisant.

### 12.3 Contenus pédagogiques

| Table | Champs structurants et contraintes |
|---|---|
| `courses` | `id`, `teaching_space_id`, `title`, `summary`, `chapter_label`, `body`, `content_language`, `video_provider`, `video_id`, `position`, `status`, `published_at`, `created_by`, `row_version`. |
| `course_resources` | `id`, `course_id`, `file_id`, `label`, `position`. Référencer seulement un fichier validé du bon propriétaire. |
| `exercises` | `id`, `course_id`, `title`, `instructions`, `position`, `difficulty`, `due_at`, `allow_late`, `max_score`, `status`, `published_at`, `row_version`. |
| `exercise_resources` | `id`, `exercise_id`, `file_id`, `label`, `position`. |
| `course_progress` | PK composite `student_id, course_id`, `status` started/completed, `started_at`, `completed_at`. Uniquement pour un cours accessible. |
| `competitions` | `id`, `teaching_space_id`, `kind`, `title`, `instructions`, `opens_at`, `closes_at`, `max_score`, `status`, `leaderboard_enabled`, `results_published_at`, `row_version`. Ouverture < fermeture. |
| `competition_resources` | `id`, `competition_id`, `file_id`, `label`, `position`. |

Le périmètre d'un exercice se déduit de son cours. Éviter les colonnes `class_id`, `subject_id` et `teacher_id` copiées sans contrainte sur chaque table, qui pourraient se contredire.

### 12.4 Copies, versions et corrections

| Table | Champs structurants et contraintes |
|---|---|
| `submissions` | `id`, `student_id`, `exercise_id` nullable, `competition_id` nullable, `status`, `latest_version_id`, `resubmit_until`, `resubmit_requested_by`, `row_version`. Exactement une cible non nulle. Deux index uniques partiels : étudiant + exercice et étudiant + compétition. |
| `submission_versions` | `id`, `submission_id`, `version_number`, `student_comment`, `submitted_at`, `is_late`, `max_score_snapshot`, `statement_snapshot`. Unique copie + numéro ; version figée après soumission. |
| `submission_files` | `id`, `submission_version_id`, `file_id`, `position`. Fichier validé et appartenant à l'étudiant de cette copie. |
| `evaluations` | `id`, `submission_version_id` unique, `reviewer_id`, `feedback`, `score` nullable, `max_score`, `status` draft/published, `published_at`, `row_version`. Barème = snapshot de la version ; score dans l'intervalle autorisé. |

Garantir que `latest_version_id` référence une version de cette même copie, par FK composite différable ou trigger équivalent. Une seule version brouillon ouverte par copie. Les RPC gèrent les transitions et empêchent toute modification de `student_id`, de cible ou de fichiers déjà soumis.

Le classement utilise uniquement les évaluations publiées de la dernière version soumise et les résultats d'une compétition dont `results_published_at` est renseigné. Les anciennes corrections restent de l'historique, pas des scores supplémentaires.

### 12.5 Annonces et séances

| Table | Champs structurants et contraintes |
|---|---|
| `announcements` | `id`, `teaching_space_id`, `type` notice/live_session, `title`, `body`, `status` draft/published/archived, `published_at`, `created_by`, `row_version`. |
| `announcement_resources` | `id`, `announcement_id`, `file_id`, `label`. |
| `meetings` | `id`, `announcement_id` unique, `course_id` nullable, `starts_at`, `ends_at`, `timezone`, `status`, `sync_status`, `revision`, `last_error_code`. Début < fin ; le cours éventuel appartient au même espace que l'annonce. |
| `notifications` | `id`, `recipient_id`, `type`, `target_type`, `target_id`, `dedupe_key`, `created_at`, `read_at`. Unique destinataire + clé de déduplication. Texte minimal sans lien de conférence. |

Les identifiants Google et le lien Meet résident dans une table privée décrite ci-dessous. Les lecteurs autorisés reçoivent un DTO de séance ; le lien est délivré par l'action « Rejoindre », après revalidation. L'interface affiche ce lien/bouton dans l'annonce comme demandé.

### 12.6 Fichiers et données privées serveur

| Table | Champs structurants et contraintes |
|---|---|
| `files` | `id`, `owner_id`, `bucket`, `object_path` unique, `original_name`, `mime_type`, `size_bytes`, `status` pending/ready/rejected/deleted, `created_at`. Les données MIME/taille finales sont vérifiées côté serveur. |
| `private.teacher_invitations` | Email, statut, identifiant d'invitation, expiration, créateur et éventuel `user_id`. Éviter de conserver un jeton brut d'invitation. |
| `private.google_connections` | `id`, `teacher_id`, `google_subject`, `google_email`, `granted_scopes`, `calendar_id`, `is_current`, tokens chiffrés, nonce/IV, version de clé, expiration, état connected/reconnect_required/disconnected. Au plus une connexion courante par professeur via index unique partiel. Une connexion historique conserve son identité Google, sans tokens devenus inutiles. |
| `private.oauth_flows` | Empreinte du `state`, professeur initiateur, preuve de liaison au navigateur, `nonce`, date d'expiration et date de consommation. Données temporaires ; aucun secret dans l'URL de retour. |
| `private.meeting_integrations` | `meeting_id` unique, `connection_id`, `google_event_id`, `conference_request_id`, `meet_url`, `google_etag`, état de synchronisation et dates. Unicité connexion + identifiant d'événement. |
| `private.integration_jobs` | `id`, `meeting_id`, `requested_by`, `operation` create/update/cancel/reconcile, `requested_revision`, `idempotency_key`, `payload_hash`, `status`, `attempt_count`, `next_attempt_at`, `locked_until`, `last_error_code`. Contrainte unique sur acteur + opération + ressource + clé d'idempotence. |
| `private.notification_outbox` | Événement métier, référence, clé unique, statut, tentatives et échéance de reprise. Les destinataires sont déterminés côté serveur. |
| `private.audit_events` | `actor_id`, action, type et ID de ressource, changements autorisés avant/après, date, `request_id`. Append-only ; aucun token, mot de passe ou copie complète. |

Ne pas exposer une vue `security definer` sur ces tables à tous les comptes. Les DTO d'état Google ne renvoient que l'email connecté au professeur concerné, l'état et une éventuelle action de reconnexion ; l'administrateur voit seulement ce qui est nécessaire au support.

### 12.7 Index et intégrité

Indexer les chemins de contrôle d'accès : étudiant → inscription active → autorisation matière ; professeur → espace ; espace → cours publiés ; cours → exercices ; cible → copies ; destinataire → notifications ; jobs → statut + échéance.

Prévoir des index de liste sur `(teaching_space_id, status, published_at)`, `(student_id, updated_at)`, `(recipient_id, read_at, created_at)` et les FK des tables enfants. Vérifier les plans sur un jeu de données réaliste plutôt que d'ajouter des index sans mesure.

Utiliser `RESTRICT` ou un archivage pour les entités pédagogiques ayant de l'historique. Les cascades ne concernent que des enfants dont la suppression est explicitement voulue. La suppression d'un compte Auth doit suivre une procédure métier de conservation/anonymisation, pas effacer involontairement toutes les copies.

## 13. Autorisation, RLS et séparation des données

### 13.1 Principes techniques

Activer RLS sur chaque table exposée. Les politiques PostgreSQL définissent les lignes lisibles et les écritures autorisées ; les politiques Storage doivent être configurées séparément. Les vues exposées doivent respecter les droits de l'appelant, notamment avec `security_invoker` lorsque adapté. Ne pas utiliser `user_metadata` comme source de rôle fiable, puisque l'utilisateur peut modifier ces métadonnées. [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)

La session identifie l'utilisateur ; `account_access` et les relations courantes décident de ses permissions. Ne pas conserver une copie des matières dans un JWT comme unique source d'autorisation : elle resterait périmée après révocation.

### 13.2 Prédicats métier à centraliser

Définir et tester les équivalents des fonctions suivantes :

```text
is_active_admin(user)
is_active_teacher(user)
is_active_student(user)
can_manage_space(user, teaching_space)
has_subject_access(user, class_subject)
can_read_course(user, course)
can_read_exercise(user, exercise)
can_read_submission(user, submission)
can_read_announcement(user, announcement)
can_read_file(user, file)
can_join_meeting(user, meeting, server_time)
```

Pour un étudiant, `has_subject_access` exige simultanément : identité authentifiée, rôle étudiant, compte actif, inscription active dans la bonne classe/année, autorisation matière active et matière de classe active. Pour consulter un contenu, vérifier aussi ses états de publication et ceux de ses parents. Une classe ou année archivée bloque l'usage étudiant courant selon le choix V1.

Pour un professeur, `can_manage_space` exige compte actif et affectation active à cet espace. Être le `created_by` historique d'un contenu ne suffit pas après retrait de l'affectation.

Les fonctions prennent l'identité depuis `auth.uid()` dans les RPC utilisateur. Elles ne font pas confiance à un `user_id` libre transmis par React. Les workers privilégiés utilisent une identité de service et des commandes privées contrôlées, jamais une route publique permettant d'usurper un acteur.

### 13.3 Matrice de lecture et d'écriture

| Famille | Lecture | Écriture autorisée |
|---|---|---|
| Profils | Soi-même ; professeur pour ses étudiants autorisés ; administrateur. Les étudiants peuvent voir l'identité professionnelle minimale de leurs professeurs. | Soi-même pour nom/langue uniquement ; administration pour les opérations encadrées. |
| Accès du compte | Soi-même et administrateur. | Serveur et commandes administrateur ; jamais une mise à jour libre. |
| Demandes d'admission | Étudiant propriétaire et administrateur. | Création/retrait par propriétaire, décision uniquement par RPC administrateur. |
| Classes, matières, affectations | Selon rôle et périmètre. Avant admission, projection minimale des classes ouvertes sans liste d'élèves. | RPC administrateur. |
| Inscriptions et autorisations | Étudiant concerné, professeur pour le périmètre nécessaire, administrateur. | RPC administrateur. |
| Cours/exercices/annonces/compétitions | Administrateur, professeur affecté ; étudiant autorisé et contenu publié. | Commandes validées du professeur responsable ou administrateur. |
| Copies et versions | Propriétaire avec accès courant, professeur responsable, administrateur. | Commandes de brouillon/remise du propriétaire ; transitions de correction par responsable. |
| Corrections | Responsable et administrateur ; propriétaire si publiées et contexte accessible. Pour une compétition, exiger aussi la publication des résultats. | Responsable via sauvegarde/publication ; aucun droit étudiant. |
| Progression | Propriétaire et responsables pédagogiques autorisés. | Propriétaire sur cours autorisé ; pas de modification d'un autre étudiant. |
| Notifications | Destinataire uniquement ; support administratif via opération spécifique tracée si nécessaire. | Serveur pour création ; destinataire pour `read_at` uniquement. |
| Fichiers | Selon la ressource pédagogique ou copie qui les référence. | Préparation et finalisation contrôlées ; suppression limitée aux brouillons autorisés. |
| Secrets, jobs, outbox, audit | Backend ; projection d'audit autorisée à l'administrateur. | Backend uniquement. |

Les étudiants ne doivent pas pouvoir lister tous les profils, emails, inscriptions ou copies. Les agrégats et tableaux de bord doivent appliquer la même isolation.

### 13.4 Écritures sensibles

Révoquer les droits directs de modification sur les colonnes protégées et utiliser des RPC pour les transitions métier. RLS filtre des lignes ; elle ne remplace pas à elle seule une protection des colonnes ou des transitions d'état.

Pour toute politique `UPDATE`, examiner les conditions sur la ligne existante et la ligne résultante (`USING` et `WITH CHECK`). Empêcher le déplacement d'un contenu vers une classe étrangère et le changement du propriétaire d'un fichier.

Une fonction `SECURITY DEFINER` doit avoir un `search_path` sûr, utiliser des références qualifiées, limiter ses permissions `EXECUTE` et vérifier l'appelant. Préférer `SECURITY INVOKER` lorsqu'il suffit. [Fonctions PostgreSQL dans Supabase](https://supabase.com/docs/guides/database/functions)

### 13.5 Sessions, caches et contenu riche

- Nettoyer les caches de données personnelles à la déconnexion et au changement de compte.
- À la réception d'un refus d'accès, retirer les données concernées de l'écran et invalider les requêtes.
- Ne pas persister les copies, notes ou liens de fichiers dans un cache public ou un service worker.
- Assainir le HTML/Markdown riche avant rendu ; interdire scripts, événements HTML et URL `javascript:`.
- Valider les URL externes et configurer une CSP adaptée aux fournisseurs vidéo autorisés.
- Protéger les pages authentifiées de l'indexation ; ne pas les inclure dans un sitemap public.
- Les contrôles de route React sont utiles pour l'expérience, mais ne constituent pas le mécanisme de sécurité.

## 14. Documents, photos et Storage

### 14.1 Buckets privés

Créer `course-materials`, `student-submissions` et `announcement-materials` en privé. Les fichiers de compétition peuvent utiliser `course-materials` avec un chemin distinct.

Les buckets privés appliquent un contrôle d'accès ; les URL signées permettent un accès temporaire. Les buckets publics ne conviennent pas aux copies d'étudiants. [Buckets Supabase](https://supabase.com/docs/guides/storage/buckets/fundamentals)

Chemins générés côté serveur, sans nom d'étudiant ni email :

```text
course-materials/courses/{course_id}/{file_id}.pdf
course-materials/exercises/{exercise_id}/{file_id}.pdf
course-materials/competitions/{competition_id}/{file_id}.pdf
student-submissions/{student_id}/{submission_id}/{version_id}/{file_id}.jpg
announcement-materials/{announcement_id}/{file_id}.pdf
```

### 14.2 Limites proposées

| Usage | Types autorisés | Limites V1 proposées |
|---|---|---|
| Copie étudiant | JPEG, PNG, WebP, PDF | 5 fichiers maximum ; 10 Mo par image, 20 Mo par PDF ; total 30 Mo par version. |
| Support de cours/exercice/concours | PDF, JPEG, PNG, WebP | 20 Mo par fichier, 10 pièces maximum par ressource. |
| Pièce d'annonce | PDF, JPEG, PNG, WebP | 10 Mo par fichier, 3 pièces maximum. |
| Vidéo | URL de fournisseur autorisé | Pas de fichier vidéo téléversé dans la V1 proposée. |

Appliquer ces limites au navigateur pour guider l'utilisateur et au serveur/bucket pour les imposer. Les valeurs du paramétrage ne peuvent pas dépasser les limites effectivement supportées par l'infrastructure.

### 14.3 Protocole de fichier

1. `files-prepare` vérifie utilisateur, cible, droits, quota et version modifiable.
2. Le backend crée une ligne `files/pending` et un chemin unique autorisé.
3. Le client téléverse l'objet avec sa session et les politiques Storage adaptées à cette réservation. Ne pas permettre des écritures arbitraires simplement parce que le chemin commence par son ID.
4. `files-finalize` vérifie existence, taille réelle, type réel et correspondance avec la réservation ; les contrôles coûteux sont délégués à un worker si nécessaire.
5. Le fichier passe à `ready` et est attaché à la ressource dans une transaction. Un fichier invalide reste inaccessible et est supprimé via l'API Storage.
6. La remise de copie est autorisée seulement si tous les fichiers référencés sont `ready`.

Ne pas se fier à l'extension ni au type MIME déclaré. Rejeter SVG, HTML, exécutables et archives dans cette V1. Pour les images, prévoir une normalisation supprimant les métadonnées EXIF ; les PDF doivent être contrôlés et servis dans un contexte adapté ou en téléchargement. Aucun fichier non validé ne doit être proposé aux autres utilisateurs.

Des politiques sur `storage.objects` doivent contrôler lecture, insertion, mise à jour et suppression selon la réservation et le contexte. Le fait de posséder un objet ne doit pas autoriser à remplacer une version soumise. [Contrôle d'accès Storage](https://supabase.com/docs/guides/storage/security/access-control)

### 14.4 Lecture et nettoyage

`files-read-url` reçoit un `file_id`, retrouve le chemin lui-même et vérifie `can_read_file`. Il renvoie une URL signée de courte durée, par exemple 120 secondes pour une copie et 300 secondes pour un document pédagogique. Ne jamais signer un chemin Storage libre fourni par l'appelant.

La suppression logique d'un brouillon déclenche un nettoyage des objets devenus inutiles. Un traitement périodique supprime les téléversements abandonnés, par exemple après 24 heures, après vérification qu'aucune ressource active ne les référence. Conserver un suivi des échecs de suppression. Les objets Storage se suppriment par leur API, pas en effaçant seulement leurs métadonnées SQL.

## 15. Google Calendar et Google Meet automatiques

### 15.1 Résultat attendu

Le professeur connecte Google depuis son espace. Il saisit les informations d'une séance et publie. Le backend crée un événement dans son calendrier principal, demande une conférence Google Meet, enregistre les identifiants et publie l'annonce quand le lien est disponible. L'étudiant autorisé clique sur « Rejoindre le cours » et ouvre Google Meet dans un nouvel onglet.

L'autorisation Calendar est une intégration du compte professeur ; elle est distincte de la connexion à Kon-fanan avec Supabase Auth. Le fonctionnement ne doit pas dépendre d'un token Google conservé dans React.

### 15.2 Configuration Google Cloud

- Créer un projet Google Cloud pour l'application et activer Google Calendar API.
- Configurer l'écran de consentement : nom Kon-fanan, domaine, contact de support et politique de confidentialité.
- Créer un client OAuth de type application web.
- Déclarer exactement les URI de callback serveur pour développement et production. Utiliser des clients séparés selon l'environnement.
- Déclarer les utilisateurs de test pendant les essais et préparer la publication/vérification OAuth requise par les scopes et le public visé.

Google demande de configurer l'écran de consentement et de sélectionner les scopes adaptés. Le passage en production doit être validé sur cette configuration réelle. [Configuration OAuth](https://developers.google.com/workspace/guides/configure-oauth-consent)

Pour la V1 avec calendrier principal appartenant au professeur, proposer le scope `https://www.googleapis.com/auth/calendar.events.owned`, accepté pour `events.insert`. Ajouter `openid email` pour identifier le compte connecté. Vérifier les scopes accordés au retour ; ne pas demander l'accès complet au calendrier sans nécessité. [Scopes acceptés par events.insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)

### 15.3 Connexion OAuth serveur

Flux à implémenter et tester :

1. `google-oauth-start`, appelé avec le JWT Kon-fanan, vérifie un professeur actif et génère un ticket d'initiation court, aléatoire et à usage unique.
2. Le navigateur ouvre `google-oauth-redirect` avec ce ticket. Cette route le consomme, génère un `state` imprévisible et une preuve de navigateur dans un cookie `HttpOnly`, `Secure`, `SameSite=Lax`, puis redirige vers Google. Les preuves sont enregistrées sous forme d'empreintes dans `private.oauth_flows` et liées au professeur initiateur.
3. Demander l'accès hors ligne pour permettre les créations futures. Demander un consentement supplémentaire quand il est nécessaire d'obtenir ou rétablir un refresh token, pas à chaque publication.
4. Google redirige vers `google-oauth-callback`. Vérifier expiration, correspondance du `state`, preuve du navigateur et absence de consommation préalable ; traiter également un refus de consentement.
5. Échanger le code côté serveur. Vérifier l'identité Google avec une bibliothèque OIDC adaptée, notamment signature, émetteur, audience, expiration et `nonce`.
6. Enregistrer le compte, les scopes et les tokens chiffrés. Recontrôler que le professeur initiateur est encore actif.
7. Consommer le flux, effacer le cookie et rediriger vers une URL de l'application figurant dans une liste autorisée. Ne renvoyer ni token ni code sensible au frontend.

Les choix de ticket, cookies et stockage du flux sont des exigences de conception de Kon-fanan. Le flux d'autorisation serveur, l'accès hors ligne et les URI de redirection doivent suivre la documentation Google et être testés dans les navigateurs ciblés. Si PKCE est utilisé par la bibliothèque choisie pour ce client Google, le configurer avec S256 et conserver le vérificateur côté serveur. [OAuth pour application serveur](https://developers.google.com/identity/protocols/oauth2/web-server)

### 15.4 Conservation et renouvellement des tokens

Stocker le refresh token chiffré dans `private.google_connections`. Employer un chiffrement authentifié, par exemple AES-256-GCM avec nonce unique, version de clé et clé de chiffrement conservée dans les secrets serveur, séparément des données. Prévoir rotation et récupération sécurisée des clés ; une clé perdue rend les tokens illisibles.

Ne jamais écrire de token dans les logs, les tables exposées, les paramètres d'URL, le bundle React ou les notifications. Les sauvegardes doivent elles aussi protéger les secrets. Ces choix appliquent les recommandations de stockage sécurisé de Google. [Bonnes pratiques OAuth](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

Lorsqu'un access token expire, le backend le renouvelle. Préserver le refresh token existant si Google n'en fournit pas un nouveau. Sérialiser les renouvellements concurrents par connexion lorsque nécessaire. En cas de révocation ou `invalid_grant`, passer à `reconnect_required` et arrêter les tentatives automatiques inutiles.

Si la première connexion ne fournit aucun refresh token et qu'aucun token réutilisable n'existe, ne pas annoncer une connexion durable réussie : proposer de rétablir le consentement. Une reconnexion au même compte conserve la relation avec ses événements. Un changement de compte Google crée une nouvelle ligne de connexion ; ne jamais remplacer l'identité d'une connexion historique. Pour la V1, bloquer le changement tant que des séances futures ou jobs non résolus dépendent de l'ancien compte ; le professeur doit d'abord les annuler/régler ou reconnecter ce même compte. Ne jamais appliquer les identifiants des anciens événements au nouveau calendrier.

L'autorisation n'est pas garantie à vie. En mode OAuth externe « Testing », Google indique que les refresh tokens peuvent expirer après 7 jours, hors exception des seuls scopes d'identité de base ; l'intégration Calendar est concernée. [Expiration des refresh tokens](https://developers.google.com/identity/protocols/oauth2)

### 15.5 Création d'une séance : transaction locale et travail durable

1. Le frontend envoie `meetingId`, `expectedVersion` et une clé d'idempotence.
2. Le serveur vérifie professeur, affectation, compte Google, horaire et groupe.
3. Une transaction locale passe la séance à `publishing` et crée un job `create` avec sa révision cible. Le job existe avant tout appel Google.
4. Un worker acquiert le job avec un verrou à expiration et le traite. Le frontend n'a pas à rester ouvert.
5. Générer une seule fois l'identifiant Google de l'événement à partir du UUID de séance sans tirets ; conserver aussi un `conference_request_id` distinct.
6. Appeler `events.insert` sur `primary`, avec `conferenceDataVersion=1`, des horaires RFC3339 et `conferenceData.createRequest` utilisant `hangoutsMeet`.
7. Enregistrer l'identifiant/état retourné. Si la conférence n'est pas prête, planifier un contrôle ultérieur de **ce même événement**.
8. Quand le point d'entrée vidéo est valide, enregistrer le lien privé, passer la séance à `scheduled`, publier l'annonce et créer l'événement de notification dans une transaction.

Google peut retourner `pending` avant que la conférence soit prête ; les informations d'accès sont ensuite disponibles dans `conferenceData.entryPoints`. Une réponse d'insertion réussie ne garantit donc pas un lien immédiatement disponible. [Création et état d'une conférence](https://developers.google.com/workspace/calendar/api/guides/create-events)

Exemple de requête **illustrative**, à générer côté serveur avec de vraies valeurs validées :

```http
POST https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1
Authorization: Bearer <access_token_serveur>
Content-Type: application/json
```

```json
{
  "id": "3ab041c74b734706b9b929d48d0b537e",
  "summary": "Mathématiques — Révision des équations",
  "description": "Séance Kon-fanan. Retrouvez les informations dans votre espace.",
  "start": { "dateTime": "2026-11-10T17:00:00Z", "timeZone": "Africa/Casablanca" },
  "end": { "dateTime": "2026-11-10T18:00:00Z", "timeZone": "Africa/Casablanca" },
  "conferenceData": {
    "createRequest": {
      "requestId": "bce04337-7ac4-4943-8dfb-c175af0eb614",
      "conferenceSolutionKey": { "type": "hangoutsMeet" }
    }
  },
  "extendedProperties": {
    "private": { "konFananMeetingId": "3ab041c7-4b73-4706-b9b9-29d48d0b537e" }
  }
}
```

La V1 n'ajoute pas automatiquement les étudiants à `attendees` : l'annonce interne fournit l'accès et évite de transmettre leurs emails à chaque événement. Si des invitations Calendar sont ajoutées plus tard, leur confidentialité et leur comportement d'envoi doivent être spécifiés séparément.

### 15.6 Idempotence et erreurs

La clé d'idempotence est unique par acteur, type d'opération et ressource. La même clé avec le même contenu retourne l'opération existante ; la même clé avec un autre contenu produit un conflit. La contrainte d'unicité du job et le verrou de traitement protègent contre les doubles clics et plusieurs workers.

Google autorise un identifiant d'événement choisi par l'application avec un alphabet et une longueur définis ; un UUID hexadécimal sans tirets respecte cet alphabet. Cet identifiant stable sert à retrouver une création dont la réponse s'est perdue. [Référence de la ressource Event](https://developers.google.com/workspace/calendar/api/v3/reference/events)

| Situation | Comportement attendu |
|---|---|
| Double clic ou répétition réseau | Retourner le même meeting/job ; ne pas créer un second événement. |
| Timeout après insertion possible | Chercher l'événement avec son identifiant stable avant de réinsérer. |
| Conflit d'événement existant | Lire l'événement et vérifier sa propriété privée Kon-fanan ; ne pas adopter une ressource étrangère. |
| Conférence `pending` | Planifier une nouvelle lecture bornée, sans fabriquer de faux lien. |
| Conférence `failure` | Montrer une erreur récupérable ; une tentative explicite de régénération utilise une nouvelle requête de conférence sur le même événement. |
| Erreur 401 Google | Essayer un renouvellement une fois ; si impossible, demander une reconnexion. |
| Erreur 403 | Distinguer scope/politique du compte et quota ; ne pas réessayer indéfiniment une interdiction. |
| Erreur 429 ou 5xx | Backoff exponentiel avec aléa, bornes de tentatives et respect de `Retry-After` lorsqu'il existe. |
| Échec base après réussite Google | Reprise du job et réconciliation avec l'événement existant. |
| Compte suspendu/affectation retirée avant publication | Ne pas publier ; traiter l'événement créé comme une ressource à annuler/réconcilier. |

Ne pas garder une Edge Function en attente indéfiniment. Prévoir un worker planifié et une file de jobs persistante. Après un nombre borné d'échecs, conserver un état visible et une action de reprise. La création Google et la transaction PostgreSQL ne peuvent pas former une transaction atomique unique.

### 15.7 Modification, annulation et déconnexion

Une modification vérifie `expectedVersion`, incrémente la révision de la séance et crée un job d'update sérialisé. Mettre à jour le même événement, préserver les données de conférence et utiliser l'ETag lorsque pertinent. La nouvelle information n'est présentée comme synchronisée qu'après succès.

Une annulation retire immédiatement le bouton côté Kon-fanan, puis synchronise l'annulation Google. Une erreur Google reste visible au professeur. Les jobs vérifient la dernière révision : un ancien job de création ne doit jamais republier une séance annulée entre-temps. Prévoir la compensation d'un événement créé après une course entre annulation et création.

Déconnecter Google révoque l'autorisation quand possible et supprime les tokens locaux. Cette action ne supprime pas automatiquement tous les événements déjà créés. Expliquer que les séances futures ne pourront plus être synchronisées jusqu'à reconnexion. Ne pas modifier les événements personnels du professeur qui ne sont pas liés à Kon-fanan.

Les modifications effectuées directement dans Google Calendar ne sont pas synchronisées en temps réel dans la V1. Fournir une vérification manuelle d'une séance et une réconciliation périodique limitée aux séances futures connues. Si un événement est supprimé à l'extérieur, signaler le conflit ; ne pas le recréer silencieusement.

### 15.8 Ouverture d'une séance et limites de l'intégration

`meetings-join` vérifie à chaque appel compte actif, classe, matière, état et fenêtre de la séance, puis délivre uniquement une URL `https://meet.google.com/…` validée. Le navigateur l'ouvre avec isolation du nouvel onglet (`noopener`, et `noreferrer` selon le mécanisme retenu). Si une ouverture asynchrone est bloquée, présenter un lien cliquable explicite.

Kon-fanan contrôle l'accès au lien dans l'application. Le contrôle d'entrée dans la réunion, les possibilités d'accueil d'invités, la durée et les limites de participants dépendent du compte Google et des règles Meet applicables. Un lien déjà copié peut circuler ; retirer une matière ne révoque pas un lien Meet déjà connu. Ne pas promettre une salle inviolable ni un accès automatique de tout visiteur.

En cas d'indisponibilité réelle des identifiants Google pendant le développement, laisser l'intégration désactivée avec un message exact. Un mode de test simulé doit être explicitement marqué et limité au développement ; il ne valide pas l'intégration de production.

### 15.9 Quotas et coûts

La documentation Google consultée le 31 octobre 2026 indique des quotas actualisés au 1er mai 2026 et un seuil journalier de facturation ; elle indique également que les modalités détaillées de facturation seront précisées. Les projets plus anciens peuvent conserver des quotas antérieurs. Vérifier la console du projet et les conditions actuelles avant le lancement. Ne pas présenter l'API comme gratuite et illimitée. [Quotas Google Calendar](https://developers.google.com/workspace/calendar/api/guides/quota)

Prévoir des quotas applicatifs par professeur, une surveillance des erreurs et un budget séparé pour Supabase, stockage, trafic sortant, hébergement et emails. Ce document ne fixe aucun prix commercial ni abonnement Google requis universellement.

## 16. Contrats des opérations backend

### 16.1 Conventions d'interface

Définir les entrées et sorties en TypeScript/Zod. Les DTO utilisent `camelCase`, la base `snake_case`, et les valeurs d'état `snake_case`. Les UUID sont validés ; les dates sont au format ISO avec fuseau. Ne pas exposer directement toutes les colonnes d'une table dans chaque réponse.

Les opérations utilisateur tirent l'acteur du JWT validé. Les mutations acceptent `expectedVersion` lorsque la ressource est éditable et une clé d'idempotence pour les effets sensibles. Les clients affichent un conflit plutôt que d'écraser silencieusement une modification concurrente.

Les listes utilisent une pagination stable, par exemple curseur `(created_at, id)`, taille par défaut 20 et maximum 100. Les filtres et tris sont explicitement autorisés. Renvoyer `nextCursor` et `hasMore` ; éviter de promettre un comptage total coûteux à chaque appel.

### 16.2 RPC transactionnelles principales

Noms indicatifs à conserver cohérents dans l'implémentation :

| Opération | Entrée minimale | Contrôle et sortie |
|---|---|---|
| `request_admission` | Classe souhaitée, clé d'idempotence | Étudiant confirmé ; retourne demande en attente. |
| `decide_admission` | Demande, accept/refuse, classe finale, matières, message | Administrateur ; transaction capacité/inscription/droits ; retourne décision et inscription. |
| `set_subject_access` | Inscription, matière, active/revoked, motif | Administrateur ; même classe ; retourne droits à jour. |
| `transfer_student` | Inscription actuelle, classe cible, matières, version | Administrateur ; capacité et changement atomique ; retourne nouvelle inscription. |
| `assign_teacher` | Professeur, matière de classe, actif/inactif | Administrateur ; rôle/statut valides ; retourne espace. |
| `save_course` | Données autorisées, version si existant | Propriétaire pédagogique ; retourne cours brouillon/modifié. |
| `publish_course` | Cours, exercices initiaux, version | Contenu/vidéo/fichiers prêts, autorisations ; retourne cours publié. |
| `save_exercise` | Cours, consigne, paramètres, version | Responsable ; protège énoncé/barème déjà utilisés. |
| `start_submission_version` | Exercice ou compétition | Étudiant autorisé ; brouillon existant ou nouvelle version autorisée. |
| `submit_work` | Version, commentaire, fichiers prêts, clé d'idempotence | Droits/délai/propriété ; calcule les snapshots depuis l'énoncé/barème serveur, fige la version ; retourne preuve de remise. |
| `request_resubmission` | Copie, nouveau délai, commentaire | Professeur responsable ; retourne copie rouverte. |
| `save_evaluation` | Version de copie, commentaire, note, version | Responsable ; barème et cible ; retourne brouillon. |
| `publish_evaluation` | Évaluation, version | Responsable ; publication et notification atomiques pour un exercice. Pour une compétition, applique la retenue jusqu'à publication des résultats. |
| `publish_competition_results` | Compétition, version | Responsable ; clôture et corrections prêtes ; retourne date de publication. |
| `save_announcement` / `publish_announcement` | Espace, contenu, fichiers, version | Responsable ; annonce simple, ou publication de séance réservée au workflow Google. |
| `set_course_progress` | Cours, état | Étudiant concerné ; retourne progression. |
| `mark_notification_read` | Notification | Destinataire ; mise à jour `read_at` uniquement. |

Les modifications/suppressions de brouillons, archivages et opérations administratives restantes suivent les mêmes contrats et contrôles. Implémenter les fonctions de façon à ne pas ouvrir un contournement des workflows décrits.

### 16.3 Edge Functions

| Fonction | Authentification | Entrée / résultat |
|---|---|---|
| `teacher-invite` | JWT administrateur actif | Email et nom → invitation tracée ; aucune clé admin au navigateur. |
| `google-oauth-start` | JWT professeur actif | Intention de connexion → URL de lancement avec ticket court. |
| `google-oauth-redirect` | Ticket d'initiation unique | Pose la preuve navigateur et redirige Google. |
| `google-oauth-callback` | State + cookie/proof du flux | Code/refus Google → état de connexion puis redirection contrôlée. |
| `google-disconnect` | JWT professeur propriétaire | Déconnexion et révocation ; retourne état sans token. |
| `meetings-publish` | JWT professeur responsable | ID, version, idempotence → `202` et ID d'opération durable. |
| `meetings-update` | JWT professeur responsable | ID, modifications, version → opération de synchronisation. |
| `meetings-cancel` | JWT responsable ou administrateur | ID, version, motif → annulation locale et opération Google. |
| `meetings-join` | JWT utilisateur autorisé | ID séance → URL Meet validée ou refus. |
| `files-prepare` | JWT utilisateur autorisé | Type de cible, ID, métadonnées → réservation et chemin imposé. |
| `files-finalize` | JWT propriétaire autorisé | ID réservation → fichier validé ou erreur. |
| `files-read-url` | JWT lecteur autorisé | ID fichier → URL signée et expiration. |
| `integration-worker` | Identité de service vérifiée | Lot borné de jobs → bilan technique sans données sensibles. |

Conserver la vérification JWT de plateforme pour les fonctions utilisateur conformément à la configuration Supabase courante. Les callbacks OAuth et le worker nécessitent un mécanisme différent ; si `verify_jwt=false` est nécessaire pour eux, leur handler doit imposer leur propre authentification avant tout effet sensible. Une clé publishable seule n'identifie pas un utilisateur connecté. [Sécurisation des Edge Functions](https://supabase.com/docs/guides/functions/auth)

### 16.4 Réponses et erreurs

```typescript
type ApiSuccess<T> = { data: T; requestId: string };

type ApiError = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryable: boolean;
  };
  requestId: string;
};

type MeetingPublicationResult = {
  meetingId: string;
  operationId: string;
  status: 'publishing' | 'scheduled' | 'error';
};
```

| HTTP / code métier | Usage |
|---|---|
| 400 `INVALID_REQUEST` | Corps invalide ou paramètre manquant. |
| 401 `AUTH_REQUIRED` | Session absente ou invalide. |
| 403 `ACCESS_DENIED` / `ACCOUNT_SUSPENDED` | Identité valide mais action interdite. |
| 404 `RESOURCE_NOT_FOUND` | Ressource absente ou non révélable à l'appelant. |
| 409 `CLASS_FULL` / `VERSION_CONFLICT` / `ALREADY_ENROLLED` / `IDEMPOTENCY_CONFLICT` | Conflit métier ou concurrent. |
| 413 `FILE_TOO_LARGE` | Limite de fichier ou total dépassée. |
| 422 `VALIDATION_ERROR` / `DEADLINE_PASSED` / `GOOGLE_RECONNECT_REQUIRED` | Action comprise mais non réalisable en l'état. |
| 429 `RATE_LIMITED` | Trop de tentatives ; retour d'un délai approprié. |
| 502/503 `PROVIDER_UNAVAILABLE` | Échec externe temporaire ; ne pas prétendre à une publication réussie. |
| 500 `INTERNAL_ERROR` | Message public générique, détail technique corrélé dans les logs serveur. |

Les erreurs SQL des RPC sont normalisées par la couche d'accès frontend/backend vers ces codes ; ne pas exposer une trace SQL brute. Les réponses Google sont validées avant stockage et affichage.

## 17. Configuration et environnements

### 17.1 Variables frontend

```dotenv
# Valeurs publiques ; exemples sans identifiants réels
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=REPLACE_WITH_PUBLIC_KEY
VITE_APP_URL=https://APP_DOMAIN
```

Tout ce qui porte le préfixe `VITE_` peut être visible dans le bundle. La clé publishable est destinée aux composants publics ; les clés secrètes/`service_role` contournent RLS et doivent rester côté serveur. Les API keys et le JWT de session ont des fonctions différentes. [Clés API Supabase](https://supabase.com/docs/guides/getting-started/api-keys)

### 17.2 Secrets serveur

```dotenv
# Noms applicatifs proposés ; injecter via le gestionnaire de secrets
APP_BASE_URL=https://APP_DOMAIN
GOOGLE_CLIENT_ID=REPLACE_SERVER_SIDE
GOOGLE_CLIENT_SECRET=REPLACE_SERVER_SIDE
GOOGLE_OAUTH_REDIRECT_URI=https://PROJECT_REF.supabase.co/functions/v1/google-oauth-callback
GOOGLE_TOKEN_ENCRYPTION_KEY=REPLACE_SERVER_SIDE
GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION=v1
```

Utiliser aussi les variables Supabase serveur prévues par le runtime retenu, et une identité de service configurée pour le worker. Documenter leurs noms exacts lors de l'implémentation ; ne pas faire passer une clé publishable pour un JWT ni utiliser une clé secrète dans `Authorization: Bearer` comme si elle était une session utilisateur.

Prévoir des projets/environnements séparés pour développement, recette et production, chacun avec ses URLs de retour, buckets, secrets et données. Les données de test sont fictives. Ne pas recopier les comptes ou tokens de production dans le développement.

### 17.3 Configuration Supabase

- Confirmation d'email, politique de mot de passe et URLs de redirection Auth autorisées.
- Service d'envoi des emails Auth configuré et testé pour le lancement.
- Tables, contraintes, fonctions et politiques déployées par migrations.
- Buckets privés, limites de fichiers et politiques Storage testées.
- Schéma `private` exclu des schémas exposés et de Realtime.
- Fréquence du worker adaptée aux délais attendus ; possibilité d'une reprise manuelle contrôlée.
- Journaux corrélés, alertes sur jobs bloqués et sauvegardes adaptées à l'environnement.

### 17.4 Gestion du fuseau et de la langue

Toutes les opérations de délai utilisent l'heure serveur. Convertir les entrées locales avec une bibliothèque ou des API de fuseaux fiables ; ne pas parser une chaîne locale sans fuseau comme un instant universel.

Les textes de l'interface sont centralisés. Les champs de cours supportent Unicode et un sens de lecture adapté au contenu. Le futur design ne doit pas empêcher une interface arabe ou du texte mixte français/arabe.

## 18. Qualité, performance et accessibilité

Objectifs de projet proposés, à mesurer sur un environnement documenté :

- Parcours étudiant utilisable dès 360 px de largeur, sans défilement horizontal global.
- Formulaires accessibles au clavier, labels explicites et erreurs associées aux champs.
- Contrastes, focus visibles, annonces accessibles des succès/erreurs et respect de la réduction des animations.
- Images avec dimensions réservées ; chargement différé des lecteurs vidéo et documents lourds.
- Listes paginées, pas de téléchargement de toutes les copies pour filtrer dans React.
- Pour les lectures courantes, viser un temps serveur p95 inférieur à une seconde dans un test de recette défini ; séparer ce budget de la création externe d'un Meet.
- Aucun gel de l'écran pendant une opération longue : état persistant, reprise et retour précis.
- Aucun secret ni donnée d'un autre compte dans les logs navigateur, analytics ou rapports d'erreur.
- Détection d'erreurs réseau, session expirée, fichier refusé, conflit d'édition et accès retiré.

Un bouton « Cours terminé » exprime une déclaration de l'étudiant. Ne pas afficher une durée de visionnage, une assiduité Meet ou un taux de réussite prétendument mesurés sans mécanisme réel.

## 19. Tests et critères d'acceptation

### 19.1 Jeu de données de recette

Créer localement un administrateur, deux classes différentes, une classe presque pleine, deux matières, deux professeurs dans une même matière, un professeur d'une autre classe, un étudiant en attente, un étudiant suspendu et plusieurs étudiants actifs avec droits différents.

Inclure cours brouillon/publié/archivé, exercices avec et sans délai, copies avec plusieurs versions, corrections brouillon/publiée, compétition ouverte/fermée et séances en préparation/planifiée/annulée. Les comptes de test ne doivent pas utiliser des mots de passe de production ou être embarqués dans le frontend.

### 19.2 Scénarios fonctionnels et de sécurité obligatoires

| ID | Scénario | Résultat attendu |
|---|---|---|
| T01 | Inscription d'un étudiant | Email confirmé, compte pending, aucun contenu pédagogique lisible. |
| T02 | Étudiant en attente ouvre une URL de cours | Refus également à la Data API et au Storage. |
| T03 | Admin accepte avec math uniquement | Inscription active, math visible, philosophie absente et inaccessible. |
| T04 | Deux admissions en concurrence pour une dernière place | Une seule réussit ; aucune donnée partielle chez l'autre. |
| T05 | Étudiant falsifie role/status dans ses métadonnées ou requêtes | Aucun gain de privilège. |
| T06 | Professeur affecté publie un cours complet | Cours/exercices visibles seulement dans le bon périmètre. |
| T07 | Professeur non responsable modifie ce cours | Refus serveur, y compris en requête directe. |
| T08 | Deux professeurs de la même matière | Les étudiants autorisés voient les deux contenus ; chaque professeur reste limité à ses copies. |
| T09 | Copie avec photo valide | Téléversement, finalisation et remise ; professeur compétent notifié une seule fois. |
| T10 | MIME falsifié, fichier trop gros ou chemin d'un autre étudiant | Fichier refusé, aucune fuite ni écrasement. |
| T11 | Coupure réseau pendant l'envoi | Brouillon récupérable ; aucune fausse confirmation de remise. |
| T12 | Étudiant remplace un objet Storage après remise | Refus ; version soumise immuable. |
| T13 | Nouvelle version après demande du professeur | Ancienne conservée, nouvelle numérotée, corrections liées à la bonne version. |
| T14 | Étudiant interroge une correction en brouillon | Aucun commentaire ni note en brouillon retourné. |
| T15 | Publication de correction | Seul l'étudiant concerné peut voir sa correction ; notification unique. |
| T16 | Accès matière révoqué pendant une session | Nouvelles requêtes refusées ; URLs signées déjà émises expirent dans leur TTL documenté. |
| T17 | Compte suspendu avec JWT encore valide | Lecture/mutation pédagogique et génération de liens bloquées par état courant. |
| T18 | Compétition hors période ou résultats non publiés | Participation refusée hors délai, résultats cachés avant publication. |
| T19 | Classement activé | Seulement participants autorisés, pseudonymes, scores publiés et égalités correctes. |
| T20 | Callback OAuth falsifié, expiré ou rejoué | Refus sans modification de connexion Google. |
| T21 | Consentement Google refusé ou scope manquant | État explicite, aucune fausse connexion réussie. |
| T22 | Publication d'une séance avec conférence immédiate | Un événement, un lien valide, une annonce publiée et une notification par destinataire. |
| T23 | Réponse Google avec conférence pending | Annonce pas annoncée comme prête ; reprise jusqu'à succès ou erreur bornée. |
| T24 | Double clic, timeout après création ou crash avant écriture base | Un seul événement réconcilié ; pas de doublon. |
| T25 | Token expiré/révoqué et quota Google | Renouvellement ou reconnexion correcte ; backoff et état récupérable. |
| T26 | Annulation pendant un job de création | Aucune republication ; événement créé tardivement traité par compensation. |
| T27 | Modification/suppression extérieure du Calendar | Conflit signalé à la réconciliation ; aucune recréation silencieuse. |
| T28 | Étudiant sans accès tente de rejoindre | Aucun lien Meet retourné. |
| T29 | Déconnexion puis connexion d'un autre utilisateur | Aucun cache de la première identité affiché. |
| T30 | Lecture directe des tables privées ou d'une vue privilégiée | Tokens et jobs inaccessibles aux clients. |
| T31 | Dates autour d'un changement de décalage du fuseau | Même instant correctement affiché ; délais cohérents côté serveur. |
| T32 | Suppression/archivage d'un cours déjà utilisé | Copies et historique préservés selon les règles. |
| T33 | Renvoi d'une commande avec une clé réutilisée et un autre payload | Conflit explicite sans deuxième effet. |
| T34 | Navigation sur téléphone et clavier | Connexion, lecture, dépôt, correction et annonce réalisables. |

### 19.3 Types de vérification

- Tests SQL/RLS exécutés avec les identités anon, étudiant, professeur et administrateur, sans clé privilégiée pour simuler les clients.
- Tests d'intégration des transactions, capacités concurrentes et transitions immuables.
- Tests Storage vérifiant insertion, lecture, écrasement et suppression, pas seulement l'affichage des boutons.
- Tests de contrats Edge Functions et réponses Google simulées pour les pannes et reprises.
- Tests navigateur des parcours principaux sur mobile et ordinateur.
- Un essai réel de bout en bout avec un compte Google de recette pour confirmer OAuth, création, modification, annulation et ouverture de Meet.

Une intégration Google testée uniquement avec des mocks doit être déclarée non vérifiée en conditions réelles. Les vérifications de type, lint et build complètent les tests métier ; elles ne prouvent pas les droits d'accès.

## 20. Plan de réalisation

Chaque étape doit produire une partie fonctionnelle et vérifiable, avec les migrations correspondantes. Ne pas reporter la sécurité à la fin.

| Étape | Travail | Condition de passage |
|---|---|---|
| 1 — Fondations | Initialiser React/TS, configuration, routage, Supabase local/recette, documentation des choix. | Build reproductible, environnements séparés, aucun secret frontend. |
| 2 — Données et droits | Migrations, rôles, classes, autorisations, helpers, RLS et Storage. | Tests d'isolation réussis avec plusieurs identités. |
| 3 — Auth et administration | Inscription, invitation professeur, admissions, capacités, matières et affectations. | Parcours d'admission complet et test de concurrence réussi. |
| 4 — Cours et consultation | Cours, vidéo, documents, exercices, recherche et progression. | Un professeur publie et seuls les bons élèves accèdent au contenu. |
| 5 — Copies et correction | Préparation/finalisation fichiers, versions, commentaires, notes, notifications. | Un étudiant remet et reçoit une correction privée. |
| 6 — Concours et annonces | Compétitions manuelles, période, résultats, annonces simples. | Participation et publication respectent les droits et délais. |
| 7 — Meet | OAuth, secrets, jobs, création, réconciliation, modification, annulation. | Essai Google réel et tests de panne/idempotence réussis. |
| 8 — Design et finition | Appliquer DESIGN.md, responsive, accessibilité, textes et états. | Parcours mobile/clavier utilisables, aucun écran factice. |
| 9 — Mise en production | Configuration finale, monitoring, sauvegardes, procédures et recette. | Tous les critères de livraison satisfaits ou limites explicitement acceptées. |

Le design peut être fourni plus tôt et appliqué progressivement. Il ne doit pas changer les autorisations ou supprimer un état fonctionnel nécessaire sans mise à jour de ce cahier des charges.

## 21. Déploiement, maintenance et données

### 21.1 Avant lancement

- Déployer le frontend sur un hébergement compatible SPA avec réécriture des routes vers l'application.
- Configurer domaine, HTTPS, headers, redirections Auth et callback Google exacts.
- Appliquer les migrations testées, puis déployer fonctions et worker.
- Configurer secrets, limites, emails Auth, quotas et alertes sans données fictives visibles en production.
- Initialiser le premier administrateur via procédure serveur et préparer la récupération de son accès. Proposer MFA pour les administrateurs.
- Tester les trois rôles, un upload mobile et une séance Google réelle.
- Définir une procédure de retour arrière de l'application compatible avec les migrations. Une restauration de base ne doit pas être utilisée à l'aveugle sur de nouvelles écritures.

### 21.2 Suivi opérationnel

Surveiller erreurs d'authentification, refus anormaux, taux d'échec des uploads, jobs bloqués, comptes Google à reconnecter, erreurs de quota et volumes de stockage/egress. Corréler avec `requestId`, sans enregistrer tokens, mots de passe ou contenu complet des copies.

Prévoir une action de reprise administrateur pour les jobs en échec, avec audit, limites de tentatives et idempotence. Les opérations destructives affichent leurs conséquences précises dans l'interface.

### 21.3 Sauvegardes et conservation

Définir sauvegardes PostgreSQL, récupération des fichiers Storage et conservation séparée des secrets/chiffrements. Ne pas supposer qu'une sauvegarde de la base contient automatiquement les objets des buckets. Tester la restauration sur un environnement isolé.

Avant lancement, le propriétaire doit choisir et documenter la durée de conservation des copies, notes, journaux et comptes archivés. L'implémentation doit permettre export administratif ciblé, suppression encadrée et anonymisation selon cette politique. Les choix de conformité applicables au public et aux pays visés demandent une validation dédiée ; ce document ne prétend pas les certifier.

Limiter les données personnelles au nécessaire. Ne pas demander de CIN, adresse personnelle ou date de naissance complète pour les parcours décrits. Les profils, copies et notes des élèves ne sont pas publics. Prévoir des conditions d'utilisation et une information de confidentialité adaptées au fonctionnement réel avant ouverture au public.

## 22. Contenu attendu du futur DESIGN.md

Ce document visuel devra préciser :

- Logo, identité Kon-fanan, palette et usages des couleurs.
- Typographies compatibles avec les langues retenues.
- Navigation et composition de chaque espace, ordinateur et mobile.
- Composants partagés : boutons, champs, tableaux, cartes, filtres, modales, notifications.
- Lecteur de cours, lecture vidéo, dépôt de photos et espace de correction.
- Cartes de séances et états Google connecté, préparation, prêt, erreur et reconnexion.
- États chargement, vide, refus, erreur, validation et accès retiré.
- Focus, contrastes, tailles de cibles tactiles, textes longs et comportement RTL.
- Éventuelles animations et règles de réduction des mouvements.

La couche visuelle doit refléter les données réelles. Ne pas insérer de faux témoignages, effectifs, résultats ou pourcentages pour remplir une maquette destinée à la production.

## 23. Instruction de travail pour un développeur ou une IA

Le bloc suivant peut accompagner ce fichier lors du démarrage du développement :

> Développe l'application web Kon-fanan avec React, TypeScript et Supabase en suivant ce cahier des charges. Lis également DESIGN.md lorsqu'il est fourni. Respecte les besoins confirmés et utilise les choix proposés V1 comme base révisable, sans les présenter comme des faits validés par le propriétaire. Commence par inspecter le projet existant, puis implémente par étapes complètes : migrations, permissions, opérations métier, interface et tests adaptés. Conserve les secrets au backend. Ne remplace pas le backend réel par des données fictives et ne déclare pas Google Meet fonctionnel sans essai réel. Lorsque des identifiants externes manquent, termine tout ce qui est réalisable, documente précisément la configuration restante et conserve un état d'intégration explicite. Préserve la règle fondamentale classe + matière + rôle pour chaque lecture, écriture et fichier. Livre un projet lançable avec README, configuration d'exemple, migrations, procédures de déploiement et rapport de vérification.

## 24. Définition de « terminé »

- [ ] L'administrateur crée une classe, ses matières, ses professeurs et sa capacité.
- [ ] Il accepte un étudiant en choisissant ses matières, sans dépassement de capacité.
- [ ] L'étudiant voit uniquement les ressources de sa classe et de ses matières autorisées.
- [ ] Le professeur publie un cours, sa vidéo et ses exercices.
- [ ] L'étudiant remet des photos/PDF et le bon professeur reçoit la copie.
- [ ] La correction est privée, versionnée et visible seulement après publication.
- [ ] Les challenges/concours V1 fonctionnent avec des délais et résultats contrôlés.
- [ ] Les annonces respectent le périmètre de chaque groupe.
- [ ] Google OAuth fonctionne avec des tokens protégés et une reconnexion gérée.
- [ ] Une séance crée automatiquement un Meet unique et l'annonce devient accessible quand il est prêt.
- [ ] Modification, annulation et reprise après panne ne créent pas de doublons.
- [ ] Les fichiers restent privés et ne peuvent pas être remplacés après soumission.
- [ ] La révocation matière et la suspension sont appliquées côté serveur.
- [ ] Les tests d'isolation, transactions et parcours essentiels réussissent.
- [ ] Le frontend fonctionne sur mobile, au clavier et avec les états d'erreur prévus.
- [ ] Le projet peut être installé et déployé à partir de sa documentation.
- [ ] Les limitations restantes, coûts/configurations à confirmer et fonctions différées sont clairement décrits.

## 25. Références officielles vérifiées

Les liens suivants ont été consultés pour les comportements externes au 31 octobre 2026. Les règles métier, tables et parcours de Kon-fanan restent des propositions de conception propres à ce projet. Vérifier à nouveau les modalités dépendantes des fournisseurs au moment du développement et du lancement.

| Sujet | Documentation |
|---|---|
| Application React depuis zéro | [React](https://react.dev/learn/build-a-react-app-from-scratch) |
| Profils liés aux utilisateurs Auth | [Supabase User Management](https://supabase.com/docs/guides/auth/managing-user-data) |
| Clés publiques et secrètes | [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) |
| RLS | [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) |
| Fonctions PostgreSQL | [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) |
| Authentification des fonctions | [Supabase Edge Functions](https://supabase.com/docs/guides/functions/auth) |
| Buckets privés | [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) |
| Politiques fichiers | [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) |
| Consentement Google | [Google OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent) |
| OAuth serveur | [Google OAuth Web Server](https://developers.google.com/identity/protocols/oauth2/web-server) |
| Cycle de vie des tokens | [Google OAuth overview](https://developers.google.com/identity/protocols/oauth2) |
| Sécurité des tokens | [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) |
| Création Calendar et conférence | [Google Calendar Create Events](https://developers.google.com/workspace/calendar/api/guides/create-events) |
| Paramètres d'insertion | [Google Calendar events.insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert) |
| Champs et identifiants Event | [Google Calendar Event resource](https://developers.google.com/workspace/calendar/api/v3/reference/events) |
| Quotas et facturation | [Google Calendar Usage Limits](https://developers.google.com/workspace/calendar/api/guides/quota) |
