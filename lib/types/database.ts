// Auto-generated from Supabase — run `supabase gen types` to refresh.
// See: https://supabase.com/docs/guides/api/rest/generating-types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.1' }
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
          page_path: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          page_path?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          page_path?: string | null
        }
        Relationships: []
      }
      nfc_tags: {
        Row: {
          created_at: string | null
          hunt_location_id: string | null
          id: string
          is_active: boolean | null
          uid: string
        }
        Insert: {
          created_at?: string | null
          hunt_location_id?: string | null
          id?: string
          is_active?: boolean | null
          uid: string
        }
        Update: {
          created_at?: string | null
          hunt_location_id?: string | null
          id?: string
          is_active?: boolean | null
          uid?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nfc_tags_hunt_location_id_fkey'
            columns: ['hunt_location_id']
            isOneToOne: false
            referencedRelation: 'hunt_locations'
            referencedColumns: ['id']
          },
        ]
      }
      nft_tokens: {
        Row: {
          chain: string | null
          contract_address: string | null
          hunt_location_id: string | null
          id: string
          metadata_uri: string | null
          minted_at: string | null
          scan_id: string | null
          token_id: string | null
          user_id: string
        }
        Insert: {
          chain?: string | null
          contract_address?: string | null
          hunt_location_id?: string | null
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          scan_id?: string | null
          token_id?: string | null
          user_id: string
        }
        Update: {
          chain?: string | null
          contract_address?: string | null
          hunt_location_id?: string | null
          id?: string
          metadata_uri?: string | null
          minted_at?: string | null
          scan_id?: string | null
          token_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_unlocks: {
        Row: { id: string; product_id: string; unlocked_at: string | null; user_id: string }
        Insert: { id?: string; product_id: string; unlocked_at?: string | null; user_id: string }
        Update: { id?: string; product_id?: string; unlocked_at?: string | null; user_id?: string }
        Relationships: []
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
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hunt_location_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hunt_location_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          mobile_number: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name: string
          id: string
          last_name: string
          mobile_number?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string
          id?: string
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
          nfc_tag_id: string | null
          scanned_at: string | null
          user_id: string
        }
        Insert: {
          hunt_location_id?: string | null
          id?: string
          nfc_tag_id?: string | null
          scanned_at?: string | null
          user_id: string
        }
        Update: {
          hunt_location_id?: string | null
          id?: string
          nfc_tag_id?: string | null
          scanned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Convenience helpers ──────────────────────────────────────────────────────
type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

// Named table types for convenience
export type Profile      = Tables<'profiles'>
export type HuntLocation = Tables<'hunt_locations'>
export type NfcTag       = Tables<'nfc_tags'>
export type NftToken     = Tables<'nft_tokens'>
export type Scan         = Tables<'scans'>
export type Product      = Tables<'products'>
export type ProductUnlock = Tables<'product_unlocks'>
