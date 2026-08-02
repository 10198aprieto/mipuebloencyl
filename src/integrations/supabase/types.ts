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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      calidad_aire_municipio: {
        Row: {
          contaminante: string | null
          distancia_km: number | null
          estacion_mas_cercana: string | null
          fecha_dato: string | null
          municipio_id: string
          ultimo_valor: number | null
          updated_at: string
        }
        Insert: {
          contaminante?: string | null
          distancia_km?: number | null
          estacion_mas_cercana?: string | null
          fecha_dato?: string | null
          municipio_id: string
          ultimo_valor?: number | null
          updated_at?: string
        }
        Update: {
          contaminante?: string | null
          distancia_km?: number | null
          estacion_mas_cercana?: string | null
          fecha_dato?: string | null
          municipio_id?: string
          ultimo_valor?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calidad_aire_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calidad_aire_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      estaciones_aire: {
        Row: {
          contaminante: string | null
          fecha_dato: string | null
          geom: unknown
          id: string
          latitud: number
          localizacion: string | null
          longitud: number
          nombre: string
          operativa: boolean | null
          provincia: string | null
          ultimo_valor: number | null
          updated_at: string
        }
        Insert: {
          contaminante?: string | null
          fecha_dato?: string | null
          geom?: unknown
          id?: string
          latitud: number
          localizacion?: string | null
          longitud: number
          nombre: string
          operativa?: boolean | null
          provincia?: string | null
          ultimo_valor?: number | null
          updated_at?: string
        }
        Update: {
          contaminante?: string | null
          fecha_dato?: string | null
          geom?: unknown
          id?: string
          latitud?: number
          localizacion?: string | null
          longitud?: number
          nombre?: string
          operativa?: boolean | null
          provincia?: string | null
          ultimo_valor?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      estaciones_autobus: {
        Row: {
          direccion: string | null
          geom: unknown
          id: string
          latitud: number
          longitud: number
          nombre: string
          provincia: string | null
          updated_at: string
        }
        Insert: {
          direccion?: string | null
          geom?: unknown
          id?: string
          latitud: number
          longitud: number
          nombre: string
          provincia?: string | null
          updated_at?: string
        }
        Update: {
          direccion?: string | null
          geom?: unknown
          id?: string
          latitud?: number
          longitud?: number
          nombre?: string
          provincia?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      indice_servicios: {
        Row: {
          indice_calculado: number | null
          municipio_id: string
          sub_aire: number | null
          sub_educacion: number | null
          sub_salud: number | null
          sub_transporte: number | null
          updated_at: string
        }
        Insert: {
          indice_calculado?: number | null
          municipio_id: string
          sub_aire?: number | null
          sub_educacion?: number | null
          sub_salud?: number | null
          sub_transporte?: number | null
          updated_at?: string
        }
        Update: {
          indice_calculado?: number | null
          municipio_id?: string
          sub_aire?: number | null
          sub_educacion?: number | null
          sub_salud?: number | null
          sub_transporte?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indice_servicios_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indice_servicios_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          cod_ine: number
          cod_municipio: string | null
          cod_provincia: string | null
          geom: unknown
          id: string
          latitud: number | null
          longitud: number | null
          nombre: string
          nombre_norm: string | null
          poblacion: number | null
          provincia: string
          provincia_norm: string | null
          updated_at: string
        }
        Insert: {
          cod_ine: number
          cod_municipio?: string | null
          cod_provincia?: string | null
          geom?: unknown
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre: string
          nombre_norm?: string | null
          poblacion?: number | null
          provincia: string
          provincia_norm?: string | null
          updated_at?: string
        }
        Update: {
          cod_ine?: number
          cod_municipio?: string | null
          cod_provincia?: string | null
          geom?: unknown
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre?: string
          nombre_norm?: string | null
          poblacion?: number | null
          provincia?: string
          provincia_norm?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      servicios_educacion: {
        Row: {
          municipio_id: string
          num_centros: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_centros?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_centros?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_educacion_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_educacion_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_salud: {
        Row: {
          municipio_id: string
          num_centros_salud: number
          num_hospitales_consultorios: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_centros_salud?: number
          num_hospitales_consultorios?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_centros_salud?: number
          num_hospitales_consultorios?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_salud_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_salud_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_log: {
        Row: {
          ejecutado_en: string
          fuente: string
          id: string
          mensaje: string | null
          ok: boolean
          registros: number | null
        }
        Insert: {
          ejecutado_en?: string
          fuente: string
          id?: string
          mensaje?: string | null
          ok?: boolean
          registros?: number | null
        }
        Update: {
          ejecutado_en?: string
          fuente?: string
          id?: string
          mensaje?: string | null
          ok?: boolean
          registros?: number | null
        }
        Relationships: []
      }
      transporte_municipio: {
        Row: {
          distancia_km: number | null
          estacion_autobus_mas_cercana: string | null
          municipio_id: string
          updated_at: string
        }
        Insert: {
          distancia_km?: number | null
          estacion_autobus_mas_cercana?: string | null
          municipio_id: string
          updated_at?: string
        }
        Update: {
          distancia_km?: number | null
          estacion_autobus_mas_cercana?: string | null
          municipio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporte_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transporte_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      medias_comunidad: {
        Row: {
          indice_medio: number | null
          media_aire: number | null
          media_distancia_bus_km: number | null
          media_educacion: number | null
          media_salud: number | null
          num_municipios: number | null
        }
        Relationships: []
      }
      medias_provincia: {
        Row: {
          indice_medio: number | null
          media_aire: number | null
          media_distancia_bus_km: number | null
          media_educacion: number | null
          media_salud: number | null
          num_municipios: number | null
          provincia: string | null
        }
        Relationships: []
      }
      vista_municipios: {
        Row: {
          aire_contaminante: string | null
          aire_fecha_dato: string | null
          aire_ultimo_valor: number | null
          cod_ine: number | null
          distancia_aire_km: number | null
          distancia_bus_km: number | null
          estacion_aire: string | null
          estacion_autobus_mas_cercana: string | null
          id: string | null
          indice_calculado: number | null
          latitud: number | null
          longitud: number | null
          nombre: string | null
          num_centros_educativos: number | null
          num_centros_salud: number | null
          num_hospitales_consultorios: number | null
          poblacion: number | null
          provincia: string | null
          sub_aire: number | null
          sub_educacion: number | null
          sub_salud: number | null
          sub_transporte: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_calidad_aire: { Args: never; Returns: number }
      calcular_transporte: { Args: never; Returns: number }
      norm_txt: { Args: { t: string }; Returns: string }
      recalcular_indice_servicios: { Args: never; Returns: number }
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
