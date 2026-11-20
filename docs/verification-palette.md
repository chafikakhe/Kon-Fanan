# Vérification de la palette — 16 novembre 2026

La palette est centralisée dans `src/theme.css`. Les composants utilisent ces
tokens dans `src/styles.css` : verre blanc à 88 %, lecture à 92 %, flou de 16 px,
ombres bleutées discrètes et surfaces intérieures opaques. Aucun mode sombre
distinct n'existait. Les formules décoratives du tableau de bord sont ignorées
par les lecteurs d'écran ; les textes et fonctions restent identiques.

Vérifications effectuées sur Chromium, avec les données de démonstration :

- Compilation TypeScript/Vite et 5 tests unitaires réussis.
- 16 tests navigateur réussis, dont le contrôle des
  pages à 360, 390, 768, 1024 et 1440 px, sans débordement horizontal.
- Les 2 tests de dépôt fixent désormais leur horloge au 1er novembre 2026,
  avant l'échéance du jeu de démonstration. Un nouveau test fixe l'horloge après
  l'échéance et vérifie le refus, la conservation du fichier et l'accessibilité
  de l'erreur. La logique métier reste inchangée.
- 131 vérifications PostgreSQL/RLS, 10 tests Edge et le contrôle de types des
  fonctions Edge réussis. Les services externes réels ne sont pas couverts.
- Playwright démarre sa propre instance de démo, avec les variables Supabase
  neutralisées pour ce processus, sans modification de `.env`.
- Audit axe WCAG A/AA : aucune violation détectée sur 19 pages à 390 et 1440 px,
  ainsi que sur la modale de confirmation des accès.
- Contraste sur captures des fonds réellement composés : 1 230 fragments de
  texte échantillonnés sur l'accueil, les packs et les trois tableaux de bord,
  à plusieurs positions de défilement. Aucun échec après correction ; minimum
  mesuré d'environ 4,50:1. Ce contrôle complète les zones laissées indéterminées
  par axe et ne constitue pas une certification exhaustive.
- Focus des champs inspecté ; repli opaque simulé avec flou désactivé et règles
  de remplacement appliquées : surfaces blanches opaques, y compris sur mobile.
- Captures actualisées dans `screenshots/`, dont `theme-modal-mobile.png`.
- Formatage Prettier et `git diff --check` réussis.

Limites : Safari/Firefox, anciens navigateurs sans flou et parcours Supabase
réels non testés. Vite conserve son avertissement sur les bundles dépassant
500 ko ; il n'empêche pas la compilation.
