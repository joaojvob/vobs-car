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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      engines: {
        Row: {
          aspiration: Database["public"]["Enums"]["aspiration"] | null
          code: string | null
          cylinders: number | null
          displacement_cc: number | null
          fuel: Database["public"]["Enums"]["fuel_type"]
          id: number
          manufacturer: string
          powertrain: Database["public"]["Enums"]["powertrain"]
          slug: string
        }
        Insert: {
          aspiration?: Database["public"]["Enums"]["aspiration"] | null
          code?: string | null
          cylinders?: number | null
          displacement_cc?: number | null
          fuel: Database["public"]["Enums"]["fuel_type"]
          id?: never
          manufacturer: string
          powertrain: Database["public"]["Enums"]["powertrain"]
          slug: string
        }
        Update: {
          aspiration?: Database["public"]["Enums"]["aspiration"] | null
          code?: string | null
          cylinders?: number | null
          displacement_cc?: number | null
          fuel?: Database["public"]["Enums"]["fuel_type"]
          id?: never
          manufacturer?: string
          powertrain?: Database["public"]["Enums"]["powertrain"]
          slug?: string
        }
        Relationships: []
      }
      fipe_brands: {
        Row: {
          fipe_code: string
          id: number
          models_synced_at: string | null
          name: string
          synced_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          fipe_code: string
          id?: never
          models_synced_at?: string | null
          name: string
          synced_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          fipe_code?: string
          id?: never
          models_synced_at?: string | null
          name?: string
          synced_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      fipe_model_years: {
        Row: {
          fipe_vehicle_code: string | null
          fipe_year_code: string
          fuel: Database["public"]["Enums"]["fuel_type"]
          id: number
          mapping_status: Database["public"]["Enums"]["mapping_status"]
          model_id: number
          model_year: number | null
          price_synced_at: string | null
          synced_at: string
          tech_profile_id: number | null
        }
        Insert: {
          fipe_vehicle_code?: string | null
          fipe_year_code: string
          fuel: Database["public"]["Enums"]["fuel_type"]
          id?: never
          mapping_status?: Database["public"]["Enums"]["mapping_status"]
          model_id: number
          model_year?: number | null
          price_synced_at?: string | null
          synced_at?: string
          tech_profile_id?: number | null
        }
        Update: {
          fipe_vehicle_code?: string | null
          fipe_year_code?: string
          fuel?: Database["public"]["Enums"]["fuel_type"]
          id?: never
          mapping_status?: Database["public"]["Enums"]["mapping_status"]
          model_id?: number
          model_year?: number | null
          price_synced_at?: string | null
          synced_at?: string
          tech_profile_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fipe_model_years_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "fipe_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fipe_model_years_tech_profile_id_fkey"
            columns: ["tech_profile_id"]
            isOneToOne: false
            referencedRelation: "tech_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fipe_models: {
        Row: {
          brand_id: number
          fipe_code: string
          id: number
          name: string
          synced_at: string
          years_synced_at: string | null
        }
        Insert: {
          brand_id: number
          fipe_code: string
          id?: never
          name: string
          synced_at?: string
          years_synced_at?: string | null
        }
        Update: {
          brand_id?: number
          fipe_code?: string
          id?: never
          name?: string
          synced_at?: string
          years_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fipe_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "fipe_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      fipe_prices: {
        Row: {
          id: number
          model_year_id: number
          price_cents: number
          reference_month: string
        }
        Insert: {
          id?: never
          model_year_id: number
          price_cents: number
          reference_month: string
        }
        Update: {
          id?: never
          model_year_id?: number
          price_cents?: number
          reference_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "fipe_prices_model_year_id_fkey"
            columns: ["model_year_id"]
            isOneToOne: false
            referencedRelation: "fipe_model_years"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          home_uf: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name: string
          home_uf?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string
          home_uf?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      tech_profiles: {
        Row: {
          body_type: Database["public"]["Enums"]["body_type"]
          brand_name: string
          created_at: string
          engine_id: number
          family: string
          generation: string
          id: number
          normalized_key: string
          transmission_id: number
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year_end: number | null
          year_start: number
        }
        Insert: {
          body_type: Database["public"]["Enums"]["body_type"]
          brand_name: string
          created_at?: string
          engine_id: number
          family: string
          generation: string
          id?: never
          normalized_key: string
          transmission_id: number
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year_end?: number | null
          year_start: number
        }
        Update: {
          body_type?: Database["public"]["Enums"]["body_type"]
          brand_name?: string
          created_at?: string
          engine_id?: number
          family?: string
          generation?: string
          id?: never
          normalized_key?: string
          transmission_id?: number
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          year_end?: number | null
          year_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "tech_profiles_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "engines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_profiles_transmission_id_fkey"
            columns: ["transmission_id"]
            isOneToOne: false
            referencedRelation: "transmissions"
            referencedColumns: ["id"]
          },
        ]
      }
      transmissions: {
        Row: {
          code: string | null
          final_drive: Database["public"]["Enums"]["final_drive"] | null
          gears: number | null
          id: number
          slug: string
          type: Database["public"]["Enums"]["transmission_type"]
        }
        Insert: {
          code?: string | null
          final_drive?: Database["public"]["Enums"]["final_drive"] | null
          gears?: number | null
          id?: never
          slug: string
          type: Database["public"]["Enums"]["transmission_type"]
        }
        Update: {
          code?: string | null
          final_drive?: Database["public"]["Enums"]["final_drive"] | null
          gears?: number | null
          id?: never
          slug?: string
          type?: Database["public"]["Enums"]["transmission_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      map_model_year: {
        Args: {
          p_engine: Json
          p_model_year_id: number
          p_profile: Json
          p_transmission: Json
        }
        Returns: number
      }
    }
    Enums: {
      aspiration: "natural" | "turbo" | "supercharged"
      body_type:
        | "hatch"
        | "sedan"
        | "suv"
        | "pickup"
        | "van"
        | "moto_street"
        | "moto_naked"
        | "moto_sport"
        | "moto_trail"
        | "moto_scooter"
        | "moto_custom"
      final_drive: "chain" | "belt" | "shaft" | "gear"
      fuel_type:
        | "gasoline"
        | "ethanol"
        | "flex"
        | "diesel"
        | "hybrid"
        | "electric"
      mapping_status: "pending" | "mapped" | "failed"
      powertrain: "ice" | "hybrid" | "phev" | "ev"
      transmission_type: "manual" | "automatic" | "cvt" | "dct" | "amt"
      user_role: "member" | "admin"
      vehicle_type: "car" | "motorcycle"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      aspiration: ["natural", "turbo", "supercharged"],
      body_type: [
        "hatch",
        "sedan",
        "suv",
        "pickup",
        "van",
        "moto_street",
        "moto_naked",
        "moto_sport",
        "moto_trail",
        "moto_scooter",
        "moto_custom",
      ],
      final_drive: ["chain", "belt", "shaft", "gear"],
      fuel_type: [
        "gasoline",
        "ethanol",
        "flex",
        "diesel",
        "hybrid",
        "electric",
      ],
      mapping_status: ["pending", "mapped", "failed"],
      powertrain: ["ice", "hybrid", "phev", "ev"],
      transmission_type: ["manual", "automatic", "cvt", "dct", "amt"],
      user_role: ["member", "admin"],
      vehicle_type: ["car", "motorcycle"],
    },
  },
} as const
