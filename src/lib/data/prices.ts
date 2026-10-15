import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";

/** Semana vigente de la pizarra (lunes, YYYY-MM-DD) o null si no hay datos. */
export async function getCurrentPriceWeek(): Promise<string | null> {
  "use cache";
  cacheTag("prices");
  cacheLife("hours");

  const { data, error } = await publicDb().from("price_board").select("week_start").limit(1).maybeSingle();
  if (error) throw new Error(`price_board: ${error.message}`);
  return data?.week_start ?? null;
}
