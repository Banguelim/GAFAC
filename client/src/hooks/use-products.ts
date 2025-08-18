import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
  });
}
