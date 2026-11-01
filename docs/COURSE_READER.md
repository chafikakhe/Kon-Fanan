# Vidéo et livre PDF du cours

Les pages publiques `/decouvrir/cours/:id` et le lecteur étudiant `/etudiant/cours/:id` affichent le lecteur vidéo directement, sans bouton préalable et sans lecture automatique. Le PDF est présenté juste en dessous, puis vient le texte du cours. La lecture occupe toute la largeur disponible ; la page publique utilise toute la largeur de l’écran avec des marges adaptées. « À toi de pratiquer » et les exercices suivent le cours, avec les mêmes règles d’accès.

Le composant commun `CourseVideo` utilise les vidéos YouTube/Vimeo déjà configurées par le professeur. `CourseBook` retrouve les PDF attachés dans « Documents de cours ». Plusieurs documents proposent un sélecteur. Sans fichier, un état vide explique au professeur où l’ajouter ; aucun document fictif n’est créé en production.

Le lecteur `PdfBook` utilise [PDF.js](https://mozilla.github.io/pdf.js/examples/), chargé seulement lorsqu’un PDF est disponible. Il affiche deux pages quand l’espace le permet, une page sur téléphone, des boutons précédent/suivant, un accès direct à une page, le zoom et un affichage agrandi avec fermeture par Échap et focus retenu dans le lecteur. Le PDF original peut aussi être ouvert séparément. Seules les pages visibles sont rendues en canvas, avec une résolution bornée pour les téléphones ; les rendus obsolètes et le worker sont annulés à la fermeture. Les actions/annotations interactives du PDF ne sont pas exécutées par le lecteur.

Le worker PDF.js, les fontes, les CMaps et les codecs sont servis par l’application, sans CDN. `scripts/copy-pdf-assets.mjs` les prépare après `npm install`/`npm ci`, avant `dev` et avant `build`. Un marqueur de version et un verrou empêchent deux démarrages simultanés de réécrire les mêmes fichiers. `public/pdfjs/` est généré et ignoré par Git ; les ressources et leurs licences sont copiées dans `dist` par Vite. Node.js ≥ 22.13 est requis par PDF.js.

## Accès public limité aux PDF de cours publiés

La demande de découverte sans compte inclut désormais la lecture des PDF attachés aux cours publiés. La migration `0006_public_course_documents.sql` ajoute deux fonctions :

- `discovery_course_documents(course_id)` retourne uniquement les métadonnées des PDF prêts, attachés à ce cours dans `course_resources`, dont la cible est bien le même cours, dans `course-materials`, et dont le cours est actuellement présent dans le catalogue public. Aucun chemin Storage dans cette projection.
- `public_course_document(course_id,file_id)` n’est exécutable que par `service_role`. Elle refait tous les contrôles et retourne au serveur le chemin nécessaire à la signature. Un PDF d’exercice, une copie, une cible différente, un fichier non validé ou un cours non public est refusé.

L’Edge Function `course-document-url` est une lecture publique (`verify_jwt=false`). Elle prend les deux UUID, utilise cette fonction serveur, puis émet une URL signée de 300 secondes. Le bucket reste privé. L’option CORS publique n’est utilisée que sur cet endpoint de lecture ; elle permet aussi la consultation depuis une adresse LAN de développement. Les endpoints d’écriture et de fichiers protégés gardent leur vérification d’origine et de session. La page étudiante peut utiliser le même accès public pour un cours publié ; les documents autorisés hors catalogue continuent d’utiliser le lecteur de fichiers authentifié existant.

L’archivage du cours empêche de nouvelles signatures. Une URL déjà émise fonctionne jusqu’à son expiration ; un PDF déjà téléchargé ne peut pas être rappelé. Le bouton d’actualisation redemande une URL et recharge le livre.

## Déploiement

La migration doit précéder le frontend. Déployer ensuite uniquement la nouvelle fonction :

```sh
npx supabase db push --linked --yes
npx supabase functions deploy course-document-url --project-ref YOUR_PROJECT_REF --use-api
npm run build
```

Aucun secret nouveau, aucune modification des exercices, aucun remplacement du PDF existant et aucune configuration de visioconférence ne sont nécessaires. Pour retirer la lecture publique, désactiver la fonction et publier un lecteur limité aux comptes autorisés ; conserver les fichiers et leurs associations.

## Vérifications

- PDF de test de quatre pages : affichage, double page, navigation, sélection d’une page, zoom, agrandissement, Échap, adaptation mobile et lecture étudiante ; contrôle axe WCAG 2 A/AA.
- PostgreSQL : PDF de cours public, projection sans chemin, signature réservée au serveur, refus des fichiers d’exercice et de substitution, retrait après archivage.
- Edge : CORS LAN de la lecture publique, refus conservé sur les endpoints privés.
- Sur Supabase hébergé : vrai PDF du cours LOGIQUE servi et reconnu `%PDF-`, signature courte, fichier arbitraire refusé. Le navigateur a aussi été utilisé pour vérifier le rendu du document réel.
