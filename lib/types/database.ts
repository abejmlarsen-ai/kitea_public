export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      hunt_locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          nft_image_url: string | null
          nft_token_id: number | null
          page_path: string | null
          total_scans: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          nft_image_url?: string | null
          nft_token_id?: number | null
          page_path?: string | null
          total_scans?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          nft_image_url?: string | null
          nft_token_id?: number | null
          page_path?: string | null
          total_scans?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nfc_tags: {
        Row: {
          created_at: string | null
          hunt_location_id: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          tag_uid: string | null
          uid: string
        }
        Insert: {
          created_at?: string | null
          hunt_location_id?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          tag_uid?: string | null
          uid: string
        }
        Update: {
          created_at?: string | null
          hunt_location_id?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          tag_uid?: string | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfc_tags_hunt_location_id_fkey"
            columns: ["hunt_location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_tags_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_tokens: {
        Row: {
          chain: string | null
          contract_address: string | null
          edition_number: number | null
          hunt_location_id: string | null
          id: string
          metadata_uri: string | null
          minted_at: string | null
          scan_id: string | null
          status: string | null
          token_id: string | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          chain?: string | null
          contract_address?: string | null
          edition_number?: number | null
          hunt_location_id?: string | null
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          scan_id?: string | null
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          chain?: string | null
          contract_address?: string | null
          edition_number?: number | null
          hunt_location_id?: string | null
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          scan_id?: string | null
          status?: string | null
          token_id?: string | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_tokens_hunt_location_id_fkey"
            columns: ["hunt_location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_tokens_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          shipping_address: Json | null
          status: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_unlocks: {
        Row: {
          id: string
          product_id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_unlocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          hunt_location_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number | null
          required_location_id: string | null
          requires_scan: boolean | null
          stock_quantity: number | null
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hunt_location_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number | null
          required_location_id?: string | null
          requires_scan?: boolean | null
          stock_quantity?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hunt_location_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          required_location_id?: string | null
          requires_scan?: boolean | null
          stock_quantity?: number | null
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_hunt_location_id_fkey"
            columns: ["hunt_location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_required_location_id_fkey"
            columns: ["required_location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          is_admin: boolean | null
          last_name: string
          mobile_number: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id: string
          is_admin?: boolean | null
          last_name: string
          mobile_number?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_admin?: boolean | null
          last_name?: string
          mobile_number?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          hunt_location_id: string | null
          id: string
          location_id: string | null
          nfc_tag_id: string | null
          scan_number: number | null
          scanned_at: string | null
          tag_uid: string | null
          user_id: string
        }
        Insert: {
          hunt_location_id?: string | null
          id?: string
          location_id?: string | null
          nfc_tag_id?: string | null
          scan_number?: number | null
          scanned_at?: string | null
          tag_uid?: string | null
          user_id: string
        }
        Update: {
          hunt_location_id?: string | null
          id?: string
          location_id?: string | null
          nfc_tag_id?: string | null
          scan_number?: number | null
          scanned_at?: string | null
          tag_uid?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_hunt_location_id_fkey"
            columns: ["hunt_location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "hunt_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_nfc_tag_id_fkey"
            columns: ["nfc_tag_id"]
            isOneToOne: false
            referencedRelation: "nfc_tags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
