# motafawiq.ma

Le logo fourni est conservé sans modification dans `assets/branding/logo-source.png` (PNG RGBA, 1312 × 1199). Ses couleurs, sa transparence et les proportions de chaque élément sont conservées.

`npm run brand:assets` régénère les ressources avec Sharp, déjà présent dans les dépendances de développement :

- `public/branding/logo.png` : composition verticale d’origine, marges transparentes réduites, utilisée dans le footer public.
- `public/branding/logo-horizontal.png` : symbole et signature du logo fourni, disposés horizontalement pour les en-têtes et la navigation.
- `public/branding/symbol.png` : symbole transparent pour les emplacements compacts.
- Favicons PNG 16/32/48 px et `public/favicon.ico` multirésolution.
- Icône Apple 180 px, icônes d’application 192/512 px et icône maskable 512 px référencées par `public/site.webmanifest`.

Le composant `Logo` partage ces ressources entre les écrans. Les images utilisent leur ratio naturel, sans filtre de couleur, sur un support transparent qui laisse apparaître le fond de la page. Les icônes système ont un fond blanc et la version maskable réserve une marge de sécurité. Le manifeste ne fournit pas de cache hors connexion.

Les anciens pictogrammes soleil/livre et le favicon SVG sont retirés. Les anciennes maquettes et les cahiers des charges restent des archives référencées ; ils ne sont pas distribués dans l’application.

Les identifiants techniques existants sont conservés : nom du paquet npm et du projet Supabase, clés `kf-*`, IndexedDB `kon-fanan-demo-files`, marqueur Auth `kon_fanan_teacher`, triggers/policies SQL et propriétés privées des événements Google `konFanan*`.

## Vidéo d’accueil

L’original fourni est conservé sans modification dans `assets/branding/Students_celebrating_graduation_…_09a5f4b9.mp4`, hors du dossier public pour éviter sa publication. SHA-256 : `d399337e7d6acbda8eb3a9fdb3ecd711dbc24cba9a861975d5bb9d5f4ac5f3b6`. Le fichier réel est un paysage 1280 × 720 à 24 images/s, de 7,93 secondes. Aucun filigrane Flow visible n’a été trouvé à l’inspection des images et des angles ; aucun recadrage destructif n’est donc appliqué.

`node scripts/generate-hero-assets.mjs` nécessite FFmpeg et utilise Sharp, déjà installé, pour générer :

- `public/branding/hero-graduation.mp4` : H.264 High, 1280 × 720, 24 images/s, sans piste audio, `yuv420p`, métadonnées retirées et `faststart`. Compression directement depuis l’original en un seul export (CRF 23, débit maximal 1 800 kbit/s).
- `public/branding/hero-graduation-poster.webp` : affiche légère du logo présenté sur le téléphone à 5,5 secondes.

Tailles : original 2 875 709 octets ; MP4 optimisé 1 533 668 octets (réduction de 46,67 %) ; affiche WebP 31 570 octets.

`HeroBackground` affiche l’image immédiatement. La source vidéo n’est montée qu’après vérification de `prefers-reduced-motion`, `prefers-reduced-data` et `navigator.connection.saveData` quand le navigateur les expose. Aucune source vidéo ni précharge MP4 n’est fournie en mode économie. La vidéo tourne automatiquement en boucle, sans bouton de contrôle. La lecture est suspendue lorsque l’onglet est masqué.

Le fond reste fixe sur tout l’écran pendant le défilement (`position: fixed`, `inset: 0`). `object-fit: cover` remplit le viewport sans bandes, avec un centrage adapté sur mobile. Ce mode plein écran recadre les côtés de la vidéo paysage sur les écrans étroits. Le voile blanc est à 65 % d’opacité pour conserver la lisibilité du contenu tout en laissant la vidéo visible. Le hero réserve au moins une hauteur d’écran (`100svh`) et les médias fixes ne déplacent pas le contenu pendant leur chargement.

## Mise en service

Publier le nouveau build frontend et redéployer les fonctions Edge modifiées pour actualiser les messages OAuth, les descriptions Calendar et les métadonnées des nouveaux PDF normalisés. Les PDF et événements déjà créés ne sont pas réécrits.

Le changement visuel ne configure pas le domaine. Si `motafawiq.ma` devient le domaine de production, configurer le DNS et l’hébergement, puis mettre à jour les URL Supabase Auth, `VITE_APP_URL`, `APP_BASE_URL`, `APP_ALLOWED_ORIGINS` et les redirections Google nécessaires selon [SETUP.md](SETUP.md). Mettre également à jour le nom/logo de l’écran de consentement Google et les modèles d’email Supabase dans leurs consoles respectives. Les domaines, secrets et comptes distants ne sont pas modifiés par cette livraison.
