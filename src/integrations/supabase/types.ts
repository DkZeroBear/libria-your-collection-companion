export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      denuncias: {
        Row: {
          created_at: string;
          denunciado_por: string;
          fonte_id: string | null;
          id: string;
          motivo: string;
          status: string;
          titulo_id: string | null;
        };
        Insert: {
          created_at?: string;
          denunciado_por: string;
          fonte_id?: string | null;
          id?: string;
          motivo: string;
          status?: string;
          titulo_id?: string | null;
        };
        Update: {
          created_at?: string;
          denunciado_por?: string;
          fonte_id?: string | null;
          id?: string;
          motivo?: string;
          status?: string;
          titulo_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "denuncias_denunciado_por_fkey";
            columns: ["denunciado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "denuncias_denunciado_por_fkey";
            columns: ["denunciado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "denuncias_fonte_id_fkey";
            columns: ["fonte_id"];
            isOneToOne: false;
            referencedRelation: "fontes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "denuncias_titulo_id_fkey";
            columns: ["titulo_id"];
            isOneToOne: false;
            referencedRelation: "titulos";
            referencedColumns: ["id"];
          },
        ];
      };
      emprestimos: {
        Row: {
          canal_cobranca: string | null;
          created_at: string;
          data_devolucao_prevista: string | null;
          data_devolucao_real: string | null;
          data_emprestimo: string;
          devolvido: boolean;
          dono_id: string;
          id: string;
          pego_por_nome: string;
          pego_por_usuario_id: string | null;
          titulo_id: string;
          ultima_cobranca_em: string | null;
        };
        Insert: {
          canal_cobranca?: string | null;
          created_at?: string;
          data_devolucao_prevista?: string | null;
          data_devolucao_real?: string | null;
          data_emprestimo?: string;
          devolvido?: boolean;
          dono_id: string;
          id?: string;
          pego_por_nome: string;
          pego_por_usuario_id?: string | null;
          titulo_id: string;
          ultima_cobranca_em?: string | null;
        };
        Update: {
          canal_cobranca?: string | null;
          created_at?: string;
          data_devolucao_prevista?: string | null;
          data_devolucao_real?: string | null;
          data_emprestimo?: string;
          devolvido?: boolean;
          dono_id?: string;
          id?: string;
          pego_por_nome?: string;
          pego_por_usuario_id?: string | null;
          titulo_id?: string;
          ultima_cobranca_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emprestimos_dono_id_fkey";
            columns: ["dono_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emprestimos_dono_id_fkey";
            columns: ["dono_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emprestimos_pego_por_usuario_id_fkey";
            columns: ["pego_por_usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emprestimos_pego_por_usuario_id_fkey";
            columns: ["pego_por_usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emprestimos_titulo_id_fkey";
            columns: ["titulo_id"];
            isOneToOne: false;
            referencedRelation: "titulos";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback_produto: {
        Row: {
          created_at: string;
          descricao: string;
          id: string;
          status: string;
          tipo: string;
          titulo: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          descricao: string;
          id?: string;
          status?: string;
          tipo: string;
          titulo: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          descricao?: string;
          id?: string;
          status?: string;
          tipo?: string;
          titulo?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_produto_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_produto_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
        ];
      };
      fontes: {
        Row: {
          capa_url: string | null;
          created_at: string;
          criado_por: string;
          descricao: string | null;
          id: string;
          nome: string;
          status_curadoria: string;
          tipo_midia_id: string;
          total_titulos_oficial: number | null;
        };
        Insert: {
          capa_url?: string | null;
          created_at?: string;
          criado_por: string;
          descricao?: string | null;
          id?: string;
          nome: string;
          status_curadoria?: string;
          tipo_midia_id: string;
          total_titulos_oficial?: number | null;
        };
        Update: {
          capa_url?: string | null;
          created_at?: string;
          criado_por?: string;
          descricao?: string | null;
          id?: string;
          nome?: string;
          status_curadoria?: string;
          tipo_midia_id?: string;
          total_titulos_oficial?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fontes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fontes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fontes_tipo_midia_id_fkey";
            columns: ["tipo_midia_id"];
            isOneToOne: false;
            referencedRelation: "tipos_midia";
            referencedColumns: ["id"];
          },
        ];
      };
      posse: {
        Row: {
          id: string;
          lido: boolean;
          quero: boolean;
          tenho: boolean;
          titulo_id: string;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          id?: string;
          lido?: boolean;
          quero?: boolean;
          tenho?: boolean;
          titulo_id: string;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          id?: string;
          lido?: boolean;
          quero?: boolean;
          tenho?: boolean;
          titulo_id?: string;
          updated_at?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posse_titulo_id_fkey";
            columns: ["titulo_id"];
            isOneToOne: false;
            referencedRelation: "titulos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posse_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posse_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
        ];
      };
      sugestoes: {
        Row: {
          created_at: string;
          id: string;
          payload: Json;
          revisado_em: string | null;
          revisado_por: string | null;
          status: string;
          sugerido_por: string;
          tipo_sugestao: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          payload?: Json;
          revisado_em?: string | null;
          revisado_por?: string | null;
          status?: string;
          sugerido_por: string;
          tipo_sugestao: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payload?: Json;
          revisado_em?: string | null;
          revisado_por?: string | null;
          status?: string;
          sugerido_por?: string;
          tipo_sugestao?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sugestoes_revisado_por_fkey";
            columns: ["revisado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sugestoes_revisado_por_fkey";
            columns: ["revisado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sugestoes_sugerido_por_fkey";
            columns: ["sugerido_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sugestoes_sugerido_por_fkey";
            columns: ["sugerido_por"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
        ];
      };
      tipos_midia: {
        Row: {
          ativo: boolean;
          created_at: string;
          icone: string;
          id: string;
          nome: string;
          nome_exibicao: string;
          schema_campos: Json;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          icone?: string;
          id?: string;
          nome: string;
          nome_exibicao: string;
          schema_campos?: Json;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          icone?: string;
          id?: string;
          nome?: string;
          nome_exibicao?: string;
          schema_campos?: Json;
        };
        Relationships: [];
      };
      titulos: {
        Row: {
          capa_url: string | null;
          created_at: string;
          criado_por: string;
          fonte_id: string | null;
          fonte_validacao: string;
          id: string;
          identificador_externo: string | null;
          metadados: Json;
          status_curadoria: string;
          tipo_midia_id: string;
          titulo: string;
        };
        Insert: {
          capa_url?: string | null;
          created_at?: string;
          criado_por: string;
          fonte_id?: string | null;
          fonte_validacao?: string;
          id?: string;
          identificador_externo?: string | null;
          metadados?: Json;
          status_curadoria?: string;
          tipo_midia_id: string;
          titulo: string;
        };
        Update: {
          capa_url?: string | null;
          created_at?: string;
          criado_por?: string;
          fonte_id?: string | null;
          fonte_validacao?: string;
          id?: string;
          identificador_externo?: string | null;
          metadados?: Json;
          status_curadoria?: string;
          tipo_midia_id?: string;
          titulo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "titulos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "titulos_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "titulos_fonte_id_fkey";
            columns: ["fonte_id"];
            isOneToOne: false;
            referencedRelation: "fontes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "titulos_tipo_midia_id_fkey";
            columns: ["tipo_midia_id"];
            isOneToOne: false;
            referencedRelation: "tipos_midia";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
        ];
      };
      usuarios: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          colecionador_desde: string;
          created_at: string;
          id: string;
          nome_exibicao: string;
          perfil_publico: boolean;
          reputacao: number;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          colecionador_desde?: string;
          created_at?: string;
          id: string;
          nome_exibicao: string;
          perfil_publico?: boolean;
          reputacao?: number;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          colecionador_desde?: string;
          created_at?: string;
          id?: string;
          nome_exibicao?: string;
          perfil_publico?: boolean;
          reputacao?: number;
          username?: string;
        };
        Relationships: [];
      };
      usuarios_telegram: {
        Row: {
          created_at: string;
          telegram_chat_id: string | null;
          telegram_codigo_vinculo: string;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          telegram_chat_id?: string | null;
          telegram_codigo_vinculo?: string;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          telegram_chat_id?: string | null;
          telegram_codigo_vinculo?: string;
          updated_at?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usuarios_telegram_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: true;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usuarios_telegram_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: true;
            referencedRelation: "usuarios_publico";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      usuarios_publico: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          colecionador_desde: string | null;
          id: string | null;
          nome_exibicao: string | null;
          reputacao: number | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          colecionador_desde?: string | null;
          id?: string | null;
          nome_exibicao?: string | null;
          reputacao?: number | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          colecionador_desde?: string | null;
          id?: string | null;
          nome_exibicao?: string | null;
          reputacao?: number | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "moderador";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
    Enums: {
      app_role: ["moderador"],
    },
  },
} as const;
