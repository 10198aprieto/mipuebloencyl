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
      colegios_profesionales_municipio: {
        Row: {
          municipio_id: string
          num_colegios_profesionales: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_colegios_profesionales?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_colegios_profesionales?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colegios_profesionales_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colegios_profesionales_municipio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      contexto_economico_provincia: {
        Row: {
          fecha: string | null
          parados_mujer: number | null
          parados_total: number | null
          parados_varon: number | null
          provincia: string
          provincia_norm: string | null
          tasa_paro: number | null
          updated_at: string
        }
        Insert: {
          fecha?: string | null
          parados_mujer?: number | null
          parados_total?: number | null
          parados_varon?: number | null
          provincia: string
          provincia_norm?: string | null
          tasa_paro?: number | null
          updated_at?: string
        }
        Update: {
          fecha?: string | null
          parados_mujer?: number | null
          parados_total?: number | null
          parados_varon?: number | null
          provincia?: string
          provincia_norm?: string | null
          tasa_paro?: number | null
          updated_at?: string
        }
        Relationships: []
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
          sub_comercio: number | null
          sub_cultura: number | null
          sub_educacion: number | null
          sub_movilidad: number | null
          sub_salud: number | null
          sub_social: number | null
          sub_transporte: number | null
          updated_at: string
        }
        Insert: {
          indice_calculado?: number | null
          municipio_id: string
          sub_aire?: number | null
          sub_comercio?: number | null
          sub_cultura?: number | null
          sub_educacion?: number | null
          sub_movilidad?: number | null
          sub_salud?: number | null
          sub_social?: number | null
          sub_transporte?: number | null
          updated_at?: string
        }
        Update: {
          indice_calculado?: number | null
          municipio_id?: string
          sub_aire?: number | null
          sub_comercio?: number | null
          sub_cultura?: number | null
          sub_educacion?: number | null
          sub_movilidad?: number | null
          sub_salud?: number | null
          sub_social?: number | null
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
          geom_poly: unknown
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
          geom_poly?: unknown
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
          geom_poly?: unknown
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
      servicios_comercio: {
        Row: {
          municipio_id: string
          num_colaboradores_carnet_joven: number
          num_establecimientos_comerciales: number
          num_servicios_proximidad: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_colaboradores_carnet_joven?: number
          num_establecimientos_comerciales?: number
          num_servicios_proximidad?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_colaboradores_carnet_joven?: number
          num_establecimientos_comerciales?: number
          num_servicios_proximidad?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_comercio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_comercio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_cultura_ocio: {
        Row: {
          municipio_id: string
          nombre_proxima_fiesta: string | null
          num_bibliotecas_bibliobuses: number
          num_museos: number
          proxima_fiesta: string | null
          tiene_fiestas_registradas: boolean
          updated_at: string
        }
        Insert: {
          municipio_id: string
          nombre_proxima_fiesta?: string | null
          num_bibliotecas_bibliobuses?: number
          num_museos?: number
          proxima_fiesta?: string | null
          tiene_fiestas_registradas?: boolean
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          nombre_proxima_fiesta?: string | null
          num_bibliotecas_bibliobuses?: number
          num_museos?: number
          proxima_fiesta?: string | null
          tiene_fiestas_registradas?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_cultura_ocio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_cultura_ocio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
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
      servicios_movilidad_vehiculos: {
        Row: {
          municipio_id: string
          num_centros_itv: number
          num_puntos_recarga_electrica: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_centros_itv?: number
          num_puntos_recarga_electrica?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_centros_itv?: number
          num_puntos_recarga_electrica?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_movilidad_vehiculos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_movilidad_vehiculos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_salud: {
        Row: {
          area_salud: string | null
          centro_salud_referencia: string | null
          municipio_id: string
          num_centros_salud: number
          num_farmacias: number
          num_hospitales_consultorios: number
          updated_at: string
        }
        Insert: {
          area_salud?: string | null
          centro_salud_referencia?: string | null
          municipio_id: string
          num_centros_salud?: number
          num_farmacias?: number
          num_hospitales_consultorios?: number
          updated_at?: string
        }
        Update: {
          area_salud?: string | null
          centro_salud_referencia?: string | null
          municipio_id?: string
          num_centros_salud?: number
          num_farmacias?: number
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
      servicios_sociales: {
        Row: {
          municipio_id: string
          num_centros_caracter_social: number
          num_puntos_donacion: number
          num_servicios_caracter_social: number
          num_servicios_proximidad: number
          updated_at: string
        }
        Insert: {
          municipio_id: string
          num_centros_caracter_social?: number
          num_puntos_donacion?: number
          num_servicios_caracter_social?: number
          num_servicios_proximidad?: number
          updated_at?: string
        }
        Update: {
          municipio_id?: string
          num_centros_caracter_social?: number
          num_puntos_donacion?: number
          num_servicios_caracter_social?: number
          num_servicios_proximidad?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_sociales_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_sociales_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: true
            referencedRelation: "vista_municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      sugerencias_datos: {
        Row: {
          contacto: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_sugerencia"]
          id: string
          mensaje: string
          municipio_id: string | null
          tipo: Database["public"]["Enums"]["tipo_sugerencia"]
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_sugerencia"]
          id?: string
          mensaje: string
          municipio_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_sugerencia"]
        }
        Update: {
          contacto?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_sugerencia"]
          id?: string
          mensaje?: string
          municipio_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_sugerencia"]
        }
        Relationships: [
          {
            foreignKeyName: "sugerencias_datos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugerencias_datos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
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
      estado_sincronizacion: {
        Row: {
          ejecutado_en: string | null
          fuente: string | null
          ok: boolean | null
          registros: number | null
        }
        Relationships: []
      }
      medias_comunidad: {
        Row: {
          indice_medio: number | null
          media_aire: number | null
          media_comercio: number | null
          media_cultura: number | null
          media_distancia_bus_km: number | null
          media_educacion: number | null
          media_farmacias: number | null
          media_movilidad: number | null
          media_salud: number | null
          media_social: number | null
          media_sub_aire: number | null
          media_sub_comercio: number | null
          media_sub_cultura: number | null
          media_sub_educacion: number | null
          media_sub_movilidad: number | null
          media_sub_salud: number | null
          media_sub_social: number | null
          num_municipios: number | null
        }
        Relationships: []
      }
      medias_provincia: {
        Row: {
          indice_medio: number | null
          media_aire: number | null
          media_comercio: number | null
          media_cultura: number | null
          media_distancia_bus_km: number | null
          media_educacion: number | null
          media_farmacias: number | null
          media_movilidad: number | null
          media_salud: number | null
          media_social: number | null
          media_sub_aire: number | null
          media_sub_comercio: number | null
          media_sub_cultura: number | null
          media_sub_educacion: number | null
          media_sub_movilidad: number | null
          media_sub_salud: number | null
          media_sub_social: number | null
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
          area_salud: string | null
          centro_salud_referencia: string | null
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
          nombre_proxima_fiesta: string | null
          num_bibliotecas_bibliobuses: number | null
          num_centros_caracter_social: number | null
          num_centros_educativos: number | null
          num_centros_itv: number | null
          num_centros_salud: number | null
          num_colegios_profesionales: number | null
          num_establecimientos_comerciales: number | null
          num_farmacias: number | null
          num_hospitales_consultorios: number | null
          num_museos: number | null
          num_puntos_donacion: number | null
          num_puntos_recarga_electrica: number | null
          num_servicios_caracter_social: number | null
          num_servicios_proximidad: number | null
          poblacion: number | null
          provincia: string | null
          proxima_fiesta: string | null
          sub_aire: number | null
          sub_comercio: number | null
          sub_cultura: number | null
          sub_educacion: number | null
          sub_movilidad: number | null
          sub_salud: number | null
          sub_social: number | null
          sub_transporte: number | null
          tiene_fiestas_registradas: boolean | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_calidad_aire: { Args: never; Returns: number }
      calcular_transporte: { Args: never; Returns: number }
      municipio_por_punto: {
        Args: { _lat: number; _lon: number }
        Returns: string
      }
      municipios_geojson: { Args: never; Returns: Json }
      norm_txt: { Args: { t: string }; Returns: string }
      recalcular_indice_servicios: { Args: never; Returns: number }
      set_municipios_geom: { Args: { _rows: Json }; Returns: number }
    }
    Enums: {
      estado_sugerencia: "nueva" | "revisada" | "aplicada"
      tipo_sugerencia: "dato_incorrecto" | "dato_que_falta" | "otro"
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
      estado_sugerencia: ["nueva", "revisada", "aplicada"],
      tipo_sugerencia: ["dato_incorrecto", "dato_que_falta", "otro"],
    },
  },
} as const
