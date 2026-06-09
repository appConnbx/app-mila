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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          holding_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          holding_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          holding_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          external_event_id: string | null
          holding_id: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          provider: "hotmart" | "manual" | "stripe"
          status: "recebido" | "processado" | "ignorado" | "erro"
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          holding_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: "hotmart" | "manual" | "stripe"
          status?: "recebido" | "processado" | "ignorado" | "erro"
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_event_id?: string | null
          holding_id?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          provider?: "hotmart" | "manual" | "stripe"
          status?: "recebido" | "processado" | "ignorado" | "erro"
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_history: {
        Row: {
          changed_by: string | null
          created_at: string
          demand_id: string
          field_changed: string
          holding_id: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          demand_id: string
          field_changed: string
          holding_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          demand_id?: string
          field_changed?: string
          holding_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_history_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_history_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_observations: {
        Row: {
          author_id: string
          body: string
          created_at: string
          demand_id: string
          holding_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          demand_id: string
          holding_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          demand_id?: string
          holding_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demand_observations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_observations_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_observations_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          area_id: string | null
          channel: "web" | "mobile" | "whatsapp" | "api"
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string | null
          holding_id: string
          id: string
          organization_id: string
          origin_id: string
          priority: "baixa" | "media" | "alta"
          responsible_id: string
          status: "nova" | "trabalhando" | "finalizada"
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          channel?: "web" | "mobile" | "whatsapp" | "api"
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          holding_id: string
          id?: string
          organization_id: string
          origin_id: string
          priority?: "baixa" | "media" | "alta"
          responsible_id: string
          status?: "nova" | "trabalhando" | "finalizada"
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          channel?: "web" | "mobile" | "whatsapp" | "api"
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          holding_id?: string
          id?: string
          organization_id?: string
          origin_id?: string
          priority?: "baixa" | "media" | "alta"
          responsible_id?: string
          status?: "nova" | "trabalhando" | "finalizada"
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          event_id: string
          holding_id: string
          id: string
          person_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          holding_id: string
          id?: string
          person_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          holding_id?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          closed_at: string | null
          created_at: string
          event_date: string | null
          holding_id: string
          id: string
          name: string
          opened_at: string
          organization_id: string
          owner_id: string
          status: "aberto" | "fechado"
          type:
            | "reuniao"
            | "ata"
            | "comite"
            | "follow_up"
            | "alinhamento"
            | "plano_acao"
            | "diagnostico"
            | "outro"
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          event_date?: string | null
          holding_id: string
          id?: string
          name: string
          opened_at?: string
          organization_id: string
          owner_id: string
          status?: "aberto" | "fechado"
          type?:
            | "reuniao"
            | "ata"
            | "comite"
            | "follow_up"
            | "alinhamento"
            | "plano_acao"
            | "diagnostico"
            | "outro"
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          event_date?: string | null
          holding_id?: string
          id?: string
          name?: string
          opened_at?: string
          organization_id?: string
          owner_id?: string
          status?: "aberto" | "fechado"
          type?:
            | "reuniao"
            | "ata"
            | "comite"
            | "follow_up"
            | "alinhamento"
            | "plano_acao"
            | "diagnostico"
            | "outro"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          billing_email: string | null
          created_at: string
          id: string
          kind: "corporate" | "family"
          name: string
          slug: string
          status: "pending" | "active" | "suspended" | "canceled"
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          id?: string
          kind?: "corporate" | "family"
          name: string
          slug: string
          status?: "pending" | "active" | "suspended" | "canceled"
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          id?: string
          kind?: "corporate" | "family"
          name?: string
          slug?: string
          status?: "pending" | "active" | "suspended" | "canceled"
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          holding_id: string
          id: string
          person_id: string
          role:
            | "member"
            | "team_admin"
            | "area_admin"
            | "org_admin"
            | "holding_admin"
          scope_id: string
          scope_level: "holding" | "organization" | "area" | "team"
        }
        Insert: {
          created_at?: string
          holding_id: string
          id?: string
          person_id: string
          role:
            | "member"
            | "team_admin"
            | "area_admin"
            | "org_admin"
            | "holding_admin"
          scope_id: string
          scope_level: "holding" | "organization" | "area" | "team"
        }
        Update: {
          created_at?: string
          holding_id?: string
          id?: string
          person_id?: string
          role?:
            | "member"
            | "team_admin"
            | "area_admin"
            | "org_admin"
            | "holding_admin"
          scope_id?: string
          scope_level?: "holding" | "organization" | "area" | "team"
        }
        Relationships: [
          {
            foreignKeyName: "memberships_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          holding_id: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          holding_id: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          holding_id?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          active_event_id: string | null
          auth_user_id: string | null
          can_delegate: boolean
          created_at: string
          full_name: string
          holding_id: string
          id: string
          is_active: boolean
          organization_id: string
          role_title: string | null
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          active_event_id?: string | null
          auth_user_id?: string | null
          can_delegate?: boolean
          created_at?: string
          full_name: string
          holding_id: string
          id?: string
          is_active?: boolean
          organization_id: string
          role_title?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          active_event_id?: string | null
          auth_user_id?: string | null
          can_delegate?: boolean
          created_at?: string
          full_name?: string
          holding_id?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role_title?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_active_event_fk"
            columns: ["active_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_aliases: {
        Row: {
          alias: string
          created_at: string
          holding_id: string
          id: string
          person_id: string
        }
        Insert: {
          alias: string
          created_at?: string
          holding_id: string
          id?: string
          person_id: string
        }
        Update: {
          alias?: string
          created_at?: string
          holding_id?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_aliases_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_aliases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          account_kind: "corporate" | "family"
          billing_interval: string | null
          created_at: string
          currency: string
          description: string | null
          external_offer_code: string | null
          external_product_id: string | null
          extra_user_price_cents: number | null
          features: Json
          id: string
          included_users: number | null
          is_active: boolean
          max_users: number | null
          name: string
          price_cents: number | null
          provider: "hotmart" | "manual" | "stripe"
          slug: string
          updated_at: string
        }
        Insert: {
          account_kind?: "corporate" | "family"
          billing_interval?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_offer_code?: string | null
          external_product_id?: string | null
          extra_user_price_cents?: number | null
          features?: Json
          id?: string
          included_users?: number | null
          is_active?: boolean
          max_users?: number | null
          name: string
          price_cents?: number | null
          provider?: "hotmart" | "manual" | "stripe"
          slug: string
          updated_at?: string
        }
        Update: {
          account_kind?: "corporate" | "family"
          billing_interval?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          external_offer_code?: string | null
          external_product_id?: string | null
          extra_user_price_cents?: number | null
          features?: Json
          id?: string
          included_users?: number | null
          is_active?: boolean
          max_users?: number | null
          name?: string
          price_cents?: number | null
          provider?: "hotmart" | "manual" | "stripe"
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          buyer_email: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          external_subscription_code: string | null
          external_transaction: string | null
          holding_id: string
          id: string
          plan_id: string | null
          provider: "hotmart" | "manual" | "stripe"
          seats: number | null
          status:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "suspended"
            | "expired"
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_subscription_code?: string | null
          external_transaction?: string | null
          holding_id: string
          id?: string
          plan_id?: string | null
          provider?: "hotmart" | "manual" | "stripe"
          seats?: number | null
          status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "suspended"
            | "expired"
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_subscription_code?: string | null
          external_transaction?: string | null
          holding_id?: string
          id?: string
          plan_id?: string | null
          provider?: "hotmart" | "manual" | "stripe"
          seats?: number | null
          status?:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "suspended"
            | "expired"
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          holding_id: string
          id: string
          person_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          holding_id: string
          id?: string
          person_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          holding_id?: string
          id?: string
          person_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          area_id: string
          created_at: string
          holding_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          holding_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          holding_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          created_demand_id: string | null
          created_event_id: string | null
          from_phone: string
          holding_id: string | null
          id: string
          parsed_data: Json | null
          person_id: string | null
          raw_text: string | null
          status: "recebida" | "aguardando_confirmacao" | "criada" | "ignorada"
        }
        Insert: {
          created_at?: string
          created_demand_id?: string | null
          created_event_id?: string | null
          from_phone: string
          holding_id?: string | null
          id?: string
          parsed_data?: Json | null
          person_id?: string | null
          raw_text?: string | null
          status?: "recebida" | "aguardando_confirmacao" | "criada" | "ignorada"
        }
        Update: {
          created_at?: string
          created_demand_id?: string | null
          created_event_id?: string | null
          from_phone?: string
          holding_id?: string | null
          id?: string
          parsed_data?: Json | null
          person_id?: string | null
          raw_text?: string | null
          status?: "recebida" | "aguardando_confirmacao" | "criada" | "ignorada"
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_created_demand_id_fkey"
            columns: ["created_demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_created_event_id_fkey"
            columns: ["created_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      my_instances: {
        Args: Record<PropertyKey, never>
        Returns: {
          holding_id: string
          holding_name: string
          kind: "corporate" | "family"
          person_id: string
          role_title: string
        }[]
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
