import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Verdadeiro quando o usuário logado tem o papel de moderador. */
export function useEhModerador(usuarioId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["ehModerador", usuarioId],
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", usuarioId!)
        .eq("role", "moderador")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return data ?? false;
}
