/**
 * Auto-generated from Supabase (project schema).
 *
 * Regenerate via Supabase MCP `generate_typescript_types`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          rarity: string
          requirement: string | null
          requirement_type: string | null
          requirement_value: number | null
          xp_reward: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          rarity: string
          requirement?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          xp_reward: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
          requirement?: string | null
          requirement_type?: string | null
          requirement_value?: number | null
          xp_reward?: number
        }
        Relationships: []
      }
      admin_setup: {
        Row: {
          admin_email: string | null
          created_at: string | null
          id: string
          is_used: boolean | null
          setup_code: string
          used_at: string | null
        }
        Insert: {
          admin_email?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          setup_code: string
          used_at?: string | null
        }
        Update: {
          admin_email?: string | null
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          setup_code?: string
          used_at?: string | null
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          client_id: string
          created_at: string | null
          hip_cm: number | null
          id: string
          recorded_at: string | null
          thigh_cm: number | null
          waist_cm: number | null
          weight: number | null
        }
        Insert: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id: string
          created_at?: string | null
          hip_cm?: number | null
          id: string
          recorded_at?: string | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight?: number | null
        }
        Update: {
          arm_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id?: string
          created_at?: string | null
          hip_cm?: number | null
          id?: string
          recorded_at?: string | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_exercise_overrides: {
        Row: {
          changed_by: string
          client_routine_id: string
          created_at: string
          id: string
          notified_coach: boolean
          original_routine_exercise_id: number
          reason: string | null
          replacement_exercise_id: string
          updated_at: string
        }
        Insert: {
          changed_by?: string
          client_routine_id: string
          created_at?: string
          id?: string
          notified_coach?: boolean
          original_routine_exercise_id: number
          reason?: string | null
          replacement_exercise_id: string
          updated_at?: string
        }
        Update: {
          changed_by?: string
          client_routine_id?: string
          created_at?: string
          id?: string
          notified_coach?: boolean
          original_routine_exercise_id?: number
          reason?: string | null
          replacement_exercise_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_exercise_overrides_client_routine_id_fkey"
            columns: ["client_routine_id"]
            isOneToOne: false
            referencedRelation: "client_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_exercise_overrides_original_routine_exercise_id_fkey"
            columns: ["original_routine_exercise_id"]
            isOneToOne: false
            referencedRelation: "routine_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_exercise_overrides_replacement_exercise_id_fkey"
            columns: ["replacement_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      client_routines: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          client_id: string
          created_at: string | null
          current_day_index: number | null
          current_week: number | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          notes: string | null
          override_next_day_id: string | null
          routine_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id: string
          created_at?: string | null
          current_day_index?: number | null
          current_week?: number | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          notes?: string | null
          override_next_day_id?: string | null
          routine_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          client_id?: string
          created_at?: string | null
          current_day_index?: number | null
          current_week?: number | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          notes?: string | null
          override_next_day_id?: string | null
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_routines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_routines_override_next_day_id_fkey"
            columns: ["override_next_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          admin_approved: boolean | null
          approval_date: string | null
          assigned_routine_id: string | null
          avatar_url: string | null
          birth_date: string | null
          coach_id: string | null
          created_at: string | null
          current_plan_id: string | null
          current_weight: number | null
          email: string | null
          experience_level: string | null
          full_name: string
          gender: string | null
          goal: string | null
          height: number | null
          id: string
          initial_weight: number | null
          last_payment_date: string | null
          last_session_at: string | null
          membership_end: string | null
          membership_start: string | null
          notes: string | null
          phone: string | null
          status: string
          suspension_reason: string | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          approval_date?: string | null
          assigned_routine_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          coach_id?: string | null
          created_at?: string | null
          current_plan_id?: string | null
          current_weight?: number | null
          email?: string | null
          experience_level?: string | null
          full_name: string
          gender?: string | null
          goal?: string | null
          height?: number | null
          id: string
          initial_weight?: number | null
          last_payment_date?: string | null
          last_session_at?: string | null
          membership_end?: string | null
          membership_start?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          suspension_reason?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          approval_date?: string | null
          assigned_routine_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          coach_id?: string | null
          created_at?: string | null
          current_plan_id?: string | null
          current_weight?: number | null
          email?: string | null
          experience_level?: string | null
          full_name?: string
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          initial_weight?: number | null
          last_payment_date?: string | null
          last_session_at?: string | null
          membership_end?: string | null
          membership_start?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          suspension_reason?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_routine_id_fkey"
            columns: ["assigned_routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pain_reports: {
        Row: {
          body_region: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          reported_at: string
          resolved_at: string | null
          severity: number
        }
        Insert: {
          body_region: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          severity: number
        }
        Update: {
          body_region?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          reported_at?: string
          resolved_at?: string | null
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_pain_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          exercise_id: string
          exercise_name: string
          id: string
          is_pr: boolean | null
          is_warmup: boolean | null
          notes: string | null
          performed_at: string | null
          reps: number | null
          routine_exercise_id: number | null
          rpe: number | null
          set_number: number
          updated_at: string | null
          user_id: string
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id: string
          exercise_name?: string
          id?: string
          is_pr?: boolean | null
          is_warmup?: boolean | null
          notes?: string | null
          performed_at?: string | null
          reps?: number | null
          routine_exercise_id?: number | null
          rpe?: number | null
          set_number: number
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id?: string
          exercise_name?: string
          id?: string
          is_pr?: boolean | null
          is_warmup?: boolean | null
          notes?: string | null
          performed_at?: string | null
          reps?: number | null
          routine_exercise_id?: number | null
          rpe?: number | null
          set_number?: number
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_routine_exercise_id_fkey"
            columns: ["routine_exercise_id"]
            isOneToOne: false
            referencedRelation: "routine_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          body_parts: string[] | null
          body_parts_es: string[] | null
          created_at: string | null
          demo_video_url: string | null
          equipment: string | null
          equipment_es: string | null
          equipments: string[] | null
          exercise_type: string
          gif_url: string | null
          id: string
          image_url: string | null
          instructions: string[] | null
          instructions_es: string[] | null
          name: string
          name_es: string | null
          primary_muscle: string
          secondary_muscle: string | null
          secondary_muscles: string[] | null
          secondary_muscles_es: string[] | null
          target_muscles: string[] | null
          target_muscles_es: string[] | null
          technique_notes: string | null
          updated_at: string | null
          uses_external_load: boolean | null
        }
        Insert: {
          body_parts?: string[] | null
          body_parts_es?: string[] | null
          created_at?: string | null
          demo_video_url?: string | null
          equipment?: string | null
          equipment_es?: string | null
          equipments?: string[] | null
          exercise_type: string
          gif_url?: string | null
          id: string
          image_url?: string | null
          instructions?: string[] | null
          instructions_es?: string[] | null
          name: string
          name_es?: string | null
          primary_muscle: string
          secondary_muscle?: string | null
          secondary_muscles?: string[] | null
          secondary_muscles_es?: string[] | null
          target_muscles?: string[] | null
          target_muscles_es?: string[] | null
          technique_notes?: string | null
          updated_at?: string | null
          uses_external_load?: boolean | null
        }
        Update: {
          body_parts?: string[] | null
          body_parts_es?: string[] | null
          created_at?: string | null
          demo_video_url?: string | null
          equipment?: string | null
          equipment_es?: string | null
          equipments?: string[] | null
          exercise_type?: string
          gif_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string[] | null
          instructions_es?: string[] | null
          name?: string
          name_es?: string | null
          primary_muscle?: string
          secondary_muscle?: string | null
          secondary_muscles?: string[] | null
          secondary_muscles_es?: string[] | null
          target_muscles?: string[] | null
          target_muscles_es?: string[] | null
          technique_notes?: string | null
          updated_at?: string | null
          uses_external_load?: boolean | null
        }
        Relationships: []
      }
      gym_settings: {
        Row: {
          admin_id: string | null
          alert_days_before_expiry: number | null
          created_at: string | null
          currency: string | null
          daily_summary_hour: number | null
          gym_name: string
          id: string
          inactivity_alert_days: number | null
          logo_url: string | null
          phone: string | null
          schedule: string | null
          setup_completed: boolean | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          alert_days_before_expiry?: number | null
          created_at?: string | null
          currency?: string | null
          daily_summary_hour?: number | null
          gym_name?: string
          id?: string
          inactivity_alert_days?: number | null
          logo_url?: string | null
          phone?: string | null
          schedule?: string | null
          setup_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          alert_days_before_expiry?: number | null
          created_at?: string | null
          currency?: string | null
          daily_summary_hour?: number | null
          gym_name?: string
          id?: string
          inactivity_alert_days?: number | null
          logo_url?: string | null
          phone?: string | null
          schedule?: string | null
          setup_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invitation_codes: {
        Row: {
          client_id: string | null
          code: string
          created_at: string | null
          created_by: string
          email: string | null
          expires_at: string | null
          for_role: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          times_used: number | null
          used_by_user_id: string | null
        }
        Insert: {
          client_id?: string | null
          code: string
          created_at?: string | null
          created_by: string
          email?: string | null
          expires_at?: string | null
          for_role?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          used_by_user_id?: string | null
        }
        Update: {
          client_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string
          email?: string | null
          expires_at?: string | null
          for_role?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          times_used?: number | null
          used_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          coach_id: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_days: number
          id: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          from_user_id: string
          id: string
          is_read: boolean | null
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          from_user_id: string
          id?: string
          is_read?: boolean | null
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          to_user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          plan_id: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          id: string
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string | null
          client_id: string
          created_at: string | null
          estimated_1rm: number | null
          exercise_id: string
          exercise_name: string
          id: string
          max_time_seconds: number | null
          reps: number | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          achieved_at?: string | null
          client_id: string
          created_at?: string | null
          estimated_1rm?: number | null
          exercise_id: string
          exercise_name: string
          id?: string
          max_time_seconds?: number | null
          reps?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          achieved_at?: string | null
          client_id?: string
          created_at?: string | null
          estimated_1rm?: number | null
          exercise_id?: string
          exercise_name?: string
          id?: string
          max_time_seconds?: number | null
          reps?: number | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_events: {
        Row: {
          achieved_at: string
          client_id: string
          created_at: string
          estimated_1rm: number | null
          exercise_id: string
          id: string
          kind: string
          meta: Json | null
          reps: number | null
          weight_kg: number | null
          workout_session_id: string | null
        }
        Insert: {
          achieved_at?: string
          client_id: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_id: string
          id?: string
          kind: string
          meta?: Json | null
          reps?: number | null
          weight_kg?: number | null
          workout_session_id?: string | null
        }
        Update: {
          achieved_at?: string
          client_id?: string
          created_at?: string
          estimated_1rm?: number | null
          exercise_id?: string
          id?: string
          kind?: string
          meta?: Json | null
          reps?: number | null
          weight_kg?: number | null
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pr_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_events_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_events_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          experience_level: string | null
          fitness_goal: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_workout_at: string | null
          level: number | null
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          role: string
          streak_days: number | null
          subscription_ends_at: string | null
          subscription_status: string | null
          updated_at: string | null
          username: string | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          experience_level?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_workout_at?: string | null
          level?: number | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role: string
          streak_days?: number | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          experience_level?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_workout_at?: string | null
          level?: number | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: string
          streak_days?: number | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          username?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string
          taken_at: string | null
          view_type: string | null
          weight_kg: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url: string
          taken_at?: string | null
          view_type?: string | null
          weight_kg?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string
          taken_at?: string | null
          view_type?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_days: {
        Row: {
          created_at: string | null
          day_name: string
          day_number: number
          focus: string | null
          id: string
          is_rest_day: boolean | null
          notes: string | null
          routine_id: string
        }
        Insert: {
          created_at?: string | null
          day_name: string
          day_number: number
          focus?: string | null
          id: string
          is_rest_day?: boolean | null
          notes?: string | null
          routine_id: string
        }
        Update: {
          created_at?: string | null
          day_name?: string
          day_number?: number
          focus?: string | null
          id?: string
          is_rest_day?: boolean | null
          notes?: string | null
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          exercise_id: string
          id: number
          notes: string | null
          order_index: number
          reps: string | null
          rest_seconds: number
          routine_day_id: string
          sets: number
          suggested_weight: number | null
          superset_group: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id: string
          id?: number
          notes?: string | null
          order_index: number
          reps?: string | null
          rest_seconds: number
          routine_day_id: string
          sets: number
          suggested_weight?: number | null
          superset_group?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          exercise_id?: string
          id?: number
          notes?: string | null
          order_index?: number
          reps?: string | null
          rest_seconds?: number
          routine_day_id?: string
          sets?: number
          suggested_weight?: number | null
          superset_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_week_progress: {
        Row: {
          client_routine_id: string
          completed_at: string | null
          created_at: string | null
          day_number: number
          id: string
          week_number: number
          workout_session_id: string | null
        }
        Insert: {
          client_routine_id: string
          completed_at?: string | null
          created_at?: string | null
          day_number: number
          id?: string
          week_number: number
          workout_session_id?: string | null
        }
        Update: {
          client_routine_id?: string
          completed_at?: string | null
          created_at?: string | null
          day_number?: number
          id?: string
          week_number?: number
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_week_progress_client_routine_id_fkey"
            columns: ["client_routine_id"]
            isOneToOne: false
            referencedRelation: "client_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_week_progress_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          coach_id: string | null
          created_at: string | null
          days_per_week: number
          description: string | null
          duration_weeks: number | null
          goal: string | null
          id: string
          level: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          days_per_week: number
          description?: string | null
          duration_weeks?: number | null
          goal?: string | null
          id: string
          level?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          days_per_week?: number
          description?: string | null
          duration_weeks?: number | null
          goal?: string | null
          id?: string
          level?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          created_at: string | null
          duration_minutes: number | null
          exercises_completed: number | null
          exercises_skipped: number | null
          feeling_note: string | null
          feeling_score: number | null
          finished_at: string | null
          id: string
          routine_day_id: string | null
          started_at: string | null
          status: string
          total_volume_kg: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: number | null
          exercises_skipped?: number | null
          feeling_note?: string | null
          feeling_score?: number | null
          finished_at?: string | null
          id?: string
          routine_day_id?: string | null
          started_at?: string | null
          status: string
          total_volume_kg?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: number | null
          exercises_skipped?: number | null
          feeling_note?: string | null
          feeling_score?: number | null
          finished_at?: string | null
          id?: string
          routine_day_id?: string | null
          started_at?: string | null
          status?: string
          total_volume_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          achievements_count: number | null
          avatar_url: string | null
          full_name: string | null
          id: string | null
          level: number | null
          rank: number | null
          xp_points: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_xp: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      check_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          achievement_name: string
        }[]
      }
      client_achievement_session_rollups: {
        Args: { p_client_id: string; p_tz: string }
        Returns: Json
      }
      get_user_client: {
        Args: { p_user_id: string }
        Returns: {
          admin_approved: boolean
          client_id: string
          current_plan_id: string
          full_name: string
          membership_end: string
          status: string
        }[]
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: {
          achievements_unlocked: number
          current_level: number
          current_streak: number
          total_prs: number
          total_sets: number
          total_workouts: number
          total_xp: number
        }[]
      }
      has_active_subscription: { Args: { p_user_id: string }; Returns: boolean }
      latest_completed_session_by_clients: {
        Args: { client_ids: string[] }
        Returns: { client_id: string; started_at: string }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_receptionist: { Args: never; Returns: boolean }
      register_first_admin: {
        Args: { p_email: string; p_setup_code: string; p_user_id: string }
        Returns: boolean
      }
      use_invitation_code_atomic: {
        Args: { code_text: string; user_id_val: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

