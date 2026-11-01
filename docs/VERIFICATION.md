# Rapport de vérification — 1 novembre 2026

## Résultats exécutés

| Vérification | Résultat |
|---|---|
| TypeScript frontend strict | Réussi : `npm run typecheck` |
| Build de production Vite | Réussi : `npm run build` |
| Tests unitaires | 5 réussis : vidéo sûre, quotas, fuseau Casablanca, isolation des données de démonstration |
| Migrations et permissions PostgreSQL/PGlite | 131 vérifications réussies |
| TypeScript Deno / Edge | Les 16 handlers et les helpers passent `npm run check:edge` |
| Tests Edge | 10 réussis |
| Playwright | Suite complète : 15 scénarios réussis en 3,4 minutes, incluant la création d’exercice avec PDF ; puis vérifications ciblées après les derniers ajustements |
| Responsive | 46 routes connectées × 360, 390, 768, 1024 et 1440 px ; landing aux mêmes largeurs |
| Débordement horizontal | Aucun débordement global sur ces contrôles ; titre de hero contrôlé également |
| Accessibilité automatique | Aucun échec axe WCAG 2 A/AA sur landing, connexion et accueil étudiant testés |
| Captures | 17 captures dans `screenshots/`, dont les packs et la nouvelle typographie sur ordinateur et téléphone |

Exécution locale : macOS arm64, Node.js 26, Chromium headless via Playwright. L’accessibilité automatique complète les contrôles de clavier/focus ; elle ne certifie pas tous les écrans ni tous les critères WCAG.

## Parcours navigateur vérifiés

- Connexion de démonstration et navigation distincte pour chaque rôle.
- Admission impossible sans matière, acceptation, consultation du profil et retrait d’accès avec confirmation.
- Dépôt mobile d’un fichier, commentaire, remise immuable et ouverture de la copie.
- Envoi interrompu simulé : aucune fausse confirmation, conservation des fichiers validés, retrait et nouvelle remise possibles.
- Brouillon de correction invisible à l’étudiant, puis correction visible après publication.
- Refus de navigation vers le rôle admin depuis un compte étudiant ; menu mobile et accès à la seule matière autorisée.
- Création de classe ; création de cours avec contenu/vidéo, exercice associé et publication visible par l’étudiant autorisé.
- Découverte sans compte : niveau, matière, contenu du cours, exercice, packs ; matière présélectionnée modifiable, compteur et nombre exact, récapitulatif du prix total, inscription sans classe imposée, reprise complète après connexion et demande en attente sans faux paiement.
- Changement de niveau, pack impossible désactivé, accès direct anonyme à un exercice orienté vers les packs et séance orientée vers la connexion. Nouvelles pages à 360, 390, 768 et 1440 px sans débordement ; analyse axe WCAG 2 A/AA sans échec sur la sélection de pack.
- Lecteur vidéo visible dès l’ouverture ; PDF de quatre pages en livre sous la vidéo, double page, pagination, zoom, affichage agrandi/Échap, clavier, adaptation mobile et accès étudiant. Analyse axe WCAG 2 A/AA sans échec sur le lecteur testé.
- Élargissement du cours et déplacement des exercices sous le contenu : build et cinq scénarios navigateur ciblés réussis. Le test vérifie la largeur du lecteur public et l’ordre visuel des exercices dans les deux parcours.
- PDF sélectionné dès la création d’exercice, consigne textuelle facultative avec PDF, validation avant publication, document ouvert par l’étudiant autorisé, visiteur orienté vers les packs, envoi interrompu puis repris sans doublon, formats invalides refusés et affichage mobile. Le scénario d’ouverture vérifie le contenu PDF du lien émis ; il ne prétend pas contrôler le lecteur natif de tous les navigateurs.
- Nouvelle fonte Archivo Black : contrôle des limites du titre et de l’absence de débordement à 360, 390, 768, 1024 et 1440 px, avec captures ordinateur/téléphone.
- Navbar à quatre liens sur une même ligne, fond transparent : positions et absence de débordement vérifiées à 320, 360, 390, 768 et 1440 px, destinations À propos/Packs/Connexion contrôlées. Le contrôle axe existant des écrans principaux réussit après ce changement.

Ces parcours navigateur utilisent la démonstration isolée. Les règles de production sont vérifiées séparément dans PostgreSQL, pas déduites de l’interface.

## Permissions et transitions SQL vérifiées

Les migrations sont exécutées dans PostgreSQL WASM/PGlite. Les tests simulent les clients avec les rôles PostgreSQL et `auth.uid()`, sans utiliser le rôle de service pour leurs lectures/mutations normales.

Couverture : inscription forcée étudiant/pending malgré métadonnées falsifiées ; permissions d’administration ; matière de la bonne classe ; admission répétée et capacité ; absence d’activation partielle ; publication cours/exercice ; deux professeurs de la même matière ; copie du seul professeur responsable ; quotas/réservation Storage ; refus des chemins arbitraires et des remplacements ; snapshots et versions ; corrections brouillon/publiées ; révocation/suspension ; résultats de compétition retenus jusqu’à publication ; classement sous pseudonymes ; schéma privé et annuaire email protégés ; jobs de séance idempotents ; événement stable ; fenêtre de lien ; annulation pendant création ; ticket/state/preuve navigateur à usage unique ; profil sans élévation de rôle.

Les tables Auth et Storage sont représentées par un schéma de test. Le test de capacité vérifie une dernière place puis un refus sans modification partielle ; **la concurrence avec deux connexions PostgreSQL réelles reste à exécuter** sur Supabase. Le verrou SQL et l’unicité sont implémentés, mais PGlite mono-connexion ne prouve pas le comportement simultané en production.

Le bootstrap administrateur est aussi testé : identité absente sans effet, activation du seul compte ciblé, conservation de son profil et absence de doublon d’audit lors d’une réexécution.

Les packs sont testés avec les fonctions et rôles PostgreSQL réels dans PGlite : sélection exacte/distincte et compatible avec le niveau, prix serveur, trois offres, email confirmé, idempotence et conflit, isolation des commandes, absence d’accès en attente/refus, impossibilité d’auto-validation, référence obligatoire, activation administrative atomique, matières/niveaux isolés, profils et notifications des nouveaux étudiants, lives contrôlés, révocation, suspension et conservation des droits historiques. Les scénarios navigateur utilisent la démo ; ils n’attestent pas d’un règlement réel. Le catalogue et les refus anonymes ont également été contrôlés sur Supabase hébergé : voir [DEPLOYMENT.md](DEPLOYMENT.md).

## Tests Edge exécutés

Le partage des PDF ajoute neuf contrôles SQL : métadonnées publiques sans chemin, signature réservée au serveur, seuls fichiers attachés à un cours public, refus des PDF d’exercice et de substitution, retrait après archivage. Un contrôle Edge vérifie l’origine LAN autorisée pour ce seul endpoint public, avec maintien du refus sur les endpoints privés. Le vrai cours LOGIQUE et son PDF de 17 pages ont été ouverts dans Chromium : vidéo visible, deux pages rendues sur ordinateur, une sur téléphone, sans débordement ni erreur JavaScript. La lecture vidéo complète n’a pas été lancée.

- AES-GCM : IV distincts, déchiffrement et refus d’altération.
- Domaine Meet exact et identité d’événement.
- MIME falsifié et image corrompue refusés.
- Reconstruction PDF avec retrait des actions/annotations.
- Réponses HTTP publiques sans détail interne et contrôle d’origine.
- Image WebP réelle décodée/réencodée.
- Conférence `pending` reprise sur le même événement, avec un seul insert dans le scénario simulé.
- JPEG/PNG acceptés, métadonnées EXIF supprimées.

Le test positif d’image a détecté une limite de liste ImageMagick trop restrictive ; elle a été corrigée et retestée. Un problème de contexte React pendant le remplacement à chaud a été corrigé en séparant le contexte du provider ; la suite complète a ensuite été relancée avec les sources stabilisées.

## Performance et rendu

Photographies locales WebP : environ 640 Ko au total ; hero environ 157 Ko, fond bibliothèque environ 322 Ko. Les polices latines sont locales. Les domaines de pages sont chargés par chunks React ; les lecteurs vidéo ne sont créés qu’au clic. Le flou est appliqué aux panneaux principaux, les surfaces internes utilisent un fond translucide simple. Un fond plus opaque remplace le flou si nécessaire.

Les listes font des lectures API bornées à 100 lignes avec chargement volontaire de pages suivantes et affichage local de huit lignes. Les totaux administratifs et les effectifs de classes utilisent une projection SQL pour ne pas être limités au premier lot.

**Limite de volume actuelle :** les filtres/recherches de l’interface portent sur les éléments déjà chargés. Les relations sont elles aussi chargées progressivement ; un lien direct vers une ressource hors des lots initiaux peut nécessiter un chargement supplémentaire. Pour un catalogue important, ajouter la recherche filtrée/cursorisée et l’hydratation ciblée des détails côté serveur. La recette de performance p95 et un jeu de charge à grande échelle n’ont pas été exécutés.

## Configuration et validations restantes

Lors de la recette initiale, aucun projet Supabase, SMTP, secret Google ou compte Google de recette n’avait été fourni. **La base et les 15 fonctions ont depuis été déployées sur le projet fourni : voir [DEPLOYMENT.md](DEPLOYMENT.md).** Les essais de services réels suivants restent distincts du déploiement :

1. Déploiement des migrations et fonctions sur Supabase hébergé : effectué, vérifié par l’historique distant et l’état ACTIVE des fonctions.
2. Emails de confirmation, récupération et invitation professeur.
3. Téléversement Storage distant, URL signées et reprise sur réseau mobile réel.
4. Consentement OAuth Google, création/modification/annulation d’un événement Calendar et ouverture d’un vrai Meet.
5. Quotas, renouvellement/révocation réels des tokens, configuration et supervision du worker planifié.
6. Essai caméra sur de vrais appareils iOS/Android et vérification Safari/Firefox.
7. Test de concurrence multi-connexion et charge p95.

`docs/SETUP.md` précise les paramètres et procédures. Sans identifiants, l’intégration Google reste désactivée et ne produit aucun faux lien. L’authentification réelle ne réussit pas artificiellement dans la démo.

## Limites produit à finaliser avant ouverture publique

- Interface V1 en français ; les contenus Unicode/arabes et leur direction sont pris en charge, mais la traduction complète de l’interface n’est pas livrée.
- Les mentions légales et de confidentialité sont une information de prélancement : exploitant, contact, durées de conservation, export/anonymisation et procédures de restauration restent à arrêter.
- Pas de vidéo privée hébergée, messagerie ou correction automatique. Le paiement en ligne reste à connecter ; les demandes de packs avec vérification administrative du règlement sont livrées.
- La clé de chiffrement accepte une version active ; une rotation nécessite une migration contrôlée des connexions.
- La déconnexion Google retire toujours les tokens locaux et tente la révocation distante ; un échec fournisseur reste possible.

Le code est lançable et les parcours locaux sont vérifiés. Ce rapport ne constitue ni une recette Google réelle ni une autorisation automatique de mise en production.
