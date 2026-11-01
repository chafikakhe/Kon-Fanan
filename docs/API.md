# Contrats de données

Les lectures utilisent la session Supabase et RLS. Les noms de colonnes suivent le cahier des charges. `src/lib/types.ts` décrit les DTO utilisés par React ; ce fichier est maintenu à la main. `src/lib/database.generated.ts` contient les types générés depuis le schéma Supabase réellement déployé. Pour générer les types exhaustifs depuis un projet déployé : `npx supabase gen types typescript --linked`.

Les listes chargent des pages API bornées à 100 lignes et proposent un affichage local de huit lignes. Les commandes `save_*` utilisent `p_data` et exigent `p_expected_version` pour une modification. Les acteurs viennent de `auth.uid()`, jamais d’un rôle transmis par React.

## RPC exposées

| Fonction | Arguments SQL |
|---|---|
| `open_classes` | `` |
| `discovery_catalog` | `p_level_id uuid default null,p_subject_id uuid default null,p_course_id uuid default null,p_exercise_id uuid default null,p_offset int default 0` — public, cours par pages de 24, exercices sans consigne |
| `request_pack_order` | `p_pack_id text,p_level_id uuid,p_subject_ids uuid[],p_idempotency_key uuid,p_course_id uuid default null,p_exercise_id uuid default null` — étudiant confirmé, demande sans activation |
| `review_pack_order` | `p_order_id uuid,p_decision text,p_payment_reference text default ''` — administrateur, règlement vérifié avant activation |
| `set_pack_availability` | `p_pack_id text,p_active boolean` — administrateur |
| `request_admission` | `p_class_id uuid` |
| `decide_admission` | `p_request_id uuid,p_decision text,p_class_id uuid default null,p_subject_ids uuid[] default '{}',p_message text default ''` |
| `save_class` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `set_subject_access` | `p_enrollment_id uuid,p_class_subject_id uuid,p_active boolean` |
| `assign_teacher` | `p_teacher_id uuid,p_class_subject_id uuid,p_active boolean default true` |
| `set_account_status` | `p_user_id uuid,p_status text` |
| `transfer_student` | `p_enrollment_id uuid,p_class_id uuid,p_subject_ids uuid[]` |
| `save_course` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `save_exercise` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `publish_course` | `p_course_id uuid,p_expected_version int` |
| `save_competition` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `publish_competition` | `p_competition_id uuid,p_expected_version int` |
| `save_announcement` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `publish_announcement` | `p_announcement_id uuid,p_expected_version int` |
| `save_meeting` | `p_data jsonb,p_id uuid default null,p_expected_version int default null` |
| `start_submission_version` | `p_exercise_id uuid default null,p_competition_id uuid default null` |
| `save_submission_draft` | `p_version_id uuid,p_comment text default ''` |
| `submit_work` | `p_version_id uuid,p_comment text default ''` |
| `save_evaluation` | `p_version_id uuid,p_feedback text,p_score numeric default null,p_expected_version int default null` |
| `publish_evaluation` | `p_evaluation_id uuid,p_expected_version int` |
| `request_resubmission` | `p_submission_id uuid,p_until timestamptz,p_feedback text` |
| `publish_competition_results` | `p_competition_id uuid,p_expected_version int` |
| `competition_leaderboard` | `p_competition_id uuid` |
| `set_course_progress` | `p_course_id uuid,p_status text` |
| `mark_notification_read` | `p_id uuid default null` |
| `reserve_file` | `p_target_type text,p_target_id uuid,p_name text,p_mime text,p_size bigint` |
| `finalize_file` | `p_file_id uuid,p_size bigint,p_mime text,p_object_path text default null` |
| `delete_draft_file` | `p_file_id uuid` |
| `archive_content` | `p_kind text,p_id uuid,p_expected_version int` |
| `transfer_course` | `p_course_id uuid,p_teaching_space_id uuid,p_expected_version int,p_reason text default ''` |
| `save_reference` | `p_kind text,p_data jsonb,p_id uuid default null` |
| `get_platform_settings` | `` |
| `get_audit_events` | `p_limit int default 50,p_offset int default 0` |
| `google_connection_status` | `` |
| `integration_status` | `` |
| `queue_meeting_operation` | `p_meeting_id uuid,p_operation text,p_expected_version int,p_idempotency_key text,p_changes jsonb default '{}'` |
| `retry_integration_job` | `p_job_id uuid` |
| `get_meeting_join_url` | `p_meeting_id uuid` |
| `integration_command` | `p_action text,p_data jsonb default '{}'` |
| `save_profile` | `p_display_name text,p_language text default 'fr'` |
| `dashboard_counts` | `` |
| `admin_directory` | `p_limit int default 100,p_offset int default 0` |

## Edge Functions

Appel frontend : `supabase.functions.invoke(nom, { body })`. Réponse `{ data, requestId }` ou `{ error: { code, message, retryable }, requestId }`.

| Fonction | Corps | Résultat utile |
|---|---|---|
| `teacher-invite` | `email, displayName` | Invitation Auth tracée |
| `files-prepare` | `targetType, targetId, originalName, mimeType, sizeBytes` | Réservation `id, bucket, object_path` |
| `files-finalize` | `fileId` | Métadonnées du fichier validé |
| `files-read-url` | `fileId` | `url, expiresIn` |
| `files-delete` | `fileId` | Retrait autorisé et nettoyage |
| `google-status` | `{}` | `state, email?` sans token |
| `google-oauth-start` | `{}` | `url` du ticket de lancement |
| `google-disconnect` | `{}` | `state, revocationSucceeded` |
| `meetings-publish` | `meetingId, expectedVersion, idempotencyKey` | Opération durable, état de préparation |
| `meetings-update` | idem + `changes` | Opération sur le même événement |
| `meetings-cancel` | `meetingId, expectedVersion, idempotencyKey` | Annulation locale immédiate et job Google |
| `meetings-join` | `meetingId` | URL Meet revalidée |

`google-oauth-redirect` et `google-oauth-callback` utilisent les preuves du flux OAuth. `integration-worker` reçoit le secret dédié dans `x-worker-secret` ; il ne doit jamais être appelé avec ce secret depuis React.

Les clés d’idempotence de séance ont au moins huit caractères. Un payload différent sous une même clé produit un conflit. Les reprises utilisent l’identifiant d’événement et la révision existants.
