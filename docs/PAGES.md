# Catalogue des pages

Les pages reprennent les objectifs et compositions des références U01–U06, A01–A14, P01–P17, E01–E13 et C01–C03. Les variantes mobiles utilisent les mêmes routes, avec réorganisation responsive.

## Public et compte

- `/`
- `/auth/callback`
- `/admission`
- `/compte-suspendu`
- `/confidentialite`
- `/conditions`
- `/connexion`
- `/inscription`
- `/mot-de-passe-oublie`
- `/nouveau-mot-de-passe`

## Administrateur

- `/admin`
- `/admin/admissions`
- `/admin/admissions/:id`
- `/admin/classes`
- `/admin/classes/nouvelle`
- `/admin/classes/:id`
- `/admin/classes/:id/modifier`
- `/admin/etudiants`
- `/admin/etudiants/:id`
- `/admin/professeurs`
- `/admin/professeurs/:id`
- `/admin/referentiels`
- `/admin/contenus`
- `/admin/integrations`
- `/admin/audit`

## Professeur

- `/prof`
- `/prof/groupes`
- `/prof/groupes/:id`
- `/prof/cours`
- `/prof/cours/nouveau`
- `/prof/cours/:id`
- `/prof/cours/:courseId/exercices/:exerciseId`
- `/prof/copies`
- `/prof/copies/:id`
- `/prof/competitions`
- `/prof/competitions/nouvelle`
- `/prof/competitions/:id`
- `/prof/competitions/:id/modifier`
- `/prof/competitions/:id/participations`
- `/prof/annonces`
- `/prof/annonces/nouvelle`
- `/prof/annonces/:id/modifier`
- `/prof/seances`
- `/prof/seances/nouvelle`
- `/prof/seances/:id`
- `/prof/seances/:id/modifier`
- `/prof/integrations/google`

## Étudiant

- `/etudiant`
- `/etudiant/matieres`
- `/etudiant/matieres/:id`
- `/etudiant/cours/:id`
- `/etudiant/exercices/:id`
- `/etudiant/mes-travaux`
- `/etudiant/mes-travaux/:id`
- `/etudiant/competitions`
- `/etudiant/competitions/:id`
- `/etudiant/competitions/:id/resultats`
- `/etudiant/annonces`
- `/etudiant/seances`
- `/etudiant/seances/:id`

## Commun

- `/notifications`
- `/profil`
- `/403`

Les vues de refus/attente/absence d’accès sont des états de ces routes. Les routes privées inconnues conservent le shell du rôle et présentent une page introuvable.

Les listes ont recherche/filtres et pagination ; les formulaires disposent d’une validation, d’un verrou pendant la sauvegarde, d’un message d’erreur récupérable et d’un retour de succès. Les commandes sensibles et les conséquences des suspensions, retraits et annulations sont explicites.
