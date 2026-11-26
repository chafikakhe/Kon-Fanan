# Séances avec lien Google Meet fourni par le professeur

Le parcours principal ne nécessite ni Google Cloud, ni OAuth, ni worker externe. Dans Google Meet, le professeur crée une réunion pour une date ultérieure, copie son lien, puis remplit `/prof/seances/nouvelle` : groupe, titre, début/fin en Africa/Casablanca, description et lien. Il peut enregistrer un brouillon sans lien ou publier immédiatement avec un lien valide. La publication informe les étudiants autorisés de la matière.

Seuls les liens HTTPS de la forme `https://meet.google.com/abc-defg-hij` sont acceptés. Les paramètres facultatifs du lien copié sont retirés. La validation navigateur est doublée côté PostgreSQL. Le système ne vérifie pas qu’une réunion existe chez Google : le professeur est responsable de créer le lien et d’admettre les participants sur Meet.

La migration `0009_manual_meet_links.sql` ajoute `meetings.link_source` et une table privée `private.manual_meeting_links`. Le lien ne figure ni dans les lignes publiques `meetings`, ni dans les notifications, ni dans l’audit. L’enseignant responsable peut le récupérer pour modifier sa séance ; les étudiants passent exclusivement par `get_meeting_join_url`/`meetings-join`, avec vérification du compte, de la matière, de la publication et de la fenêtre d’accès existante. Annuler retire le lien et informe le groupe. Cela ne supprime pas la réunion sur Google Meet.

RPC authentifiés :

- `save_manual_meeting(p_data, p_publish, p_id?, p_expected_version?)` enregistre ou publie atomiquement ; réservé à l’enseignant actif responsable du groupe. Un lien reste obligatoire lors de la modification d’une séance publiée.
- `get_manual_meeting_link(p_meeting_id)` est réservé au gestionnaire du groupe, pour le formulaire d’édition.
- `cancel_manual_meeting(p_meeting_id, p_expected_version)` est réservé au gestionnaire du groupe ; l’administration peut aussi annuler.

Les versions empêchent un ancien onglet d’écraser une séance modifiée. L’enregistrement est limité à 60 opérations par heure et enseignant. Les anciennes séances déjà liées à Calendar restent dans leur parcours d’origine ; les brouillons sans événement Google sont repris dans le parcours manuel. Aucun secret, connexion OAuth ou événement Google existant n’est supprimé. Les jobs Google refusent les séances manuelles.

La page historique `/prof/integrations/google` présente désormais les instructions du parcours manuel. Le tableau de bord professeur ne fait plus de requête `google-status` et le menu n’exige plus de connexion Google.

Validation : suite PostgreSQL/RLS (publication sans connexion Google, URL hostile, autres enseignants/étudiants, notification, fenêtre d’accès, retrait matière, versions, annulation) et parcours navigateur à 390/1440 px (brouillon, publication, changement du lien, accès étudiant, annulation, aucune requête OAuth). Les réunions de ces tests sont des données fictives isolées : aucun appel réel à Google Meet n’est effectué.
