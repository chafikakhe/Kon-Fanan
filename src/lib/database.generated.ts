export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          is_current: boolean;
          label: string;
          row_version: number;
          starts_on: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          is_current?: boolean;
          label: string;
          row_version?: number;
          starts_on: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          is_current?: boolean;
          label?: string;
          row_version?: number;
          starts_on?: string;
          status?: string;
        };
        Relationships: [];
      };
      account_access: {
        Row: {
          activated_at: string | null;
          created_at: string;
          role: string;
          status: string;
          suspended_at: string | null;
          user_id: string;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          role?: string;
          status?: string;
          suspended_at?: string | null;
          user_id: string;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          role?: string;
          status?: string;
          suspended_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_access_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admission_requests: {
        Row: {
          accepted_enrollment_id: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          id: string;
          public_message: string;
          requested_class_id: string;
          status: string;
          student_id: string;
        };
        Insert: {
          accepted_enrollment_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          id?: string;
          public_message?: string;
          requested_class_id: string;
          status?: string;
          student_id: string;
        };
        Update: {
          accepted_enrollment_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          id?: string;
          public_message?: string;
          requested_class_id?: string;
          status?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admission_requests_accepted_enrollment_id_fkey";
            columns: ["accepted_enrollment_id"];
            isOneToOne: false;
            referencedRelation: "class_enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admission_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admission_requests_requested_class_id_fkey";
            columns: ["requested_class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admission_requests_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcement_resources: {
        Row: {
          announcement_id: string;
          file_id: string;
          id: string;
          label: string;
          position: number;
        };
        Insert: {
          announcement_id: string;
          file_id: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Update: {
          announcement_id?: string;
          file_id?: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_resources_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcement_resources_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          id: string;
          published_at: string | null;
          row_version: number;
          status: string;
          teaching_space_id: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          created_by: string;
          id?: string;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          teaching_space_id: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          teaching_space_id?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_teaching_space_id_fkey";
            columns: ["teaching_space_id"];
            isOneToOne: false;
            referencedRelation: "teaching_spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      class_enrollments: {
        Row: {
          academic_year_id: string;
          class_id: string;
          ended_at: string | null;
          id: string;
          joined_at: string;
          status: string;
          student_id: string;
        };
        Insert: {
          academic_year_id: string;
          class_id: string;
          ended_at?: string | null;
          id?: string;
          joined_at?: string;
          status?: string;
          student_id: string;
        };
        Update: {
          academic_year_id?: string;
          class_id?: string;
          ended_at?: string | null;
          id?: string;
          joined_at?: string;
          status?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_academic_year_id_fkey";
            columns: ["class_id", "academic_year_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "academic_year_id"];
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      class_subjects: {
        Row: {
          class_id: string;
          id: string;
          is_active: boolean;
          subject_id: string;
        };
        Insert: {
          class_id: string;
          id?: string;
          is_active?: boolean;
          subject_id: string;
        };
        Update: {
          class_id?: string;
          id?: string;
          is_active?: boolean;
          subject_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          academic_year_id: string;
          capacity: number;
          created_at: string;
          id: string;
          level_id: string;
          name: string;
          row_version: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          academic_year_id: string;
          capacity: number;
          created_at?: string;
          id?: string;
          level_id: string;
          name: string;
          row_version?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          academic_year_id?: string;
          capacity?: number;
          created_at?: string;
          id?: string;
          level_id?: string;
          name?: string;
          row_version?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_level_id_fkey";
            columns: ["level_id"];
            isOneToOne: false;
            referencedRelation: "levels";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_resources: {
        Row: {
          competition_id: string;
          file_id: string;
          id: string;
          label: string;
          position: number;
        };
        Insert: {
          competition_id: string;
          file_id: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Update: {
          competition_id?: string;
          file_id?: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "competition_resources_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_resources_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          closes_at: string;
          created_at: string;
          id: string;
          instructions: string;
          kind: string;
          leaderboard_enabled: boolean;
          max_score: number;
          opens_at: string;
          results_published_at: string | null;
          row_version: number;
          rules: string;
          status: string;
          summary: string;
          teaching_space_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          closes_at: string;
          created_at?: string;
          id?: string;
          instructions?: string;
          kind?: string;
          leaderboard_enabled?: boolean;
          max_score?: number;
          opens_at: string;
          results_published_at?: string | null;
          row_version?: number;
          rules?: string;
          status?: string;
          summary?: string;
          teaching_space_id: string;
          title?: string;
          updated_at?: string;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          id?: string;
          instructions?: string;
          kind?: string;
          leaderboard_enabled?: boolean;
          max_score?: number;
          opens_at?: string;
          results_published_at?: string | null;
          row_version?: number;
          rules?: string;
          status?: string;
          summary?: string;
          teaching_space_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitions_teaching_space_id_fkey";
            columns: ["teaching_space_id"];
            isOneToOne: false;
            referencedRelation: "teaching_spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      course_progress: {
        Row: {
          completed_at: string | null;
          course_id: string;
          started_at: string;
          status: string;
          student_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_id: string;
          started_at?: string;
          status: string;
          student_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          started_at?: string;
          status?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      course_resources: {
        Row: {
          course_id: string;
          file_id: string;
          id: string;
          label: string;
          position: number;
        };
        Insert: {
          course_id: string;
          file_id: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Update: {
          course_id?: string;
          file_id?: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_resources_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          body: string;
          chapter_label: string;
          content_language: string;
          created_at: string;
          created_by: string;
          id: string;
          position: number;
          published_at: string | null;
          row_version: number;
          status: string;
          summary: string;
          teaching_space_id: string;
          title: string;
          updated_at: string;
          video_id: string | null;
          video_provider: string | null;
        };
        Insert: {
          body?: string;
          chapter_label?: string;
          content_language?: string;
          created_at?: string;
          created_by: string;
          id?: string;
          position?: number;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          summary?: string;
          teaching_space_id: string;
          title?: string;
          updated_at?: string;
          video_id?: string | null;
          video_provider?: string | null;
        };
        Update: {
          body?: string;
          chapter_label?: string;
          content_language?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          position?: number;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          summary?: string;
          teaching_space_id?: string;
          title?: string;
          updated_at?: string;
          video_id?: string | null;
          video_provider?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_teaching_space_id_fkey";
            columns: ["teaching_space_id"];
            isOneToOne: false;
            referencedRelation: "teaching_spaces";
            referencedColumns: ["id"];
          },
        ];
      };
      evaluations: {
        Row: {
          created_at: string;
          feedback: string;
          id: string;
          max_score: number;
          published_at: string | null;
          reviewer_id: string;
          row_version: number;
          score: number | null;
          status: string;
          submission_version_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          feedback?: string;
          id?: string;
          max_score: number;
          published_at?: string | null;
          reviewer_id: string;
          row_version?: number;
          score?: number | null;
          status?: string;
          submission_version_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          feedback?: string;
          id?: string;
          max_score?: number;
          published_at?: string | null;
          reviewer_id?: string;
          row_version?: number;
          score?: number | null;
          status?: string;
          submission_version_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evaluations_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evaluations_submission_version_id_fkey";
            columns: ["submission_version_id"];
            isOneToOne: true;
            referencedRelation: "submission_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_resources: {
        Row: {
          exercise_id: string;
          file_id: string;
          id: string;
          label: string;
          position: number;
        };
        Insert: {
          exercise_id: string;
          file_id: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Update: {
          exercise_id?: string;
          file_id?: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_resources_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_resources_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          allow_late: boolean;
          course_id: string;
          created_at: string;
          difficulty: string;
          due_at: string | null;
          id: string;
          instructions: string;
          max_score: number;
          position: number;
          published_at: string | null;
          row_version: number;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          allow_late?: boolean;
          course_id: string;
          created_at?: string;
          difficulty?: string;
          due_at?: string | null;
          id?: string;
          instructions?: string;
          max_score?: number;
          position?: number;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Update: {
          allow_late?: boolean;
          course_id?: string;
          created_at?: string;
          difficulty?: string;
          due_at?: string | null;
          id?: string;
          instructions?: string;
          max_score?: number;
          position?: number;
          published_at?: string | null;
          row_version?: number;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          bucket: string;
          cleanup_failed: boolean;
          created_at: string;
          id: string;
          mime_type: string;
          object_path: string;
          original_name: string;
          owner_id: string;
          size_bytes: number;
          status: string;
          storage_deleted_at: string | null;
          target_id: string;
          target_type: string;
        };
        Insert: {
          bucket: string;
          cleanup_failed?: boolean;
          created_at?: string;
          id?: string;
          mime_type: string;
          object_path: string;
          original_name: string;
          owner_id: string;
          size_bytes: number;
          status?: string;
          storage_deleted_at?: string | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          bucket?: string;
          cleanup_failed?: boolean;
          created_at?: string;
          id?: string;
          mime_type?: string;
          object_path?: string;
          original_name?: string;
          owner_id?: string;
          size_bytes?: number;
          status?: string;
          storage_deleted_at?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      levels: {
        Row: {
          code: string;
          cycle: string;
          id: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          cycle: string;
          id?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          cycle?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          announcement_id: string;
          course_id: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          last_error_code: string | null;
          revision: number;
          row_version: number;
          starts_at: string;
          status: string;
          sync_status: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          announcement_id: string;
          course_id?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          last_error_code?: string | null;
          revision?: number;
          row_version?: number;
          starts_at: string;
          status?: string;
          sync_status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          announcement_id?: string;
          course_id?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          last_error_code?: string | null;
          revision?: number;
          row_version?: number;
          starts_at?: string;
          status?: string;
          sync_status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: true;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meetings_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          dedupe_key: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          target_id: string | null;
          target_type: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          dedupe_key: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          target_id?: string | null;
          target_type: string;
          type: string;
        };
        Update: {
          created_at?: string;
          dedupe_key?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          target_id?: string | null;
          target_type?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          preferred_language: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          preferred_language?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          preferred_language?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_subject_access: {
        Row: {
          class_id: string;
          class_subject_id: string;
          enrollment_id: string;
          granted_at: string;
          granted_by: string | null;
          id: string;
          revoked_at: string | null;
          status: string;
        };
        Insert: {
          class_id: string;
          class_subject_id: string;
          enrollment_id: string;
          granted_at?: string;
          granted_by?: string | null;
          id?: string;
          revoked_at?: string | null;
          status?: string;
        };
        Update: {
          class_id?: string;
          class_subject_id?: string;
          enrollment_id?: string;
          granted_at?: string;
          granted_by?: string | null;
          id?: string;
          revoked_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_subject_access_class_subject_id_class_id_fkey";
            columns: ["class_subject_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "class_subjects";
            referencedColumns: ["id", "class_id"];
          },
          {
            foreignKeyName: "student_subject_access_enrollment_id_class_id_fkey";
            columns: ["enrollment_id", "class_id"];
            isOneToOne: false;
            referencedRelation: "class_enrollments";
            referencedColumns: ["id", "class_id"];
          },
          {
            foreignKeyName: "student_subject_access_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          code: string;
          id: string;
          is_active: boolean;
          label: string;
        };
        Insert: {
          code: string;
          id?: string;
          is_active?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      submission_files: {
        Row: {
          file_id: string;
          id: string;
          position: number;
          submission_version_id: string;
        };
        Insert: {
          file_id: string;
          id?: string;
          position?: number;
          submission_version_id: string;
        };
        Update: {
          file_id?: string;
          id?: string;
          position?: number;
          submission_version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_files_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: true;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_files_submission_version_id_fkey";
            columns: ["submission_version_id"];
            isOneToOne: false;
            referencedRelation: "submission_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      submission_versions: {
        Row: {
          created_at: string;
          id: string;
          is_late: boolean;
          max_score_snapshot: number | null;
          statement_snapshot: string | null;
          student_comment: string;
          submission_id: string;
          submitted_at: string | null;
          version_number: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_late?: boolean;
          max_score_snapshot?: number | null;
          statement_snapshot?: string | null;
          student_comment?: string;
          submission_id: string;
          submitted_at?: string | null;
          version_number: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_late?: boolean;
          max_score_snapshot?: number | null;
          statement_snapshot?: string | null;
          student_comment?: string;
          submission_id?: string;
          submitted_at?: string | null;
          version_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "submission_versions_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          competition_id: string | null;
          created_at: string;
          exercise_id: string | null;
          id: string;
          latest_version_id: string | null;
          resubmit_requested_by: string | null;
          resubmit_until: string | null;
          row_version: number;
          status: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          competition_id?: string | null;
          created_at?: string;
          exercise_id?: string | null;
          id?: string;
          latest_version_id?: string | null;
          resubmit_requested_by?: string | null;
          resubmit_until?: string | null;
          row_version?: number;
          status?: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          competition_id?: string | null;
          created_at?: string;
          exercise_id?: string | null;
          id?: string;
          latest_version_id?: string | null;
          resubmit_requested_by?: string | null;
          resubmit_until?: string | null;
          row_version?: number;
          status?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "latest_version_belongs";
            columns: ["latest_version_id", "id"];
            isOneToOne: false;
            referencedRelation: "submission_versions";
            referencedColumns: ["id", "submission_id"];
          },
          {
            foreignKeyName: "submissions_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_resubmit_requested_by_fkey";
            columns: ["resubmit_requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teaching_spaces: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          class_subject_id: string;
          id: string;
          is_active: boolean;
          teacher_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          class_subject_id: string;
          id?: string;
          is_active?: boolean;
          teacher_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          class_subject_id?: string;
          id?: string;
          is_active?: boolean;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teaching_spaces_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teaching_spaces_class_subject_id_fkey";
            columns: ["class_subject_id"];
            isOneToOne: false;
            referencedRelation: "class_subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teaching_spaces_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_directory: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          email: string;
          id: string;
        }[];
      };
      archive_content: {
        Args: { p_expected_version: number; p_id: string; p_kind: string };
        Returns: undefined;
      };
      assign_teacher: {
        Args: {
          p_active?: boolean;
          p_class_subject_id: string;
          p_teacher_id: string;
        };
        Returns: Json;
      };
      can_manage_file_target: {
        Args: { p_target_id: string; p_target_type: string };
        Returns: boolean;
      };
      can_manage_space: { Args: { p_space_id: string }; Returns: boolean };
      can_manage_submission: {
        Args: { p_submission_id: string };
        Returns: boolean;
      };
      can_read_announcement: {
        Args: { p_announcement_id: string };
        Returns: boolean;
      };
      can_read_class: { Args: { p_class_id: string }; Returns: boolean };
      can_read_competition: {
        Args: { p_competition_id: string };
        Returns: boolean;
      };
      can_read_course: { Args: { p_course_id: string }; Returns: boolean };
      can_read_enrollment: {
        Args: { p_enrollment_id: string };
        Returns: boolean;
      };
      can_read_evaluation: {
        Args: { p_evaluation_id: string };
        Returns: boolean;
      };
      can_read_exercise: { Args: { p_exercise_id: string }; Returns: boolean };
      can_read_file: { Args: { p_file_id: string }; Returns: boolean };
      can_read_profile: { Args: { p_user_id: string }; Returns: boolean };
      can_read_space: { Args: { p_space_id: string }; Returns: boolean };
      can_read_submission: {
        Args: { p_submission_id: string };
        Returns: boolean;
      };
      competition_leaderboard: {
        Args: { p_competition_id: string };
        Returns: {
          is_me: boolean;
          max_score: number;
          pseudonym: string;
          rank: number;
          score: number;
        }[];
      };
      dashboard_counts: { Args: never; Returns: Json };
      decide_admission: {
        Args: {
          p_class_id?: string;
          p_decision: string;
          p_message?: string;
          p_request_id: string;
          p_subject_ids?: string[];
        };
        Returns: Json;
      };
      delete_draft_file: { Args: { p_file_id: string }; Returns: Json };
      finalize_file: {
        Args: {
          p_file_id: string;
          p_mime: string;
          p_object_path?: string;
          p_size: number;
        };
        Returns: Json;
      };
      get_audit_events: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: unknown[];
        SetofOptions: {
          from: "*";
          to: "audit_events";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_meeting_join_url: { Args: { p_meeting_id: string }; Returns: string };
      get_platform_settings: { Args: never; Returns: Json };
      google_connection_status: { Args: never; Returns: Json };
      has_subject_access: {
        Args: { p_class_subject_id: string };
        Returns: boolean;
      };
      integration_command: {
        Args: { p_action: string; p_data?: Json };
        Returns: Json;
      };
      integration_status: { Args: never; Returns: Json };
      is_active_role: { Args: { p_role: string }; Returns: boolean };
      mark_notification_read: { Args: { p_id?: string }; Returns: undefined };
      open_classes: {
        Args: never;
        Returns: {
          academic_year_id: string;
          id: string;
          level_id: string;
          level_label: string;
          name: string;
          year_label: string;
        }[];
      };
      publish_announcement: {
        Args: { p_announcement_id: string; p_expected_version: number };
        Returns: Json;
      };
      publish_competition: {
        Args: { p_competition_id: string; p_expected_version: number };
        Returns: Json;
      };
      publish_competition_results: {
        Args: { p_competition_id: string; p_expected_version: number };
        Returns: Json;
      };
      publish_course: {
        Args: { p_course_id: string; p_expected_version: number };
        Returns: Json;
      };
      publish_evaluation: {
        Args: { p_evaluation_id: string; p_expected_version: number };
        Returns: Json;
      };
      queue_meeting_operation: {
        Args: {
          p_changes?: Json;
          p_expected_version: number;
          p_idempotency_key: string;
          p_meeting_id: string;
          p_operation: string;
        };
        Returns: Json;
      };
      request_admission: { Args: { p_class_id: string }; Returns: Json };
      request_resubmission: {
        Args: { p_feedback: string; p_submission_id: string; p_until: string };
        Returns: Json;
      };
      reserve_file: {
        Args: {
          p_mime: string;
          p_name: string;
          p_size: number;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: Json;
      };
      retry_integration_job: { Args: { p_job_id: string }; Returns: Json };
      save_announcement: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_class: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_competition: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_course: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_evaluation: {
        Args: {
          p_expected_version?: number;
          p_feedback: string;
          p_score?: number;
          p_version_id: string;
        };
        Returns: Json;
      };
      save_exercise: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_meeting: {
        Args: { p_data: Json; p_expected_version?: number; p_id?: string };
        Returns: Json;
      };
      save_profile: {
        Args: { p_display_name: string; p_language?: string };
        Returns: Json;
      };
      save_reference: {
        Args: { p_data: Json; p_id?: string; p_kind: string };
        Returns: Json;
      };
      save_submission_draft: {
        Args: { p_comment?: string; p_version_id: string };
        Returns: Json;
      };
      set_account_status: {
        Args: { p_status: string; p_user_id: string };
        Returns: Json;
      };
      set_course_progress: {
        Args: { p_course_id: string; p_status: string };
        Returns: Json;
      };
      set_subject_access: {
        Args: {
          p_active: boolean;
          p_class_subject_id: string;
          p_enrollment_id: string;
        };
        Returns: Json;
      };
      start_submission_version: {
        Args: { p_competition_id?: string; p_exercise_id?: string };
        Returns: Json;
      };
      submit_work: {
        Args: { p_comment?: string; p_version_id: string };
        Returns: Json;
      };
      transfer_course: {
        Args: {
          p_course_id: string;
          p_expected_version: number;
          p_reason?: string;
          p_teaching_space_id: string;
        };
        Returns: Json;
      };
      transfer_student: {
        Args: {
          p_class_id: string;
          p_enrollment_id: string;
          p_subject_ids: string[];
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
