import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { OrderWithDetails, InsertOrder, InsertOrderItem } from "@shared/schema";

export function useOrders(limit?: number) {
  return useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders", limit],
    queryFn: async () => {
      const url = limit ? `/api/orders?limit=${limit}` : "/api/orders";
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });
}

export function useOrder(id: string) {
  return useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ order, items }: { order: InsertOrder; items: InsertOrderItem[] }) => {
      const response = await apiRequest("POST", "/api/orders", { order, items });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      order, 
      items 
    }: { 
      id: string; 
      order?: Partial<InsertOrder>; 
      items?: InsertOrderItem[] 
    }) => {
      const response = await apiRequest("PUT", `/api/orders/${id}`, { order, items });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      paymentStatus, 
      deliveryStatus 
    }: { 
      id: string; 
      paymentStatus?: string; 
      deliveryStatus?: string; 
    }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, {
        paymentStatus,
        deliveryStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useVendorOrders(vendorId: string, limit?: number) {
  return useQuery<OrderWithDetails[]>({
    queryKey: ["/api/vendors", vendorId, "orders", limit],
    enabled: !!vendorId,
  });
}

export function useGenerateTicket() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/ticket`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error('Failed to generate ticket');
      
      // A API retorna HTML que pode ser aberto em nova janela para impressão
      const htmlContent = await response.text();
      
      // Abrir em nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // A janela vai auto-abrir o diálogo de impressão via JavaScript
      } else {
        // Fallback: criar blob e download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprovante-pedido-${orderId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
  });
}
