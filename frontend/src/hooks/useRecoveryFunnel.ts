import { useCachedQuery } from "./useCachedQuery";
import type { FunnelProduct } from "@/services/funnel";

interface UseRecoveryFunnelParams {
  preset: string;
  dateStart?: string;
  dateEnd?: string;
  enabled?: boolean;
}

export function useRecoveryFunnel({
  preset,
  dateStart,
  dateEnd,
  enabled = true,
}: UseRecoveryFunnelParams) {
  const { data, isLoading, error, reload } = useCachedQuery<FunnelProduct[]>({
    cachePrefix: "recovery-funnel",
    params: { preset, dateStart, dateEnd },
    queryFn: async () => {
      // Mock data for recovery funnel - replace with actual API call
      return [];
    },
    enabled,
  });

  return {
    funnels: data || [],
    isLoading,
    error: error || undefined,
    reload,
  };
}
