# Inscription et validation des étudiants

L’inscription conserve l’email et le mot de passe et demande un numéro WhatsApp obligatoire. Les numéros marocains `06…`/`07…` sont normalisés en `+212…` ; les numéros internationaux utilisent leur indicatif. Le compte reste `student / pending` et l’étudiant voit « Ton compte est en cours de traitement ». Aucun accès pédagogique n’est ouvert avant la décision administrative.

Le parcours commence par le pack, puis le niveau et les matières, avant d’afficher les informations personnelles. Le CTA « Connexion » ouvre la page de départ avec le grand bouton « Sign in » ; un lien séparé permet la connexion d’un compte existant. La création du compte enregistre aussi la demande du pack choisi ; aucun choix supplémentaire de classe n’est demandé dans ce parcours. L’administration retrouve la demande dans « Packs et achats », avec un lien vers le dossier et le contact WhatsApp de l’étudiant.

La confirmation par email doit être désactivée dans Supabase Auth (`mailer_autoconfirm: true` dans l’API Management, `auth.email.enable_confirmations = false` en local). Cela supprime l’envoi d’un email au signup ; les autres parcours email, notamment la récupération par email, nécessitent toujours un fournisseur SMTP si utilisés. La session obtenue immédiatement permet seulement de consulter l’état de traitement et les demandes de packs.

## Données et administration

La migration `0008_student_whatsapp.sql` ajoute `student_contacts`, lisible uniquement par l’étudiant concerné et les administrateurs actifs. Les professeurs et autres étudiants n’y ont pas accès. Le trigger crée le contact et, lorsqu’une classe est choisie, la demande d’admission dans la même transaction que l’identité Auth. Il ne fait confiance à aucune revendication de rôle ou de statut dans les métadonnées utilisateur. Les anciens comptes peuvent compléter leur numéro depuis la page d’attente ou auprès de l’administration.

Le dossier d’admission et le profil étudiant affichent le numéro. Après acceptation, « Préparer le message de validation WhatsApp » ouvre une conversation avec un message prérempli ; **l’administrateur vérifie et envoie lui-même le message**. Aucune intégration WhatsApp Business automatique n’est simulée et aucune notification n’est marquée comme envoyée par le simple clic.

## Mots de passe oubliés

Le mot de passe choisi par l’étudiant n’est jamais récupéré ni stocké en clair. Pour un compte étudiant actif, l’administrateur peut générer un nouveau mot de passe aléatoire. `student-password-reset` contrôle le rôle admin actif, la cible étudiante active et les limites serveur avant de mettre à jour Supabase Auth, sans envoyer d’email.

Le nouveau mot de passe apparaît seulement dans la fenêtre de confirmation, puis disparaît à sa fermeture. Il peut être copié et collé manuellement dans la conversation WhatsApp du numéro enregistré. Aucun mot de passe n’est placé dans une URL WhatsApp, les profils, les métadonnées, le stockage navigateur ou les journaux. Seules les demandes de réinitialisation sont auditées, sans identifiants secrets. Limites : 20 demandes par heure et administrateur, une par minute et étudiant. L’étudiant peut ensuite modifier son mot de passe depuis Mon profil → Sécurité.

## Déploiement

Appliquer uniquement la migration additive, déployer `student-password-reset`, puis publier le frontend. Désactiver la confirmation email dans le projet hébergé après vérification de ce parcours. Ne pas pousser l’intégralité du `config.toml` local vers la production : les URL et les autres réglages du projet distant doivent être conservés.

Vérifications : tests SQL/RLS, tests Edge, contrats navigateur Auth (inscription sans email, compte en attente, acceptation et copie des nouveaux identifiants), tests unitaires et build.
