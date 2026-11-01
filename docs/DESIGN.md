# Design implémenté

Les documents de référence sont `KON-FANAN_STITCH_LIRE_EN_PREMIER.md`, le catalogue complet `KON-FANAN_STITCH_PROMPTS_PAGE_PAR_PAGE.md`, les fichiers `stitch-prompts/` et l’image `KON-FANAN_LANDING_PAGE_CONCEPT.png`.

La demande actuelle prime sur les anciens panneaux crème des espaces connectés. Aucune image de référence supplémentaire de glassmorphism n’a été trouvée parmi les pièces disponibles ; les valeurs et les indications écrites ont donc servi de référence du matériau.

## Landing

Fond crème `#F7F5EC`, vert forêt `#153E32`, menthe `#AFE3C8`, photographies larges et Manrope pour le texte. Les titres de landing utilisent désormais Archivo Black, une fonte large et épaisse aux lettres rapprochées, inspirée du nouveau visuel fourni. Les textes et la palette existants sont conservés. Barlow Condensed reste utilisée ailleurs dans l’application. Les sections suivent la référence : hero, présentation, matières, méthode, défis, étapes et CTA. Aucun témoignage, effectif marketing ou pourcentage de réussite inventé.

La navbar suit aussi le nouveau visuel : quatre liens noirs en capitales monospaces, répartis régulièrement en haut du hero, sans bande de fond ni boutons. Les destinations sont adaptées à l’application : À propos, Les cours, Les packs et Connexion. Les quatre liens restent visibles et utilisables au clavier et sur téléphone, avec des cibles de 44 px de hauteur. Un voile clair progressif en haut de la photo maintient la lisibilité.

## Espaces connectés

Photographie plein écran avec voile sombre. Panneaux `rgba(28,27,26,.40)`, bordures blanches fines, flou réel 24 px, rayons 20–24 px. Cartes internes très transparentes, texte ivoire, accents menthe et orange limités. Les leçons et les formulaires utilisent une surface plus opaque pour garder le contraste. Le CSS prévoit un fond de remplacement si `backdrop-filter` est absent.

Les pages ont des compositions distinctes : tableau administratif et dossier d’admission, bibliothèque et éditeur de cours, lecteur/vidéo/exercices, énoncé/remise, visionneuse/correction, calendrier et séance. L’état Google n’est jamais représenté comme connecté dans la démonstration.

## Téléphone

Navigation basse et menu latéral accessible, colonnes empilées, tableaux présentés en cartes, champs à 16 px, boutons de 44 px minimum et modales bornées au viewport. La correction utilise des onglets Copie/Correction. Le dépôt présente la galerie et la capture photo du navigateur, les aperçus et les actions dans l’ordre de la tâche. Aucun contenu de fin de page n’est masqué par la navigation fixe.

Le menu mobile retient le focus, se ferme avec Échap et rend sa navigation inerte lorsqu’il est fermé. Les animations sont supprimées avec `prefers-reduced-motion`.

## Ressources

Les photographies ont été téléchargées depuis Unsplash puis converties localement en WebP. Elles sont illustratives et ne représentent pas les utilisateurs de Kon-fanan. Aucun appel Unsplash n’est nécessaire à l’exécution.

| Fichier | Source |
|---|---|
| `hero.webp` | https://images.unsplash.com/photo-1523240795612-9a054b0db644 |
| `library.webp` | https://images.unsplash.com/photo-1507842217343-583bb7270b66 |
| `together.webp` | https://images.unsplash.com/photo-1522071820081-009f0129c71c |
| `study.webp` | https://images.unsplash.com/photo-1434030216411-0b793f4b4173 |
| `video.webp` | https://images.unsplash.com/photo-1516321318423-f06f85e504b3 |
| `books.webp` | https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8 |

Polices : paquets Fontsource locaux. Icônes : Lucide. Les couvertures de cours sont composées en CSS/SVG à partir de notions mathématiques ; elles ne prétendent pas être des miniatures de vidéos réelles.
