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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          id: string
          new_status: string | null
          performed_by: string
          performed_by_role: string
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          performed_by: string
          performed_by_role: string
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          performed_by?: string
          performed_by_role?: string
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      banquet_halls: {
        Row: {
          amenities: Json | null
          capacity: number
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          name: string
          panorama_url: string | null
          price_per_hour: number
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          capacity: number
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name: string
          panorama_url?: string | null
          price_per_hour: number
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          name?: string
          panorama_url?: string | null
          price_per_hour?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_documents: {
        Row: {
          booking_id: string
          document_name: string
          document_type: string
          file_url: string
          id: string
          status: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          booking_id: string
          document_name: string
          document_type: string
          file_url: string
          id?: string
          status?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          booking_id?: string
          document_name?: string
          document_type?: string
          file_url?: string
          id?: string
          status?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_halls: {
        Row: {
          booking_id: string
          created_at: string
          hall_id: string
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          hall_id: string
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          hall_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_halls_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_halls_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "banquet_halls"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin1_notes: string | null
          admin2_notes: string | null
          advance_amount: number | null
          booking_date: string
          confirmation_number: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          end_time: string
          event_type: string | null
          guest_count: number | null
          id: string
          invoice_url: string | null
          notes: string | null
          payment_date: string | null
          payment_link: string | null
          payment_status: string | null
          slot_locked_until: string | null
          special_requests: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          super_admin_notes: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin1_notes?: string | null
          admin2_notes?: string | null
          advance_amount?: number | null
          booking_date: string
          confirmation_number?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          end_time: string
          event_type?: string | null
          guest_count?: number | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_status?: string | null
          slot_locked_until?: string | null
          special_requests?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          super_admin_notes?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin1_notes?: string | null
          admin2_notes?: string | null
          advance_amount?: number | null
          booking_date?: string
          confirmation_number?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          end_time?: string
          event_type?: string | null
          guest_count?: number | null
          id?: string
          invoice_url?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link?: string | null
          payment_status?: string | null
          slot_locked_until?: string | null
          special_requests?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          super_admin_notes?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: "admin1" | "admin2" | "super_admin" | "admin3"
      booking_status:
        | "pending"
        | "document_review"
        | "availability_check"
        | "payment_pending"
        | "final_approval"
        | "approved"
        | "change_requested"
        | "rejected"
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
    Enums: {
      admin_role: ["admin1", "admin2", "super_admin", "admin3"],
      booking_status: [
        "pending",
        "document_review",
        "availability_check",
        "payment_pending",
        "final_approval",
        "approved",
        "change_requested",
        "rejected",
      ],
    },
  },
} as const
