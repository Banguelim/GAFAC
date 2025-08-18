import { useQuery } from "@tanstack/react-query";
import type { OrderStats } from "@shared/schema";

export function useStats() {
  return useQuery<OrderStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
