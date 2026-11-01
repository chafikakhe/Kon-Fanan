# Découverte publique et packs

## Parcours livré

Le bouton « Commencer » ouvre `/decouvrir` : niveaux actifs, matières associées aux classes actives, puis cours publiés de leurs professeurs actifs. `/decouvrir/cours/:id` expose le contenu et la vidéo du cours ainsi que les titres des exercices. Les consignes, pièces jointes privées et liens live ne font pas partie du catalogue public. Les listes de cours sont paginées par 24.

Le clic sur un exercice vérifie les droits actuels côté serveur. Un accès historique valide ou un pack actif couvrant sa matière et son niveau permet de l’ouvrir. Sinon, `/packs` conserve le niveau, la matière, le cours et l’exercice dans l’URL. La matière est présélectionnée et peut être retirée ; un avertissement indique alors que l’exercice initial restera protégé.

| Pack   | Matières distinctes au choix | Prix total |
| ------ | ---------------------------: | ---------: |
| Pack 1 |                            1 |     100 DH |
| Pack 2 |                            2 |     180 DH |
| Pack 3 |                            3 |     270 DH |

Les packs incluent les cours, exercices et lives des matières sélectionnées à ce niveau. Aucun abonnement, renouvellement, échéance ou durée d’accès n’a été ajouté. Un niveau sans assez de matières rend les packs correspondants indisponibles. Les séances sont celles du système Meet existant ; aucun nouveau système de visioconférence n’est créé.

## Achat et règlement

Aucun prestataire de paiement n’existait dans le projet. Le mode livré est **demande avec vérification administrative du règlement**. L’interface l’annonce avant envoi et après enregistrement. Elle n’affiche jamais un paiement réussi à partir d’un clic ou d’une URL.

1. Choix du pack, nombre exact de matières et récapitulatif du prix total.
2. Connexion ou inscription Supabase, avec confirmation d’email. L’inscription depuis les packs ne nécessite pas de classe choisie à l’avance. Le retour validé vers `/packs` est conservé localement et inclus dans l’URL de confirmation.
3. Envoi explicite de la demande authentifiée : le serveur recalcule le prix depuis l’offre et valide les matières et leur niveau. Statut `pending_review`, aucun droit nouveau.
4. L’étudiant contacte l’administration avec la référence affichée pour connaître les modalités de règlement hors application.
5. `/admin/packs` exige une référence vérifiable et une confirmation de contrôle du montant avant activation. Seul un administrateur actif peut appeler la RPC de validation. Activation, audit et notification sont atomiques ; un compte étudiant en attente est activé à cette étape. Un compte suspendu, archivé ou rejeté n’est pas réactivé par ce mécanisme.
6. L’étudiant actualise le statut pour reprendre son exercice ou ouvrir ses matières. Les packs et demandes apparaissent dans l’espace étudiant et sur l’écran d’admission en attente.

L’administration peut suspendre les nouvelles demandes d’une offre, refuser une demande ou révoquer un pack actif. Une révocation conserve l’historique et les autorisations attribuées séparément. En démonstration, seules des demandes en attente peuvent être enregistrées ; la validation d’un règlement est désactivée.

**À connecter pour un paiement en ligne :** prestataire choisi par le propriétaire, création de session côté serveur avec montant/devise calculés en base, webhook signé vérifiant commande/montant/devise et idempotence des événements, procédures de remboursement et rapprochement. Aucun webhook ou secret de paiement fictif n’est fourni. Une page de retour du prestataire devra seulement relire le statut serveur.

## Migration et droits

`0005_discovery_packs.sql` ajoute `pack_offers`, `pack_orders`, leurs index et RLS, deux projections privées pour le catalogue et quatre RPC :

- `discovery_catalog` : lecture publique bornée, sans accès anonyme aux tables privées/protégées.
- `request_pack_order` : étudiant avec email confirmé, compte pending/active, sélection exacte et distincte, prix serveur, clé d’idempotence liée au contenu de la commande.
- `review_pack_order` : administrateur actif, transitions contrôlées, référence de règlement obligatoire pour activer, audit et notification.
- `set_pack_availability` : administrateur actif ; la suspension de vente ne révoque pas les achats déjà actifs.

`has_subject_access` conserve les droits d’inscription existants et ajoute les commandes `active` pour le même niveau et les seules matières achetées. Les politiques RLS des exercices, remises, documents, annonces et séances réutilisent cette source. `get_meeting_join_url` continue de vérifier les droits et la fenêtre d’ouverture ; le lien reste dans `private`. Les profils nécessaires à la correction et les notifications aux étudiants avec pack sont intégrés au système existant.

Les fonctions sensibles ont un `search_path` vide et des permissions EXECUTE explicites, conformément aux [règles Supabase pour les fonctions](https://supabase.com/docs/guides/database/functions) et à la [documentation RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Les commandes conservent le nom du pack, le prix total, la devise et la sélection au moment de la demande. Aucun compte, cours ou exercice fictif n’est inséré par la migration. La relation niveau/matières reste gérée via Classes et Référentiels ; les professeurs publient leurs contenus dans les écrans existants.

## Déploiement et retour arrière

Migration additive, sans suppression ni réécriture des données existantes. Déployer la migration avant le frontend, car celui-ci charge les nouvelles tables. Les interfaces précédentes restent compatibles avec les autorisations historiques ; la fonction commune de droits sait aussi reconnaître les nouveaux packs.

```sh
npm run test:sql
npx supabase db push --linked --dry-run
npx supabase db push --linked --yes
npm run build
```

Avant publication, autoriser l’URL Auth `/auth/callback` et ses paramètres de retour sur le domaine réel. Le code valide l’origine et limite la destination à `/packs`. Ne pas modifier les secrets Google pour cette évolution.

Pour interrompre les nouvelles ventes, suspendre les trois offres dans `/admin/packs`. Pour revenir à l’ancienne interface, restaurer le frontend précédent **en conservant la migration, les commandes et les fonctions de droits** : les achats actifs continuent ainsi de fonctionner et les droits historiques restent inchangés. Ne pas supprimer les tables de commandes ni restaurer l’ancienne version de `has_subject_access`, ce qui retirerait des droits achetés. Toute suppression définitive nécessite un plan séparé de conservation et de remboursement.

Les index couvrent les lectures par étudiant/statut/niveau et la file des demandes en attente. Suivre les demandes anciennes en attente, les références de règlement et l’audit administratif. Aucune planification d’expiration n’est nécessaire puisqu’aucune durée n’a été définie.
