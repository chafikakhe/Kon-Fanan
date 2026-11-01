# Kon-fanan — Prompts Stitch, écran par écran

Version 1.0 · 31 octobre 2026.

**But :** obtenir des maquettes UI précises, page par page, avec une landing éditoriale et trois espaces photographiques en glassmorphism. Ce document contient **54 prompts desktop et 5 prompts mobile**, auxquels s'ajoutent des variantes explicitement séparées. Les intitulés et données d'exemple restent des propositions de design cohérentes avec le cahier des charges.

## Comment les utiliser

1. Joindre [l'image de landing de référence](KON-FANAN_LANDING_PAGE_CONCEPT.png).
2. Copier le briefing D00 ci-dessous, puis **un seul** prompt de page, par exemple A01. Chaque bloc de page rappelle aussi ses contraintes essentielles.
3. Demander uniquement l'écran principal. Ne pas demander toutes les pages, variantes et versions mobile ensemble.
4. Une fois l'écran choisi, le garder comme référence visuelle pour les autres pages du même espace. Si possible, joindre cette maquette aux demandes suivantes.
5. Produire les autres pages une par une. Après les desktop, demander les variantes nécessaires, puis les mobile M01–M05.
6. Si le résultat ne respecte pas le glassmorphism ou mélange les rôles, utiliser le prompt de correction à la fin de ce document en indiquant l'ID de la page.

**Ordre proposé :** A01 → P01 → E01 pour établir le cadre des trois espaces ; puis les autres écrans d'un rôle à la suite. L01 sert à reprendre la landing lorsque nécessaire. Les états alternatifs d'une même route ne sont pas des écrans à empiler dans une seule planche.

**À demander à cette étape :** des écrans UI haute fidélité avec des interactions identifiées. La connexion Supabase, les API et le code de production relèvent de l'implémentation ultérieure. Un dessin de bouton ne prouve pas que son intégration fonctionne.

## D00 — Briefing visuel commun

Copier ce bloc avant le premier écran. Il fixe le cadre ; le prompt de page qui suit fixe le contenu exact.

```text
PROJET : Kon-fanan, plateforme éducative pour le collège et le lycée.
MISSION : concevoir l'écran précis demandé ensuite. Une seule page complète par demande. Les écrans des trois rôles doivent rester distincts.

L'image jointe définit la marque : crème #F6F4E9, vert forêt #153E32, menthe #AFE3C8, jaune #FFD633 et orange #EF522A. Landing éditoriale avec grandes photos et titres condensés. Les espaces connectés utilisent cette marque dans une interface photographique en glassmorphism.

GLASSMORPHISM À RESPECTER :
- Une vraie photo calme couvre tout le viewport, avec un voile vert sombre.
- La photo reste visible dans les marges, entre les cartes et doucement à travers le verre.
- Sidebar sombre translucide, topbar et panneaux glass crème translucides.
- Flou de 24 px, bordure blanche fine, ombre légère et coins de 20 px.
- Texte vert forêt sur cartes claires, texte ivoire sur sidebar.
- Les documents, textes longs et tableaux ont un fond assez opaque pour être lus confortablement.
- Les cartes de verre sont des surfaces de travail structurées ; pas des bulles décoratives dispersées.

DESKTOP 1440 PX :
marges 20 px ; sidebar 232 px ; espace de 20 px ; contenu 1148 px.
Sidebar et topbar gardent la même géométrie d'une page à l'autre.
Manrope pour l'application : titres 28–32 px, corps 15–16 px.
Barlow Condensed ExtraBold pour les grandes accroches de landing.
Un bouton principal menthe identifiable par tâche.
Icônes linéaires simples, espacements réguliers et hiérarchie nette.

ADMIN : gérer classes, professeurs, admissions et accès matière.
PROF : publier contenus, corriger copies, annoncer séances.
ÉTUDIANT : consulter ses matières, travailler et envoyer ses copies.
Chaque rôle possède sa propre navigation et ses propres actions.

Les nombres et personnes d'exemple sont des données de démonstration.
Interface en français, avec les accents corrects et des libellés concrets.
Le prochain prompt décrit UNE page : rends seulement cette page.
```

## Catalogue des écrans desktop

| ID | Espace | Page |
|---|---|---|
| L01 | public | [Landing page](#l01) |
| U01 | auth | [Connexion](#u01) |
| U02 | auth | [Inscription étudiant](#u02) |
| U03 | auth | [Mot de passe oublié](#u03) |
| U04 | auth | [Nouveau mot de passe](#u04) |
| U05 | auth | [Admission en attente](#u05) |
| U06 | auth | [Compte suspendu](#u06) |
| A01 | admin | [Tableau de bord administrateur](#a01) |
| A02 | admin | [Liste des demandes d'admission](#a02) |
| A03 | admin | [Examiner et accepter une admission](#a03) |
| A04 | admin | [Liste des classes](#a04) |
| A05 | admin | [Créer une classe](#a05) |
| A06 | admin | [Détail d'une classe](#a06) |
| A07 | admin | [Liste des étudiants](#a07) |
| A08 | admin | [Profil étudiant et autorisations](#a08) |
| A09 | admin | [Liste des professeurs et invitation](#a09) |
| A10 | admin | [Détail d'un professeur et affectations](#a10) |
| A11 | admin | [Référentiels et paramètres](#a11) |
| A12 | admin | [Gestion des contenus](#a12) |
| A13 | admin | [Suivi des intégrations](#a13) |
| A14 | admin | [Journal des actions](#a14) |
| P01 | prof | [Tableau de bord professeur](#p01) |
| P02 | prof | [Liste des groupes pédagogiques](#p02) |
| P03 | prof | [Détail d'un groupe](#p03) |
| P04 | prof | [Bibliothèque des cours du professeur](#p04) |
| P05 | prof | [Éditeur d'un cours](#p05) |
| P06 | prof | [Créer ou modifier un exercice](#p06) |
| P07 | prof | [Liste des copies à corriger](#p07) |
| P08 | prof | [Lecture et correction d'une copie](#p08) |
| P09 | prof | [Liste des challenges et concours](#p09) |
| P10 | prof | [Éditeur de compétition](#p10) |
| P11 | prof | [Participations et publication des résultats](#p11) |
| P12 | prof | [Liste des annonces](#p12) |
| P13 | prof | [Rédiger une annonce simple](#p13) |
| P14 | prof | [Liste et agenda des séances](#p14) |
| P15 | prof | [Planifier une séance Google Meet](#p15) |
| P16 | prof | [Détail d'une séance](#p16) |
| P17 | prof | [Connexion Google du professeur](#p17) |
| E01 | etudiant | [Tableau de bord étudiant](#e01) |
| E02 | etudiant | [Mes matières autorisées](#e02) |
| E03 | etudiant | [Cours d'une matière](#e03) |
| E04 | etudiant | [Lecture d'un cours](#e04) |
| E05 | etudiant | [Faire un exercice et déposer sa copie](#e05) |
| E06 | etudiant | [Historique de mes travaux](#e06) |
| E07 | etudiant | [Consulter ma correction](#e07) |
| E08 | etudiant | [Liste des challenges et concours](#e08) |
| E09 | etudiant | [Détail et participation à une compétition](#e09) |
| E10 | etudiant | [Résultats d'une compétition](#e10) |
| E11 | etudiant | [Fil des annonces](#e11) |
| E12 | etudiant | [Liste des séances](#e12) |
| E13 | etudiant | [Détail d'une séance et accès Meet](#e13) |
| C01 | commun | [Notifications personnelles](#c01) |
| C02 | commun | [Profil et paramètres personnels](#c02) |
| C03 | commun | [Accès indisponible et page introuvable](#c03) |

## Landing publique

<a id="l01"></a>

### L01 — Landing page

Route indicative : `/`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN L01 — « Landing page » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

RÉFÉRENCE : l'image de landing Kon-fanan jointe. Reprendre son rythme éditorial, son fond crème, ses grandes photos et ses titres condensés. Pour cette page publique, garder les sections crème, plutôt que le shell glass des dashboards.
FORMAT : une seule page desktop 1440 px de large, environ 4000 px de haut, scroll vertical.
ORDRE EXACT :
1. Header 80 px : logo à gauche ; Les cours, La méthode, Concours au centre ; Se connecter et bouton menthe S'inscrire à droite.
2. Hero photo d'étudiants marocains travaillant ensemble, hauteur environ 650 px. Voile vert. Titre blanc énorme « APPRENDS. COMPRENDS. RÉUSSIS. », sous-titre « Du collège au lycée, avance à ton rythme. », bouton Découvrir les cours. Deux petits stickers livre/soleil.
3. Section 50/50 : texte « TON AVENIR COMMENCE ICI. » à gauche, photo de soutien scolaire arrondie à droite.
4. Matières : titre centré, quatre icônes Mathématiques, Physique-chimie, Français, Philosophie.
5. Trois cartes photographiques sous « LA MÉTHODE KON-FANAN » : Comprendre en vidéo, S'entraîner à son rythme, Avancer avec son prof.
6. Bande vert forêt « RELÈVE LE DÉFI. », fond de fines courbes et montage de photos.
7. Trois étapes : Crée ton compte, Retrouve tes matières, Apprends et pratique.
8. Grand CTA photographique « PRÊT À FAIRE LE DÉCLIC ? », bouton Créer mon compte.
9. Footer crème simple.
Ne pas inclure de statistiques, témoignages ou coordonnées inventés. Produire la landing complète uniquement.

SORTIE ATTENDUE : une maquette nette de cet écran L01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Connexion et admission

<a id="u01"></a>

### U01 — Connexion

Route indicative : `/connexion`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U01 — « Connexion » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : photo plein écran de bibliothèque calme. À gauche, zone éditoriale de 55 % avec logo Kon-fanan en haut et titre blanc « HEUREUX DE TE RETROUVER. ». À droite, panneau glass crème de 440 px, centré verticalement. Aucun menu latéral.
PANNEAU : titre « Se connecter », sous-texte « Retrouve ton espace Kon-fanan ». Champs Email, Mot de passe avec bouton afficher/masquer ; lien Mot de passe oublié ? ; bouton principal pleine largeur Se connecter ; séparateur discret ; texte Pas encore de compte ? Créer un compte. Labels au-dessus des champs.
UX : ne pas demander à l'utilisateur de choisir admin/prof/étudiant, le rôle dépend du compte. Sous le bouton, montrer un message d'erreur exemple discret pour identifiants incorrects dans une variante séparée.
CONTRAINTES : formulaire compact et lisible ; aucune statistique, aucun cours et aucun dashboard sur cette page.

SORTIE ATTENDUE : une maquette nette de cet écran U01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="u02"></a>

### U02 — Inscription étudiant

Route indicative : `/inscription`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U02 — « Inscription étudiant » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : même photo et même disposition que la connexion, pour créer une continuité. Texte gauche « TON PARCOURS COMMENCE ICI. ». Panneau glass à droite de 480 px ; légère hauteur supplémentaire avec scroll si nécessaire.
FORMULAIRE : titre Créer mon compte ; champs Nom complet, Adresse email, Mot de passe, Confirmer le mot de passe et Classe souhaitée. Dans la liste classe, afficher « 3ème collège A — 2026–2027 » comme exemple. Indicateur simple des exigences de mot de passe sous le champ. Case d'acceptation des conditions ; bouton Créer mon compte ; lien Déjà inscrit ? Se connecter.
ENCART D'INFORMATION : « Ton inscription sera validée par l'administration. Tes matières seront attribuées après acceptation. »
VARIANTE À DESSINER ENSUITE : confirmation « Vérifie ton adresse email », email masqué, Renvoyer le lien avec délai, Modifier mon adresse.
Ne pas proposer la création libre d'un compte professeur ou administrateur.

SORTIE ATTENDUE : une maquette nette de cet écran U02, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="u03"></a>

### U03 — Mot de passe oublié

Route indicative : `/mot-de-passe-oublie`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U03 — « Mot de passe oublié » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : même univers photo + glass, panneau centré de 460 px, logo au-dessus, retour Se connecter en haut à gauche. Aucun menu de dashboard.
CONTENU : petite icône clé, titre Mot de passe oublié ?, explication en deux lignes. Un champ Adresse email. Bouton pleine largeur Envoyer le lien. Lien Retour à la connexion.
VARIANTE SÉPARÉE APRÈS L'ÉCRAN PRINCIPAL : confirmation avec icône enveloppe et message « Si un compte correspond à cette adresse, un email de récupération a été envoyé. » ; bouton Retour à la connexion.
Le formulaire ne doit pas révéler si une adresse possède un compte. Garder beaucoup d'espace autour du panneau.

SORTIE ATTENDUE : une maquette nette de cet écran U03, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="u04"></a>

### U04 — Nouveau mot de passe

Route indicative : `/nouveau-mot-de-passe`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U04 — « Nouveau mot de passe » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : panneau glass centré de 460 px sur la photo de bibliothèque voilée, logo Kon-fanan.
CONTENU : titre Définir un nouveau mot de passe ; champs Nouveau mot de passe et Confirmer le mot de passe ; icônes afficher/masquer ; critères courts visibles ; bouton Enregistrer mon mot de passe.
ÉTAT PRINCIPAL : formulaire prêt à remplir.
ÉTATS À GÉNÉRER COMME VARIANTES INDÉPENDANTES : succès avec bouton Se connecter ; lien expiré avec bouton Demander un nouveau lien. Aucun dashboard, aucune sidebar et aucun autre formulaire dans ce même écran.

SORTIE ATTENDUE : une maquette nette de cet écran U04, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="u05"></a>

### U05 — Admission en attente

Route indicative : `/admission`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U05 — « Admission en attente » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : photo de campus calme, panneau glass central de 640 px, petit header avec logo et menu du compte. Aucun menu pédagogique.
CONTENU : badge En attente, titre « Ton inscription est en cours de validation ». Carte récapitulative : Salma El Idrissi ; classe souhaitée 3ème collège A ; année 2026–2027 ; date de demande. Timeline verticale de trois étapes : Email confirmé avec coche ; Demande envoyée avec coche ; Validation de l'administration en cours.
Sous la timeline : message « Tes cours et tes matières apparaîtront ici après validation. »
ACTIONS : Actualiser mon statut ; Modifier ma demande en secondaire ; Se déconnecter en lien discret.
VARIANTE U05B séparée : demande refusée, message administratif neutre et retour au profil. Ne jamais afficher de cours, liste de professeurs ou résultats avant acceptation.

SORTIE ATTENDUE : une maquette nette de cet écran U05, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="u06"></a>

### U06 — Compte suspendu

Route indicative : `/compte-suspendu`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN U06 — « Compte suspendu » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

DIRECTION VISUELLE : photographie éducative réelle en plein fond, voile vert forêt #153E32 à environ 55 %, panneau crème translucide rgba(246,244,233,0.90), flou 24 px, bordure blanche fine et coins 24 px. Le verre laisse apparaître doucement la photo. Bouton principal #AFE3C8 avec texte #153E32. Texte courant Manrope 16 px ; titres lisibles et condensés uniquement dans la zone éditoriale. Desktop 1440×1080. Retrouver la palette et le logo de la landing jointe ; une seule composition, sans cadre d'ordinateur.

COMPOSITION : même cadre photo/glass que l'attente, panneau central 600 px et header minimal. Ton calme, sans grande alarme rouge.
CONTENU : icône accès interrompu, badge Accès suspendu, titre « Ton accès est temporairement suspendu ». Explication « Contacte l'administration pour connaître les prochaines étapes. » Nom et classe de Salma, sans détails internes de modération.
ACTIONS : Consulter mon profil et Se déconnecter. Un contact administratif peut être indiqué uniquement sous forme de lien configuré, jamais de faux téléphone ou email.
Ne montrer ni matières, ni liens Meet, ni contenu pédagogique derrière le panneau.

SORTIE ATTENDUE : une maquette nette de cet écran U06, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Espace administrateur

<a id="a01"></a>

### A01 — Tableau de bord administrateur

Route indicative : `/admin`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A01 — « Tableau de bord administrateur » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Vue d'ensemble.
HEADER : « Vue d'ensemble », sous-titre Année scolaire 2026–2027 ; sélecteur d'année et bouton menthe Créer une classe.
LIGNE 1 : quatre cartes glass compactes et de même largeur : 128 Étudiants actifs ; 6 Professeurs ; 4 Classes ; 8 Demandes en attente. Données de démonstration, pas de pourcentages décoratifs.
LIGNE 2 : grille 65/35. À gauche tableau Demandes récentes : Étudiant, Classe souhaitée, Date, bouton Examiner. Exemples Salma El Idrissi, Adam Bennani, Lina Alaoui. À droite panneau Actions rapides : Inviter un professeur, Ajouter une matière, Gérer les accès.
LIGNE 3 : panneau Classes et effectifs : 3ème collège A 37/50 ; 2ème collège B 44/50 ; 1ère lycée A 47/50 ; 3ème lycée B 0/30, avec barres fines de capacité. Panneau secondaire « À vérifier » avec une connexion Google à rétablir.
Mettre en avant les admissions, pas un graphique financier. Garder le fond photo visible dans les gouttières.

SORTIE ATTENDUE : une maquette nette de cet écran A01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a02"></a>

### A02 — Liste des demandes d'admission

Route indicative : `/admin/admissions`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A02 — « Liste des demandes d'admission » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Admissions, badge 8.
HEADER : « Demandes d'admission », sous-texte Acceptez les étudiants et attribuez leurs matières.
PANNEAU PRINCIPAL : onglets En attente (8), Acceptées, Refusées ; recherche par nom ; filtres Classe et Date.
TABLEAU : case de sélection visuelle facultative mais aucune acceptation groupée ; colonnes Étudiant avec initiales, Classe souhaitée, Date de demande, Statut, Action Examiner. Lignes aérées de 64 px, au moins six exemples cohérents.
COLONNE LATÉRALE ÉTROITE : encart « Avant d'accepter » : vérifier la classe, choisir les matières, contrôler les places disponibles.
ACTION : Examiner ouvre le détail A03 ; ne pas accepter directement sans sélection des matières.
ÉTATS : badge jaune En attente, pagination en bas ; état vide et filtre sans résultat comme variantes séparées. Aucun formulaire d'admission ouvert dans l'écran principal.

SORTIE ATTENDUE : une maquette nette de cet écran A02, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a03"></a>

### A03 — Examiner et accepter une admission

Route indicative : `/admin/admissions/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A03 — « Examiner et accepter une admission » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Admissions. Fil d'Ariane Admissions / Salma El Idrissi. Retour aux demandes.
HEADER : « Examiner la demande », badge En attente.
GRILLE 35/65 : panneau gauche Informations de l'étudiante : initiales SE, nom Salma El Idrissi, email de démonstration salma@example.test, email confirmé, date et classe souhaitée.
PANNEAU DROIT : titre Attribution des accès ; sélecteur Classe finale avec 3ème collège A ; indicateur Places disponibles 13 sur 50 ; liste de matières avec cases à cocher Mathématiques sélectionné, Français non sélectionné, Physique-chimie non sélectionné. Une ligne indique « 1 matière sélectionnée ».
RÉCAPITULATIF menthe : « Salma rejoindra la classe 3ème collège A avec l'accès aux mathématiques. » Champ Message à l'étudiante facultatif.
BARRE D'ACTION : Refuser en secondaire ; Accepter l'inscription en primaire. Bouton Accepter désactivé si aucune matière choisie.
VARIANTES séparées : classe complète avec bouton bloqué ; confirmation d'acceptation ; modale Refuser avec motif public. Aucun choix de philosophie dans cette classe d'exemple.

SORTIE ATTENDUE : une maquette nette de cet écran A03, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a04"></a>

### A04 — Liste des classes

Route indicative : `/admin/classes`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A04 — « Liste des classes » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Classes.
HEADER : « Classes », sous-titre 4 classes pour 2026–2027 ; bouton Créer une classe.
FILTRES : Année scolaire, Niveau, Statut ; recherche par nom.
CONTENU : quatre cartes glass en grille 2×2. Chaque carte montre nom, niveau, année, effectif réel/capacité, barre d'occupation, nombre de matières et avatars réduits des professeurs. Exemple principal 3ème collège A, 37/50 étudiants, 3 matières, 2 professeurs. Carte classe vide avec 0/30 et message Aucun étudiant inscrit.
ACTIONS PAR CARTE : Ouvrir la classe et menu Modifier / Archiver. Une carte classe presque pleine utilise un indicateur jaune subtil.
Ne pas confondre capacité maximale et nombre d'étudiants. Éviter les grandes photos dans chaque carte ; la photographie appartient au fond de page.

SORTIE ATTENDUE : une maquette nette de cet écran A04, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a05"></a>

### A05 — Créer une classe

Route indicative : `/admin/classes/nouvelle`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A05 — « Créer une classe » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Classes. Fil d'Ariane Classes / Nouvelle classe.
HEADER : « Créer une classe ».
GRILLE 65/35 : grand formulaire glass à gauche ; aperçu de la future carte de classe à droite.
FORMULAIRE en trois groupes :
1. Informations générales : Nom de la classe, Niveau, Année scolaire.
2. Capacité : Nombre maximum d'étudiants, valeur exemple 50 ; aide « L'effectif réel sera calculé à partir des inscriptions acceptées. »
3. Matières proposées : cases Mathématiques, Français, Physique-chimie, avec recherche si liste longue.
Aperçu : 3ème collège A, année 2026–2027, 0/50, matières sélectionnées.
BARRE BASSE : Annuler et Créer la classe. Ne pas demander de saisir les 50 noms d'étudiants. L'affectation des professeurs pourra se faire depuis le détail de classe après création.
VARIANTE : validation sur nom manquant ou capacité invalide.

SORTIE ATTENDUE : une maquette nette de cet écran A05, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a06"></a>

### A06 — Détail d'une classe

Route indicative : `/admin/classes/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A06 — « Détail d'une classe » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Classes. Fil d'Ariane Classes / 3ème collège A.
HEADER : « 3ème collège A », sous-texte Collège · 2026–2027 ; boutons Modifier et menu Archiver.
BANDEAU : 37/50 étudiants ; 3 matières ; 2 professeurs ; 13 places disponibles.
ONGLETS : Étudiants, Matières et professeurs, Informations.
ÉCRAN PRINCIPAL : onglet Étudiants avec recherche et tableau Nom, Statut, Matières autorisées, Date d'inscription, Voir le profil. Salma affiche uniquement le badge Mathématiques.
VARIANTE A06B, écran séparé du même cadre : onglet Matières et professeurs avec trois lignes matière. Ligne Mathématiques : Youssef Amrani et Nadia Berrada comme professeurs affectés ; bouton Affecter un professeur ; retirer une affectation via menu confirmé.
VARIANTE A06C : modale Affecter un professeur, sélection matière et professeur, résumé et confirmation. Un seul onglet actif par écran généré.

SORTIE ATTENDUE : une maquette nette de cet écran A06, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a07"></a>

### A07 — Liste des étudiants

Route indicative : `/admin/etudiants`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A07 — « Liste des étudiants » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Étudiants.
HEADER : « Étudiants », sous-titre Inscriptions, classes et accès par matière.
PANNEAU : recherche nom/email ; filtres Année, Classe, Statut ; compteur de résultats.
TABLEAU : Étudiant avec initiales et email secondaire, Classe, Matières autorisées sous forme de petits badges, Statut, Date d'inscription et bouton Voir. Une ligne Salma / 3ème collège A / Mathématiques / Actif ; une ligne étudiant suspendu ; une ligne accepté dans une autre classe.
Le tableau reste lisible, avec 6 à 8 lignes et pagination. Le nom est le lien principal. Les actions sensibles ne sont pas des icônes ambiguës côte à côte.
ACTIONS : Voir ouvre A08. Aucune note scolaire dans cette liste administrative. Aucun bouton donnant toutes les matières automatiquement.

SORTIE ATTENDUE : une maquette nette de cet écran A07, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a08"></a>

### A08 — Profil étudiant et autorisations

Route indicative : `/admin/etudiants/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A08 — « Profil étudiant et autorisations » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Étudiants. Fil d'Ariane Étudiants / Salma El Idrissi.
HEADER : nom, badge Actif ; menu Suspendre l'accès et Transférer de classe.
GRILLE 32/68 : à gauche fiche identité, email, classe 3ème collège A, année et date d'admission.
À droite onglets Accès aux matières et Historique. Onglet principal : trois lignes avec nom de matière, état, date d'attribution et action. Mathématiques = Autorisé, bouton Retirer l'accès ; Français et Physique-chimie = Non attribué, bouton Autoriser.
ENCART : « L'inscription à la classe ne donne pas automatiquement accès à toutes ses matières. »
FOOTER DU PANNEAU : résumé des modifications et bouton Enregistrer les accès ; afficher un état non enregistré après changement.
VARIANTES séparées : confirmation Retirer Mathématiques avec conséquence exacte ; historique des changements avec auteur/date ; transfert classe avec capacité cible et nouvelles matières. Ne pas mélanger ces variantes en une seule page.

SORTIE ATTENDUE : une maquette nette de cet écran A08, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a09"></a>

### A09 — Liste des professeurs et invitation

Route indicative : `/admin/professeurs`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A09 — « Liste des professeurs et invitation » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Professeurs.
HEADER : « Professeurs », bouton Inviter un professeur.
PANNEAU : recherche, filtres Statut et Matière ; tableau Nom, Email professionnel, Matières, Classes affectées, Connexion Google (état seulement), Statut et Voir.
Exemples : Youssef Amrani / Mathématiques / 4 groupes / Connecté / Actif ; Nadia Berrada / Mathématiques / 1 groupe / À reconnecter / Actif.
ÉCRAN PRINCIPAL : liste uniquement.
VARIANTE A09B : même page assombrie avec modale d'invitation de 520 px : Nom complet, Email, message d'aide « Le professeur recevra un lien pour activer son compte », Annuler, Envoyer l'invitation. Pas de mot de passe à transmettre manuellement.
VARIANTE A09C : invitation envoyée, badge Invitation en attente et action Renvoyer. Ne jamais afficher un token Google.

SORTIE ATTENDUE : une maquette nette de cet écran A09, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a10"></a>

### A10 — Détail d'un professeur et affectations

Route indicative : `/admin/professeurs/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A10 — « Détail d'un professeur et affectations » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Professeurs. Fil d'Ariane Professeurs / Youssef Amrani.
HEADER : « Youssef Amrani », badge Actif ; menu Suspendre.
GRILLE 30/70 : fiche à gauche avec nom, email, date d'arrivée et état Google Connecté, sans credentials. À droite panneau Affectations avec tableau Classe, Matière, Étudiants autorisés, Statut, menu Retirer.
Exemple : 3ème collège A / Mathématiques / 26 / Actif.
Bouton Ajouter une affectation en haut du tableau. Sous le tableau, panneau Contenus du professeur avec liste courte de cours et lien Voir tous.
VARIANTE A10B : modale d'affectation : Classe, Matière de cette classe, aperçu du professeur, bouton Confirmer.
VARIANTE A10C : retrait d'affectation expliquant que le professeur perd la gestion de ce groupe ; les contenus publiés restent disponibles selon la règle administrative. Aucun accès admin aux tokens.

SORTIE ATTENDUE : une maquette nette de cet écran A10, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a11"></a>

### A11 — Référentiels et paramètres

Route indicative : `/admin/referentiels`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A11 — « Référentiels et paramètres » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Référentiels.
HEADER : « Référentiels », sous-texte Configurez l'organisation pédagogique.
ONGLETS : Années scolaires, Niveaux, Matières, Paramètres.
ÉCRAN PRINCIPAL : onglet Matières avec recherche, bouton Ajouter une matière et tableau Code, Libellé, Statut, Modifier. Montrer Mathématiques, Français, Physique-chimie, Philosophie, sans attribuer toutes ces matières à chaque classe.
VARIANTES séparées :
- Années scolaires : 2026–2027 courante, dates début/fin, statut et Archiver.
- Niveaux : les six niveaux du collège/lycée, ordre modifiable et libellés.
- Paramètres : fuseau Africa/Casablanca, limites de fichiers et fenêtre d'ouverture du bouton Rejoindre.
Une seule section ouverte à la fois. Formulaire d'ajout dans une modale compacte. Aucun champ de secret Google ou clé Supabase dans ces paramètres.

SORTIE ATTENDUE : une maquette nette de cet écran A11, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a12"></a>

### A12 — Gestion des contenus

Route indicative : `/admin/contenus`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A12 — « Gestion des contenus » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Contenus.
HEADER : « Contenus pédagogiques », sous-texte Supervision des cours, exercices et annonces.
ONGLETS : Cours, Exercices, Compétitions, Annonces.
ÉCRAN PRINCIPAL : Cours, avec filtres Année, Classe, Matière, Professeur, Statut. Tableau Titre du cours, Classe, Matière, Responsable, Statut, Mise à jour, menu.
Exemples d'états : Publié menthe, Brouillon neutre, Archivé gris.
ACTIONS : Consulter, Archiver, Transférer la responsabilité. Ne pas mettre un bouton rouge de suppression sur chaque ligne.
VARIANTE A12B : modale de transfert avec ancien professeur, nouveau professeur affecté compatible, raison et avertissement sur la responsabilité des corrections. Exiger confirmation ; pas de déplacement vers une classe arbitraire.

SORTIE ATTENDUE : une maquette nette de cet écran A12, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a13"></a>

### A13 — Suivi des intégrations

Route indicative : `/admin/integrations`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A13 — « Suivi des intégrations » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Intégrations.
HEADER : « État des intégrations ».
LIGNE HAUTE : trois petites cartes Fonctionnement normal, Opérations en attente, Actions nécessaires ; valeurs de démonstration.
PANNEAU 1 : tableau Professeur, État de connexion, Dernière synchronisation, Action. Youssef connecté ; Nadia À reconnecter, action Envoyer une indication interne simulée ou Consulter le problème, sans usurper son compte.
PANNEAU 2 : opérations de séance avec titre, professeur, état Création en cours/À reprendre/Terminée, dernière tentative et bouton Examiner.
PANNEAU LATÉRAL : explications simples sur Google Meet, reconnexion par le propriétaire et absence de lien prêt.
Ne montrer ni tokens, ni client secret, ni jargon de logs bruts. Le bouton Reprendre une opération ne doit pas être présenté comme une nouvelle création de séance.

SORTIE ATTENDUE : une maquette nette de cet écran A13, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="a14"></a>

### A14 — Journal des actions

Route indicative : `/admin/audit`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN A14 — « Journal des actions » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ADMINISTRATEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de campus contemporain marocain, jardin et architecture en lumière naturelle, composition calme avec de l'espace vide. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Admissions ; Classes ; Étudiants ; Professeurs ; Référentiels ; Contenus ; Intégrations ; Journal d'activité. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Journal d'activité.
HEADER : « Journal d'activité », sous-texte Historique des actions administratives.
FILTRES : date, auteur, type d'action, recherche de ressource.
TABLEAU PRINCIPAL glass : Date et heure, Auteur, Action, Ressource, Résumé, Voir le détail. Exemples : Admission acceptée pour Salma ; Accès Mathématiques révoqué ; Professeur affecté à une classe.
DENSITÉ : lignes compactes mais aérées, environ 8 lignes et pagination, noms/actions lisibles.
VARIANTE A14B : drawer à droite de 440 px montrant l'action sélectionnée, auteur, date, valeurs autorisées Avant/Après et motif.
Lecture seule ; aucun bouton Modifier ou Effacer l'historique. Aucun mot de passe, token ou photo de copie dans ce journal.

SORTIE ATTENDUE : une maquette nette de cet écran A14, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Espace professeur

<a id="p01"></a>

### P01 — Tableau de bord professeur

Route indicative : `/prof`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P01 — « Tableau de bord professeur » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Vue d'ensemble.
HEADER : « Bonjour Youssef », sous-titre « Vos groupes, vos cours et vos prochaines séances ». Bouton principal Créer un cours.
LIGNE 1 : trois cartes utiles : 4 Groupes, 9 Copies à corriger, 2 Séances à venir. Éviter les graphiques d'activité décoratifs.
LIGNE 2 : grille 65/35. À gauche Copies récentes : étudiant, exercice, classe, date et Corriger. À droite Prochaine séance : Mathématiques, 3ème collège A, lundi 17 h, durée 1 h, badge Planifiée, bouton Voir la séance.
LIGNE 3 : Mes cours récents avec 3 lignes et statuts ; petit panneau Google connecté avec icône de confirmation et lien Gérer la connexion.
Distinguer visuellement l'action urgente Corriger des liens secondaires. Le nom des étudiants reste dans les cartes claires, pas directement sur la photo.

SORTIE ATTENDUE : une maquette nette de cet écran P01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p02"></a>

### P02 — Liste des groupes pédagogiques

Route indicative : `/prof/groupes`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P02 — « Liste des groupes pédagogiques » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes groupes.
HEADER : « Mes groupes », sous-titre « Les classes et matières qui vous sont affectées ».
FILTRES : Année scolaire, Niveau et recherche de classe.
GRILLE : quatre cartes glass, chacune avec nom de classe, matière, niveau, année, nombre d'étudiants autorisés et résumé de contenus. Carte principale : 3ème collège A ; Mathématiques ; 26 étudiants autorisés ; 5 cours publiés ; bouton Ouvrir le groupe.
Les autres cartes correspondent à d'autres classes du même professeur de mathématiques, sans lui inventer une matière non affectée.
Une note discrète précise « Les affectations sont gérées par l'administration ».
Aucune action Créer une classe, Accepter un étudiant ou Modifier ses matières. Ces fonctions appartiennent à l'administration.

SORTIE ATTENDUE : une maquette nette de cet écran P02, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p03"></a>

### P03 — Détail d'un groupe

Route indicative : `/prof/groupes/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P03 — « Détail d'un groupe » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes groupes. Fil d'Ariane Mes groupes / 3ème collège A · Mathématiques.
HEADER : titre du groupe, sous-texte 26 étudiants autorisés, année 2026–2027 ; boutons Créer un cours et Annoncer une séance.
ONGLETS : Cours, Étudiants, Annonces.
ÉCRAN PRINCIPAL : onglet Cours, liste de cours avec titre, statut, nombre d'exercices, dernière modification et Ouvrir.
ENCART DROIT : prochaine séance du groupe et raccourci Copies à corriger.
VARIANTE P03B : onglet Étudiants, tableau avec nom, travaux remis et dernière remise. Ne pas montrer les étudiants de la classe qui n'ont pas accès à la matière du groupe.
Le professeur peut consulter ces étudiants mais ne peut pas changer leurs autorisations. Ne pas dessiner un bouton Ajouter un étudiant.

SORTIE ATTENDUE : une maquette nette de cet écran P03, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p04"></a>

### P04 — Bibliothèque des cours du professeur

Route indicative : `/prof/cours`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P04 — « Bibliothèque des cours du professeur » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes cours.
HEADER : « Mes cours », bouton Nouveau cours.
FILTRES : groupe/classe, statut et recherche par titre. Onglets Tous, Publiés, Brouillons, Archivés.
LISTE : cartes horizontales glass, pas une mosaïque de grandes photos. Chaque ligne : miniature vidéo 120×76 px, titre « Les équations du premier degré », groupe 3ème collège A · Mathématiques, badge Publié, 3 exercices, date, bouton Modifier et menu.
Afficher aussi « Théorème de Pythagore » publié et « Les fonctions linéaires » en brouillon.
Actions de menu : Prévisualiser, Archiver ; suppression uniquement pour brouillon non utilisé.
VARIANTE : aucun cours avec illustration livre très discrète et bouton Créer mon premier cours. Un cours n'est pas réduit à une vidéo isolée ; montrer qu'il contient aussi des exercices.

SORTIE ATTENDUE : une maquette nette de cet écran P04, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p05"></a>

### P05 — Éditeur d'un cours

Route indicative : `/prof/cours/nouveau ou /prof/cours/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P05 — « Éditeur d'un cours » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes cours. Fil d'Ariane Mes cours / Nouveau cours.
HEADER : « Créer un cours », badge Brouillon ; boutons Prévisualiser, Enregistrer, Publier.
GRILLE 68/32 : formulaire principal glass à gauche, panneau de publication à droite.
FORMULAIRE : titre ; groupe pédagogique prérempli 3ème collège A · Mathématiques ; chapitre facultatif ; résumé ; éditeur de contenu riche avec barre d'outils courte.
SECTION VIDÉO : champ Lien YouTube ou Vimeo, aperçu 16:9 une fois renseigné, message si URL invalide.
SECTION DOCUMENTS : zone Ajouter un PDF et liste de fichiers avec nom/taille.
SECTION EXERCICES : liste des exercices liés, nombre, bouton Ajouter un exercice ouvrant P06.
PANNEAU DROIT : checklist Titre renseigné, Contenu ajouté, Vidéo valide, Au moins un exercice prêt. Bouton Publier bloqué tant que ces exigences ne sont pas satisfaites.
Conserver les données en cas d'erreur ; afficher Enregistré à 14:32. Ne pas présenter cet écran comme un lecteur étudiant.

SORTIE ATTENDUE : une maquette nette de cet écran P05, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p06"></a>

### P06 — Créer ou modifier un exercice

Route indicative : `/prof/cours/:courseId/exercices/nouveau`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P06 — « Créer ou modifier un exercice » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes cours. Fil d'Ariane Cours / Les équations du premier degré / Nouvel exercice.
HEADER : « Ajouter un exercice », badge Brouillon.
GRILLE 65/35 : formulaire à gauche et paramètres à droite.
FORMULAIRE : Titre « Résoudre des équations simples », Consigne avec éditeur, zone de pièces jointes et petite liste PDF. En bas, lien Prévisualiser comme étudiant.
PARAMÈTRES : cours parent non ambigu ; difficulté facultative ; date limite facultative ; heure et fuseau ; interrupteur Autoriser les remises en retard ; barème maximal 20 ; instructions « Envoie des photos lisibles de ton travail ».
ACTIONS BASSES : Annuler, Enregistrer le brouillon, Publier l'exercice.
VARIANTE : exercice déjà utilisé, énoncé/barème protégés avec explication et action explicite de versionnement. Éviter toute commande qui change silencieusement le barème de copies déjà notées.

SORTIE ATTENDUE : une maquette nette de cet écran P06, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p07"></a>

### P07 — Liste des copies à corriger

Route indicative : `/prof/copies`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P07 — « Liste des copies à corriger » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Copies, badge 9.
HEADER : « Copies des étudiants », sous-texte Vos exercices et participations à corriger.
ONGLETS : À corriger, À reprendre, Corrigées, Toutes. Badge de nombre seulement si réel dans la démonstration.
FILTRES : Groupe, Cours, Exercice et Date ; recherche étudiant.
TABLEAU : Étudiant, Travail, Groupe, Remis le, Version, État, Action Corriger. Exemple Salma El Idrissi / Équations simples / 3ème collège A / 12 nov. 16:40 / V1 / Envoyé.
Le titre du travail et le nom sont clairement distincts. Badge Retard jaune si applicable. Une petite icône indique 3 fichiers.
Aucun aperçu géant de toutes les copies ; on ouvre la copie sélectionnée. Le professeur voit les travaux de ses propres cours, pas tous les étudiants de l'établissement.

SORTIE ATTENDUE : une maquette nette de cet écran P07, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p08"></a>

### P08 — Lecture et correction d'une copie

Route indicative : `/prof/copies/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P08 — « Lecture et correction d'une copie » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Copies. Réduire visuellement le chrome pour donner de la place au travail.
HEADER : « Copie de Salma El Idrissi », exercice Équations simples ; groupe 3ème collège A ; V1, remise le 12 nov. à 16:40.
GRILLE 68/32 :
À gauche, grand panneau glass avec une feuille manuscrite lisible occupant 70 % de sa hauteur, barre outils zoom +/−, rotation, téléchargement. Rail de trois vignettes de photos sous le document. Choix de version en haut.
À droite, panneau Correction : rappel du barème /20, champ Note facultative, grand champ Commentaire, état Brouillon. Actions Enregistrer le brouillon, Demander une nouvelle version et Publier la correction.
Sous l'en-tête, petit lien Voir l'énoncé. Montrer le commentaire de l'étudiante séparément du commentaire du professeur.
VARIANTE : correction publiée avec date, possibilité de modification tracée. La note n'est pas un graphique et ne doit pas dominer la feuille.

SORTIE ATTENDUE : une maquette nette de cet écran P08, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p09"></a>

### P09 — Liste des challenges et concours

Route indicative : `/prof/competitions`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P09 — « Liste des challenges et concours » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours.
HEADER : « Challenges et concours », bouton Créer une compétition.
FILTRES : Groupe, Type et Statut.
CARTES HORIZONTALES : titre, badge Challenge/Concours, groupe, ouverture, clôture, nombre de participations et état. Exemples « Défi équations — 30 minutes de pratique » Ouvert ; « Concours de raisonnement » À venir ; « Défi géométrie » Clôturé.
ACTIONS selon état : Modifier, Voir les participations, Publier les résultats. Le nombre de participations est une donnée de démonstration, pas une promesse marketing.
Panneau latéral discret : rappel Correction manuelle et Résultats publiés par le professeur.
Pas de quiz autocorrigé, roue de récompenses, badges de niveau inventés ou classement national.

SORTIE ATTENDUE : une maquette nette de cet écran P09, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p10"></a>

### P10 — Éditeur de compétition

Route indicative : `/prof/competitions/nouvelle ou /prof/competitions/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P10 — « Éditeur de compétition » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours.
HEADER : « Créer une compétition », badge Brouillon.
GRILLE 65/35 :
À gauche : Type Challenge/Concours ; Titre ; Groupe ; Présentation courte ; Énoncé riche ; fichiers PDF/images ; Règles de participation.
À droite : Date et heure d'ouverture ; Date et heure de clôture ; fuseau Africa/Casablanca ; barème /20 ; interrupteur Classement du groupe désactivé par défaut.
ENCART : « Les étudiants remettent des photos ou un PDF. Les corrections sont manuelles. »
ACTIONS : Enregistrer le brouillon et Publier. Aperçu de la période avec validation de la chronologie.
Ne pas ajouter d'éditeur de QCM ou de réponses automatiques. Le classement éventuel utilise des pseudonymes et n'est pas public.

SORTIE ATTENDUE : une maquette nette de cet écran P10, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p11"></a>

### P11 — Participations et publication des résultats

Route indicative : `/prof/competitions/:id/participations`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P11 — « Participations et publication des résultats » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours. Fil d'Ariane vers la compétition.
HEADER : « Défi équations », badge Clôturé ; groupe et date de clôture.
LIGNE RÉSUMÉ : 18 participations ; 15 corrigées ; 3 à corriger.
ONGLETS : Participations, Résultats.
ÉCRAN PRINCIPAL : tableau Étudiant, Remise, Version, État de correction, Note interne, Corriger. Un bandeau jaune rappelle « Les résultats ne sont pas encore visibles par les étudiants ».
Bouton Publier les résultats visible mais bloqué si les conditions requises manquent ; texte explique ce qui reste.
VARIANTE séparée après correction : résultats prêts, action de publication avec confirmation ; puis badge Résultats publiés et classement sous pseudonymes. Ne pas exposer les résultats à l'étudiant depuis cette vue professeur.

SORTIE ATTENDUE : une maquette nette de cet écran P11, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p12"></a>

### P12 — Liste des annonces

Route indicative : `/prof/annonces`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P12 — « Liste des annonces » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Annonces.
HEADER : « Mes annonces », bouton Nouvelle annonce.
FILTRES : Groupe, Type et Statut ; recherche titre.
LISTE de lignes/cards glass : icône de type, titre, groupe, aperçu de deux lignes, publication et statut. Exemple « Préparez la prochaine séance » annonce simple ; « Révision des équations » liée à une séance.
ACTIONS : Lire, Modifier et Archiver. Badges Brouillon, Publiée, Liée à une séance.
Petit encart « Pour planifier un cours en direct, utilisez Mes séances » avec lien.
Une annonce de séance en création doit montrer Préparation du lien et ne pas être confondue avec une annonce déjà publiée.
Ne pas afficher toutes les annonces de l'établissement ; seulement celles du professeur dans ses groupes.

SORTIE ATTENDUE : une maquette nette de cet écran P12, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p13"></a>

### P13 — Rédiger une annonce simple

Route indicative : `/prof/annonces/nouvelle`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P13 — « Rédiger une annonce simple » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Annonces. Fil d'Ariane Annonces / Nouvelle annonce.
HEADER : « Nouvelle annonce ».
GRILLE 65/35 : à gauche formulaire Titre, Groupe destinataire, Message avec éditeur simple, Pièces jointes. À droite aperçu de la carte que verra l'étudiant avec nom Youssef Amrani, groupe, titre et extrait.
ENCART DESTINATAIRES : « Visible aux étudiants autorisés en mathématiques dans 3ème collège A ». Ne pas afficher une liste de 26 emails.
ACTIONS : Enregistrer le brouillon et Publier l'annonce ; après succès, toast et date.
Lien secondaire « Vous souhaitez organiser un cours en direct ? Planifier une séance » vers P15.
Ne pas inclure le formulaire Google Meet et celui de l'annonce simple dans le même écran.

SORTIE ATTENDUE : une maquette nette de cet écran P13, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p14"></a>

### P14 — Liste et agenda des séances

Route indicative : `/prof/seances`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P14 — « Liste et agenda des séances » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes séances.
HEADER : « Mes séances », bouton Planifier une séance ; sélecteur Liste / Calendrier.
ÉCRAN PRINCIPAL : vue Liste, onglets À venir, Passées, Annulées.
Chaque séance est une carte horizontale : bloc date/jour à gauche, titre, groupe, horaires avec fuseau, badge Planifiée/Création du lien/À reconnecter, action Voir.
À droite, panneau étroit Prochaine séance, état Google et lien Gérer ma connexion.
Exemple prêt : « Révision des équations », 3ème collège A, 17:00–18:00, Africa/Casablanca.
VARIANTE P14B séparée : calendrier mensuel avec événements sobres, sans reproduire toute l'interface Google Calendar.
Aucune carte ne doit afficher Rejoindre si le lien est encore en préparation ou si la séance est annulée.

SORTIE ATTENDUE : une maquette nette de cet écran P14, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p15"></a>

### P15 — Planifier une séance Google Meet

Route indicative : `/prof/seances/nouvelle`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P15 — « Planifier une séance Google Meet » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes séances. Fil d'Ariane Mes séances / Nouvelle séance.
HEADER : « Planifier une séance ».
GRILLE 65/35 : formulaire glass à gauche ; récapitulatif à droite.
FORMULAIRE : Titre ; Groupe destinataire ; Cours associé facultatif ; Date ; Heure de début et Heure de fin sur une ligne ; Fuseau prérempli Africa/Casablanca ; Description.
RÉCAPITULATIF : groupe, matière, professeur organisateur Youssef Amrani, horaire et état Google connecté. Encadré : « Un lien Google Meet sera créé automatiquement et ajouté à l'annonce. »
ACTIONS : Annuler et Publier la séance.
VARIANTES indépendantes : Google non connecté avec bouton Connecter Google à la place de Publier ; création en cours avec spinner et message persistant ; erreur récupérable avec Réessayer ; succès renvoyant vers P16.
Ne pas demander au professeur de coller manuellement un lien Meet pour le parcours automatique.

SORTIE ATTENDUE : une maquette nette de cet écran P15, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p16"></a>

### P16 — Détail d'une séance

Route indicative : `/prof/seances/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P16 — « Détail d'une séance » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes séances. Fil d'Ariane Mes séances / Révision des équations.
HEADER : titre, badge Planifiée, menu Modifier / Annuler.
GRILLE 65/35 : grand panneau Informations avec date, début/fin, fuseau, groupe, cours associé, description et organisateur. À droite carte Google Meet avec icône vidéo, message Lien prêt et bouton Rejoindre le cours ; lien Copier le lien secondaire.
SOUS LE CONTENU : aperçu de l'annonce publiée et date de publication, sans liste publique d'emails.
VARIANTES séparées : préparation avec aucun faux lien ; erreur avec action nécessaire ; confirmation d'annulation expliquant l'information des étudiants ; état Annulée sans bouton Rejoindre.
Une modification montre la mention Synchronisation en cours tant que nécessaire. L'état doit être compréhensible sans détails d'API.

SORTIE ATTENDUE : une maquette nette de cet écran P16, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="p17"></a>

### P17 — Connexion Google du professeur

Route indicative : `/prof/integrations/google`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN P17 — « Connexion Google du professeur » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : PROFESSEUR. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bureau de professeur avec cahier et livres sur les côtés, bibliothèque en arrière-plan, lumière naturelle. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Vue d'ensemble ; Mes groupes ; Mes cours ; Copies ; Challenges et concours ; Annonces ; Mes séances ; Connexion Google. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Connexion Google.
HEADER : « Google Calendar et Meet », sous-titre Créez vos séances depuis Kon-fanan.
PANNEAU PRINCIPAL de 760 px : logo Google discret, explication en trois étapes — Connecter le compte, Planifier une séance, Partager le lien dans l'annonce.
ÉCRAN PRINCIPAL : état Non connecté, bouton Connecter mon compte Google, texte expliquant l'autorisation de gérer les événements du calendrier du professeur.
VARIANTES INDÉPENDANTES :
- Connecté : email de démonstration youssef@example.test, badge Connecté, dernière vérification, bouton Planifier une séance, lien Déconnecter.
- À reconnecter : message court et bouton Reconnecter Google.
- Déconnexion : modale expliquant les conséquences pour les futures synchronisations.
Ne jamais afficher access token, refresh token, scope technique ou formulaire de clé API. Garder le fond photo et le glass cohérents avec les autres pages professeur.

SORTIE ATTENDUE : une maquette nette de cet écran P17, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Espace étudiant

<a id="e01"></a>

### E01 — Tableau de bord étudiant

Route indicative : `/etudiant`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E01 — « Tableau de bord étudiant » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mon espace.
HEADER : « Bonjour Salma », sous-titre 3ème collège A · 2026–2027 ; aucun bouton d'administration.
GRILLE ASYMÉTRIQUE : à gauche, panneau principal Continuer mon cours avec titre Les équations du premier degré, professeur Youssef Amrani, miniature vidéo et bouton Reprendre le cours. À droite carte Prochaine séance avec date, titre et état Planifiée.
DEUXIÈME LIGNE : cartes Travaux à rendre et Dernière correction. Exercice Équations simples à remettre vendredi, bouton Faire l'exercice ; correction Géométrie disponible, bouton Consulter.
TROISIÈME LIGNE : Mes matières autorisées avec une seule carte Mathématiques ; puis deux annonces récentes du professeur.
Salma possède uniquement mathématiques : ne pas ajouter français, philosophie ou physique comme matières disponibles. Ne pas afficher de moyenne générale, classement ou pourcentage de progression inventé.

SORTIE ATTENDUE : une maquette nette de cet écran E01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e02"></a>

### E02 — Mes matières autorisées

Route indicative : `/etudiant/matieres`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E02 — « Mes matières autorisées » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes matières.
HEADER : « Mes matières », sous-texte « Les matières auxquelles l'administration t'a donné accès » ; classe et année dans une petite puce.
ÉCRAN PRINCIPAL : une grande carte glass Mathématiques, icône mathématique sur badge menthe, description courte, 5 cours publiés, avatars et noms des deux professeurs Youssef Amrani et Nadia Berrada, bouton Voir les cours.
Ne pas remplir la grille avec des matières non autorisées pour rendre l'écran plus chargé. Le cas d'une seule matière doit sembler intentionnel et soigné.
ENCART SECONDAIRE : « Une matière manque ? Adresse-toi à l'administration. »
VARIANTE séparée : aucun accès attribué, panneau vide explicite sans catalogue public de cours ni boutons trompeurs. Les droits ne sont pas choisis par l'étudiante.

SORTIE ATTENDUE : une maquette nette de cet écran E02, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e03"></a>

### E03 — Cours d'une matière

Route indicative : `/etudiant/matieres/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E03 — « Cours d'une matière » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes matières. Fil d'Ariane Mes matières / Mathématiques.
HEADER : « Mathématiques », sous-titre 3ème collège A · 2026–2027 ; deux professeurs identifiés.
FILTRES : Professeur et Chapitre ; recherche de cours. Onglets Tous les cours, En cours, Terminés.
CONTENU : cartes horizontales glass avec aperçu vidéo, titre, chapitre, professeur, nombre d'exercices et état personnel. Exemples Les équations du premier degré / Youssef / En cours ; Théorème de Pythagore / Nadia / À commencer ; Fractions et calcul / Youssef / Terminé.
ACTIONS : Continuer ou Ouvrir le cours selon état.
COLONNE ÉTROITE facultative : prochaine séance de mathématiques et documents récents.
Ne pas montrer des cours brouillons ou d'une autre classe. Éviter les photos géantes pour chaque carte ; utiliser les aperçus de cours comme information.

SORTIE ATTENDUE : une maquette nette de cet écran E03, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e04"></a>

### E04 — Lecture d'un cours

Route indicative : `/etudiant/cours/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E04 — « Lecture d'un cours » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes matières. Fil d'Ariane Mathématiques / Les équations du premier degré.
HEADER : titre du cours, nom du professeur, classe et chapitre.
GRILLE 72/28 :
À gauche, grand lecteur vidéo 16:9 avec couverture réaliste de tableau mathématique et bouton lecture, dans un panneau glass clair. Sous le lecteur, onglets Le cours et Documents. Onglet Le cours actif avec sous-titre, explications courtes et exemples d'équations bien composés.
À droite, panneau Exercices du cours : trois lignes numérotées, titre, état À faire/Envoyé/Corrigé et action Ouvrir. Sous ce panneau, liens vers les PDF du cours.
BAS DE LECTURE : Marquer comme terminé et navigation cours précédent/suivant parmi les cours autorisés.
Le cours doit rester confortable à lire : fond du texte presque opaque et contrasté. La photo de fond apparaît surtout autour des panneaux. Aucun champ de création ou bouton Publier.

SORTIE ATTENDUE : une maquette nette de cet écran E04, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e05"></a>

### E05 — Faire un exercice et déposer sa copie

Route indicative : `/etudiant/exercices/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E05 — « Faire un exercice et déposer sa copie » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes travaux, avec fil d'Ariane Mathématiques / Équations / Exercice 1.
HEADER : « Résoudre des équations simples », badge À rendre ; professeur, échéance et barème /20.
GRILLE 55/45 : à gauche panneau Énoncé, trois équations de démonstration bien alignées, consignes de justification et document PDF facultatif. À droite panneau Mon travail.
MON TRAVAIL : zone d'ajout de fichiers avec icône appareil photo ; boutons Prendre une photo et Choisir des fichiers. Texte formats JPEG, PNG, WebP, PDF ; 5 fichiers maximum ; total 30 Mo. En dessous, trois petites vignettes avec nom/taille et retirer, puis champ Commentaire facultatif.
ACTIONS : Enregistrer le brouillon en secondaire ; Envoyer mon travail en primaire.
VARIANTES distinctes : upload en cours avec progression ; erreur d'un fichier ; confirmation de remise avec date et version V1. Après envoi, pas de remplacement silencieux des photos. Ne pas utiliser une image de stock comme si elle était la copie réelle de l'étudiante.

SORTIE ATTENDUE : une maquette nette de cet écran E05, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e06"></a>

### E06 — Historique de mes travaux

Route indicative : `/etudiant/mes-travaux`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E06 — « Historique de mes travaux » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes travaux.
HEADER : « Mes travaux », sous-texte Retrouve tes copies et tes corrections.
ONGLETS : À rendre, Envoyés, À reprendre, Corrigés. Recherche par travail ; filtre Cours.
TABLEAU LISIBLE : Travail, Cours, Professeur, Remise, État, Résultat, Action. Exemple Équations simples / Équations / Youssef / 12 nov. / Envoyé / En attente / Voir ma copie ; Géométrie / Pythagore / Nadia / 10 nov. / Corrigé / 16 sur 20 / Voir la correction.
Une ligne À reprendre montre le commentaire court du professeur et un bouton Nouvelle version, sans mélanger les fichiers de versions.
Aucune copie d'un autre étudiant. Les corrections non publiées affichent En attente, sans prévisualiser la note. Chaque état doit être lisible par texte et couleur.

SORTIE ATTENDUE : une maquette nette de cet écran E06, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e07"></a>

### E07 — Consulter ma correction

Route indicative : `/etudiant/mes-travaux/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E07 — « Consulter ma correction » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes travaux. Fil d'Ariane Mes travaux / Géométrie.
HEADER : nom du travail, badge Corrigé ; professeur et date de publication.
GRILLE 65/35 : à gauche visionneuse de la copie soumise, vignettes et sélection Version 1. À droite panneau Correction publiée : note 16/20 en taille modérée, nom du professeur et commentaire pédagogique structuré.
Sous le commentaire, liste courte de points à reprendre et lien Revoir le cours. Aucune zone permettant à l'étudiante de modifier la note.
VARIANTE séparée : demande de nouvelle version avec explication, délai de réouverture et bouton Préparer une nouvelle version.
L'historique distingue les dates de remise et de correction. La feuille de l'étudiante reste la pièce visuelle principale ; ne pas remplacer la correction par un écran de célébration ou des confettis.

SORTIE ATTENDUE : une maquette nette de cet écran E07, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e08"></a>

### E08 — Liste des challenges et concours

Route indicative : `/etudiant/competitions`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E08 — « Liste des challenges et concours » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours.
HEADER : « À toi de relever le défi », sous-texte Les challenges de tes matières.
ONGLETS : Ouverts, À venir, Terminés ; filtre Professeur si utile.
GRILLE DE CARTES GLASS : titre, type Challenge/Concours, matière Mathématiques, professeur, ouverture/fermeture et état personnel. Exemples Défi équations ouvert / Participer ; Concours de raisonnement à venir / Voir les détails ; Défi géométrie terminé / Voir mes résultats si publiés.
Chaque carte utilise un petit accent jaune/orange ou une icône, pas une grande image décorative.
Salma ne voit que les compétitions des mathématiques de sa classe. Aucun classement national, récompense financière, inscription payante ou contenu d'une matière non autorisée.

SORTIE ATTENDUE : une maquette nette de cet écran E08, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e09"></a>

### E09 — Détail et participation à une compétition

Route indicative : `/etudiant/competitions/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E09 — « Détail et participation à une compétition » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours. Fil d'Ariane vers Défi équations.
HEADER : « Défi équations », badge Ouvert ; Mathématiques, professeur et groupe.
BANDEAU : ouverture, clôture avec fuseau, barème /20 et statut Pas encore participé. Préférer une date claire à un chronomètre spectaculaire.
GRILLE 60/40 : à gauche Présentation, Règles et Énoncé avec PDF ; à droite Ma participation avec ajout de photos/PDF, vignettes, commentaire et Envoyer ma participation.
ENCART : une participation personnelle avec historique de versions ; corrections manuelles.
VARIANTES indépendantes : À venir sans formulaire actif ; participation envoyée ; clôturé avec résultats en attente. Ne pas afficher de réponses d'autres élèves ni de résultat non publié.
Le design reprend l'ergonomie de dépôt E05 pour que l'étudiante n'apprenne pas deux systèmes différents.

SORTIE ATTENDUE : une maquette nette de cet écran E09, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e10"></a>

### E10 — Résultats d'une compétition

Route indicative : `/etudiant/competitions/:id/resultats`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E10 — « Résultats d'une compétition » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Challenges et concours.
HEADER : « Résultats — Défi équations », badge Résultats publiés ; groupe et professeur.
GRILLE : panneau Mon résultat avec note, commentaire publié et lien Voir ma participation. Si le classement est activé, panneau Classement du groupe avec Rang, Pseudonyme et Score ; pseudonymes tels que Élève A7, Élève B2 ; ligne de l'étudiante mise en évidence avec mention Toi.
Des notes égales affichent le même rang. Aucun email, nom complet des autres participants ou accès à leurs copies.
VARIANTE séparée : classement désactivé, montrer uniquement le résultat personnel et ne pas laisser un tableau vide.
VARIANTE résultats non publiés : message de patience sans note, commentaire ni classement. Aucun podium, médaille ou trophée non prévu dans le besoin.

SORTIE ATTENDUE : une maquette nette de cet écran E10, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e11"></a>

### E11 — Fil des annonces

Route indicative : `/etudiant/annonces`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E11 — « Fil des annonces » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Annonces.
HEADER : « Les annonces de mes professeurs ».
FILTRES : Professeur et Type ; onglets Toutes et Non lues.
LISTE CENTRALE en cartes glass de largeur confortable : nom du professeur et avatar initiales, matière/classe, date, titre, aperçu de message, badge Nouvelle si non lue, pièces jointes éventuelles et Lire l'annonce.
Exemple « Préparez la prochaine séance » par Youssef, consigne d'apporter le cahier. Une autre carte peut être liée à une séance avec date et Voir la séance.
VARIANTE E11B séparée : lecture d'une annonce avec message complet, documents et retour à la liste.
Aucun bouton de publication pour l'étudiant. Pas de fil social avec likes, commentaires publics, nombre d'abonnés ou stories.

SORTIE ATTENDUE : une maquette nette de cet écran E11, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e12"></a>

### E12 — Liste des séances

Route indicative : `/etudiant/seances`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E12 — « Liste des séances » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes séances.
HEADER : « Mes séances », fuseau Africa/Casablanca.
ONGLETS : À venir, Passées ; filtre Professeur.
CARTES HORIZONTALES : grand bloc jour/date à gauche, titre au centre, professeur, matière, groupe et heure ; état à droite.
Exemple principal Révision des équations, aujourd'hui 17:00–18:00, Youssef Amrani. Si la fenêtre d'accès est ouverte, bouton Rejoindre le cours en menthe ; sinon bouton Voir la séance et texte « Ouverture 15 minutes avant le début ».
Une séance annulée montre le badge Annulée et n'a pas de bouton Rejoindre. Une séance passée propose les informations sans inventer un enregistrement vidéo.
Pas de calendrier encombré si seules deux séances sont prévues. Le statut du compte Google du professeur n'est pas une tâche à résoudre par l'étudiant.

SORTIE ATTENDUE : une maquette nette de cet écran E12, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="e13"></a>

### E13 — Détail d'une séance et accès Meet

Route indicative : `/etudiant/seances/:id`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN E13 — « Détail d'une séance et accès Meet » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : ÉTUDIANT. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

NAVIGATION ACTIVE : Mes séances. Fil d'Ariane Mes séances / Révision des équations.
HEADER : titre de séance et badge Commence bientôt.
GRILLE 65/35 : à gauche informations date, heure début/fin, fuseau, professeur, matière, classe, description et lien vers le cours associé. À droite carte Rejoindre le cours avec icône vidéo, heure et grand bouton menthe Ouvrir Google Meet ; aide « La séance s'ouvre dans un nouvel onglet ».
Ne pas dessiner une salle de visioconférence intégrée ni une grille de webcams : Meet s'ouvre à l'extérieur de Kon-fanan.
VARIANTES distinctes : trop tôt avec bouton désactivé et heure d'ouverture ; séance annulée ; accès retiré avec retour vers Mes matières. Aucun faux lien cliquable si la séance n'est pas prête.
Aucun bouton Modifier, Annuler, Copier les tokens ou gérer l'agenda du professeur.

SORTIE ATTENDUE : une maquette nette de cet écran E13, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Pages personnelles et états d'accès

<a id="c01"></a>

### C01 — Notifications personnelles

Route indicative : `/notifications`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN C01 — « Notifications personnelles » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : RÔLE COURANT : ÉTUDIANT POUR CETTE VARIANTE. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

UTILISER LE SHELL DU RÔLE COURANT : conserver sa sidebar et sa photo, pas une quatrième identité visuelle.
HEADER : « Notifications », bouton Tout marquer comme lu.
ONGLETS : Toutes, Non lues.
LISTE GLASS : icône de type, titre, description courte, date relative et point non lu. Exemple étudiant : Correction disponible, Nouvelle séance annoncée, Accès à une matière modifié. Exemple professeur dans une autre variante : Nouvelle copie reçue.
Chaque ligne conduit à une seule ressource autorisée. Le contenu d'une notification ne doit pas afficher de note privée en grand ni un lien Meet brut.
ÉTATS : notification lue visuellement plus discrète ; aucune notification avec illustration légère et texte Tu es à jour.
Ne mélanger pas dans la même boîte les notifications de tous les rôles et utilisateurs. La variante principale est celle de Salma.

SORTIE ATTENDUE : une maquette nette de cet écran C01, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="c02"></a>

### C02 — Profil et paramètres personnels

Route indicative : `/profil`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN C02 — « Profil et paramètres personnels » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : RÔLE COURANT : ÉTUDIANT POUR CETTE VARIANTE. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

UTILISER LE SHELL DU RÔLE COURANT, exemple principal étudiant Salma.
HEADER : « Mon profil ».
GRILLE 32/68 : à gauche initiales SE, nom, badge Étudiante et classe. À droite onglets Informations et Sécurité.
ÉCRAN PRINCIPAL Informations : Nom d'affichage modifiable, Email en lecture seule avec indication de modification sécurisée si prévue, langue préférée, classe en lecture seule, année scolaire et matières autorisées en lecture seule. Bouton Enregistrer les modifications.
VARIANTE séparée Sécurité : Changer mon mot de passe et Se déconnecter, avec messages clairs.
L'étudiante ne peut pas changer son rôle, sa classe ou ses accès depuis ce formulaire. Les fonctions Google du professeur sont dans son écran dédié, pas dans un panneau universel rempli de paramètres techniques.

SORTIE ATTENDUE : une maquette nette de cet écran C02, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

<a id="c03"></a>

### C03 — Accès indisponible et page introuvable

Route indicative : `/403 et route inconnue`.

```text
CONÇOIS UNIQUEMENT L'ÉCRAN C03 — « Accès indisponible et page introuvable » pour Kon-fanan, plateforme éducative collège/lycée. Produis une maquette UI haute fidélité, en français, prête à servir de référence à un prototype. Une page par réponse : écran principal uniquement, pas de planche de plusieurs écrans. Les variantes mentionnées sont des demandes ultérieures séparées. Ne développe pas de backend dans cette demande.

ESPACE : RÔLE COURANT : ÉTUDIANT POUR CETTE VARIANTE. Desktop 1440×1080 ; scroll vertical si nécessaire. Reprendre la marque et la palette de la landing jointe. Le résultat est une interface d'application photographique en GLASSMORPHISM.
FOND : photo réaliste de bibliothèque et espace de travail scolaire lumineux, sujets et détails sur les bords, centre calme. Photo visible derrière et entre les panneaux ; voile vert #153E32 à 55 %. Pas de grand fond blanc remplaçant la photo.
CADRE COMMUN : marge extérieure 20 px ; sidebar fixe à x=20, y=20, largeur 232 px ; contenu à x=272, largeur 1148 px ; topbar hauteur 72 px ; espacement entre panneaux 20 px. Sidebar vert sombre translucide rgba(21,62,50,0.84), cartes crème translucide rgba(246,244,233,0.88), flou 24 px, bordures blanches fines, rayons 20 px, ombres légères. Les lecteurs/tableaux peuvent être plus opaques pour la lisibilité.
TYPO ET ACTIONS : Manrope ; titre de page 28–32 px, sections 20 px, texte 15–16 px, labels 13–14 px. Texte vert forêt sur panneaux clairs, texte ivoire sur sidebar. Bouton principal menthe, hauteur 44 px ; jaune/orange réservés aux accents et statuts. Icônes linéaires cohérentes.
SIDEBAR : logo Kon-fanan en haut et rôle visible. Liens : Mon espace ; Mes matières ; Mes travaux ; Challenges et concours ; Annonces ; Mes séances. En bas : Notifications, Mon profil, Se déconnecter. Élément actif sur pastille menthe. Topbar : contexte, notifications et avatar, sans recherche globale inutile.
Données fictives signalées par une discrète mention Démonstration. Toute l'interface conserve des proportions réalistes ; pas de collage, de diagramme technique ni de grille de dashboards miniatures.

ÉCRAN PRINCIPAL : accès à un contenu refusé dans le shell du rôle courant ; garder la navigation disponible mais remplacer le contenu par un panneau glass centré de 620 px.
CONTENU : petite icône livre fermé, titre « Ce contenu n'est pas accessible », explication « Ton accès à cette matière ou à ce cours a peut-être changé. », bouton Retour à mes matières pour l'étudiant. Ne pas révéler le titre privé du contenu interdit.
VARIANTE SÉPARÉE : page introuvable, titre « Cette page est introuvable », texte court et bouton Retour à mon espace.
VARIANTE RÉSEAU séparée : « Impossible de charger cette page », bouton Réessayer.
Une variante par génération. Aucun énorme code d'erreur rouge, détail SQL ou message accusant l'utilisateur. Les droits ne se contournent pas avec un bouton Continuer quand même.

SORTIE ATTENDUE : une maquette nette de cet écran C03, à l'échelle d'une vraie interface, avec l'état principal décrit. Générer les variantes seulement dans une demande suivante, une à une.
```

## Versions mobile — une demande séparée par écran

Les prompts ci-dessous se donnent après la version desktop correspondante, en joignant celle-ci comme référence si possible. Ils ne demandent pas de dessiner desktop et mobile côte à côte.

### M01 — Accueil étudiant mobile

Référence desktop : E01.

```text
ÉCRAN M01 — Accueil étudiant mobile. Kon-fanan : adapte uniquement la page E01 en mobile. Conserve son identité, ses données et les permissions du rôle. Produis une seule maquette mobile, sans cadre de téléphone ni écran desktop à côté.
Écran 390×844, une seule vue mobile. Conserver photo de bibliothèque plein fond et voile vert, cartes glass crème lisibles, coins 18 px. Marges 16 px. Pas de sidebar desktop.
Header compact logo Kon-fanan, cloche et avatar SE. Salutation Bonjour Salma ; classe 3ème collège A.
Empiler : carte Continuer mon cours avec titre Équations, miniature 16:9 et Reprendre ; carte Prochaine séance ; carte Travail à rendre. La matière Mathématiques apparaît ensuite dans le scroll, sans inventer d'autres accès.
Navigation fixe basse : Accueil, Matières, Travaux, Séances, Plus ; Accueil actif. Plus ouvre le reste des liens dans une variante séparée.
Texte courant 16 px, cibles tactiles 44 px minimum, aucun tableau compressé ou zoom nécessaire.
```

### M02 — Lecture de cours mobile

Référence desktop : E04.

```text
ÉCRAN M02 — Lecture de cours mobile. Kon-fanan : adapte uniquement la page E04 en mobile. Conserve son identité, ses données et les permissions du rôle. Produis une seule maquette mobile, sans cadre de téléphone ni écran desktop à côté.
Écran 390×844, une seule page mobile avec scroll. Fond photo et glass identiques à E01 mobile. Header Retour, Mathématiques, cloche.
Titre Les équations du premier degré, nom du professeur et lecteur vidéo 16:9 pleine largeur utile. Sous le lecteur, onglets Le cours et Documents. Corps de leçon dans un panneau crème presque opaque, texte 16 px.
Les exercices sont accessibles par un bloc Exercices du cours avec trois lignes compactes sous la leçon, pas une colonne latérale miniaturisée. Bouton Marquer comme terminé à la fin.
Conserver la navigation basse, laisser assez d'espace pour qu'elle ne masque aucun contenu. Ne pas dessiner une version desktop réduite.
```

### M03 — Dépôt de copie mobile

Référence desktop : E05.

```text
ÉCRAN M03 — Dépôt de copie mobile. Kon-fanan : adapte uniquement la page E05 en mobile. Conserve son identité, ses données et les permissions du rôle. Produis une seule maquette mobile, sans cadre de téléphone ni écran desktop à côté.
Écran 390×844, une seule vue mobile. Photo discrète et cartes glass claires. Header retour et titre Exercice 1, badge À rendre.
Empiler Énoncé, puis Mon travail. Pour la capture principale, montrer le panneau Mon travail ouvert : boutons Prendre une photo et Choisir des fichiers, trois vignettes en grille, retirer accessible, tailles affichées. Indiquer 5 fichiers maximum, total 30 Mo et formats autorisés.
Commentaire facultatif sous les fichiers. Barre d'action basse avec Enregistrer et Envoyer mon travail, en laissant le contenu défilable au-dessus. Sur cet écran de tâche, la barre d'envoi remplace la navigation basse générale afin d'éviter deux barres superposées.
La variante Envoi réussi est une autre génération. Pas de faux envoi présenté comme accompli dans l'état brouillon.
```

### M04 — Correction professeur mobile

Référence desktop : P08.

```text
ÉCRAN M04 — Correction professeur mobile. Kon-fanan : adapte uniquement la page P08 en mobile. Conserve son identité, ses données et les permissions du rôle. Produis une seule maquette mobile, sans cadre de téléphone ni écran desktop à côté.
Écran 390×844, rôle professeur uniquement. Garder fond photo du professeur, voile vert, panneaux glass clairs.
Header Retour aux copies, Salma El Idrissi, exercice et V1. Deux onglets larges Copie et Correction.
Écran principal : Copie actif, grande visionneuse de feuille, zoom et vignettes accessibles. Bouton Aller à la correction au bas du panneau.
Variante ultérieure indépendante : Correction actif, note /20, commentaire multiligne, Enregistrer le brouillon et Publier.
Utiliser une disposition séquentielle, pas deux colonnes minuscules. Le bouton Publier apparaît dans le formulaire de correction, pas au-dessus d'une feuille sans contexte. Menu du professeur accessible via le header.
```

### M05 — Admission administrateur mobile

Référence desktop : A03.

```text
ÉCRAN M05 — Admission administrateur mobile. Kon-fanan : adapte uniquement la page A03 en mobile. Conserve son identité, ses données et les permissions du rôle. Produis une seule maquette mobile, sans cadre de téléphone ni écran desktop à côté.
Écran 390×844, rôle administrateur uniquement. Fond campus voilé et cartes glass cohérentes.
Header retour Admissions, titre Examiner la demande, badge En attente. Empiler : fiche Salma El Idrissi ; classe souhaitée ; sélecteur Classe finale ; indicateur 13 places disponibles ; cases matières Mathématiques coché, Français et Physique-chimie non cochés ; résumé d'autorisation.
Action primaire Accepter l'inscription en bas, secondaire Refuser, cibles 44 px minimum. La page peut défiler, mais aucune donnée ne doit être masquée sous les actions.
Ne jamais faire tenir le formulaire desktop entier dans une miniature. La confirmation ou le motif de refus est un écran/modal séparé.
```

## Prompts de correction ciblée

Remplacer les éléments entre crochets. Un seul changement principal par demande permet de conserver les parties déjà satisfaisantes.

### Si la photo ou le verre disparaissent

```text
Reprends uniquement l'écran [ID] existant en conservant son contenu, sa navigation et sa disposition.
Corrige le traitement visuel : photo éducative plein écran, voile vert forêt, espaces visibles entre panneaux, sidebar sombre translucide et cartes crème en verre dépoli.
Le fond photo doit être réellement perceptible dans les marges et doucement derrière le verre. Les tableaux et formulaires restent lisibles sur une surface claire à 88–94 % d'opacité.
Garde les dimensions et les intitulés de la page. Livre seulement cette version corrigée.
```

### Si plusieurs pages sont mélangées

```text
Le résultat doit représenter uniquement [ID — nom de page] dans le rôle [rôle].
Conserve le shell de ce rôle, puis affiche uniquement le contenu et les actions demandés pour cette page.
Produis une seule capture à taille réelle, avec un seul état principal. Les autres pages, onglets alternatifs, modales et variantes seront traités séparément.
```

### Si le résultat ressemble à un dashboard générique

```text
Conserve les données et la structure fonctionnelle de [ID].
Rapproche le design de l'identité Kon-fanan de la référence : vert forêt profond, crème chaud, bouton menthe, touches jaune/orange très limitées, photographie éducative calme et verre dépoli.
Remplace les graphiques décoratifs et les KPI sans utilité par les informations et actions explicitement demandées pour cette page.
Renforce la hiérarchie typographique et laisse une seule action primaire dominer.
```

### Pour demander une variante sans mélanger les états

```text
À partir de [ID] validé, produis uniquement sa variante [nom de l'état].
Conserve exactement le fond, les composants, les espacements et la navigation.
Change seulement les éléments nécessaires à cet état : [différences].
Livre un seul écran. Si c'est une modale, montre-la sur sa page d'origine assombrie.
```

## Vérification visuelle avant de passer à la page suivante

- Une seule page et un seul rôle sont représentés.
- Le lien actif de la sidebar correspond à la tâche.
- La photo reste visible et le glassmorphism est perceptible.
- Les champs, tableaux et textes restent lisibles.
- L'action principale est immédiatement identifiable.
- Les actions correspondent aux droits du rôle.
- Les états prêts, en attente et indisponibles ne se contredisent pas.
- Les noms de matières, groupes et professeurs sont cohérents avec les pages précédentes.
- La version mobile réorganise la page au lieu de réduire le desktop.
- Les données de démonstration restent identifiées.

## Références du projet

- [Image de landing Kon-fanan](KON-FANAN_LANDING_PAGE_CONCEPT.png).
- [Cahier des charges fonctionnel et technique](KON-FANAN_CAHIER_DES_CHARGES.md).

Ces prompts sont une proposition de direction UI/UX. Ils précisent des dispositions et dimensions utiles à la conception ; ils ne modifient pas les règles de permissions et de données du cahier des charges.
