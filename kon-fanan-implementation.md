# Plan d'implémentation Kon-fanan

Sources lues : cahier des charges complet, briefing visuel et catalogue complet des écrans, image de landing. La demande du 31 octobre 2026 remplace les surfaces crème des espaces connectés par du verre sombre.

## Livraison
1. React, TypeScript strict, Vite, React Router, composants et CSS mobile-first.
2. Mode démonstration explicite et isolé ; mode Supabase sans repli silencieux vers des données fictives.
3. Landing ; connexion, inscription, callback, récupération, admission, suspension ; notifications et profil.
4. Admin : tableau de bord, admissions et décision, classes et détail/création, étudiants et droits, professeurs et affectations, référentiels, contenus, intégrations, audit.
5. Professeur : tableau de bord, groupes, cours et exercices, copies/correction, compétitions/participations, annonces, séances, Google.
6. Étudiant : tableau de bord, matières, cours, remise, travaux/corrections, compétitions/résultats, annonces et séances.
7. PostgreSQL : schéma, RLS, commandes transactionnelles, quotas et Storage privé ; Edge Functions fichiers, invitations, OAuth et Calendar/jobs.
8. Vérifications TypeScript/build, permissions SQL et parcours navigateur aux largeurs 360, 390, 768, 1024, 1440 ; captures ; README et rapport honnête des limites.

## Répartition selon app-builder
- Agent base de données : migrations, seed, RPC, RLS et tests SQL.
- Agent intégrations : Edge Functions et configuration/documentation serveur, en coordination avec la base.
- Interface, données React et vérifications : agent principal ; spécialiste interface admin après définition des contrats.

## Contrat commun
Tables et colonnes snake_case du cahier des charges. Lecture via Supabase avec JWT/RLS. Mutations sensibles via RPC. Le mode démo applique les mêmes règles d'interface mais ne constitue pas une garantie de sécurité. Aucun identifiant Google inventé. Aucun secret côté client. Les actions et compteurs sont dérivés des données, y compris en démonstration.

Le plan sera complété par docs/VERIFICATION.md avec les résultats réellement exécutés.

## État de livraison — 1 novembre 2026

Interface et backend écrits. Build et TypeScript validés, 5 tests unitaires, 68 contrôles PostgreSQL/RLS, 8 tests Edge et 7 scénarios navigateur distincts réussis (suite complète puis reprise ciblée). Captures desktop/mobile enregistrées. Le détail des configurations absentes, limites de volume et essais réels restant à exécuter figure dans docs/VERIFICATION.md.
