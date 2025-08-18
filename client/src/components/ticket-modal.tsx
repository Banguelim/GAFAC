import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrder, useGenerateTicket } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_INFO, PAYMENT_METHODS, STATUS_LABELS } from "@/lib/constants";
import { Download, MessageCircle, X } from "lucide-react";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export default function TicketModal({ isOpen, onClose, orderId }: TicketModalProps) {
  const { data: order, isLoading } = useOrder(orderId || "");
  const generateTicket = useGenerateTicket();

  const handleDownload = async () => {
    if (!orderId) return;
    
    try {
      await generateTicket.mutateAsync(orderId);
    } catch (error) {
      console.error("Error generating ticket:", error);
    }
  };

  const handleWhatsApp = () => {
    if (!order) return;
    
    const message = `*${BUSINESS_INFO.name}*%0A*Pedido #${order.orderNumber.toString().padStart(3, '0')}*%0A%0A*Itens:*%0A${order.items.map(item => `${item.quantity}x ${item.product.name} - R$ ${Number(item.totalPrice).toFixed(2)}`).join('%0A')}%0A%0A*Total: R$ ${Number(order.totalAmount).toFixed(2)}*%0A%0A${BUSINESS_INFO.footer}`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Comprovante do Pedido
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : order ? (
          <div>
            {/* Ticket Preview */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 font-mono text-sm">
              {/* Business Header */}
              <div className="text-center border-b border-gray-300 pb-4 mb-4">
                <div className="font-bold text-lg">{BUSINESS_INFO.name}</div>
                <div className="text-xs">{BUSINESS_INFO.subtitle}</div>
                <div className="text-xs">{BUSINESS_INFO.phone}</div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Pedido:</span>
                  <span>#{order.orderNumber.toString().padStart(3, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data/Hora:</span>
                  <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendedor:</span>
                  <span>{order.vendor.name}</span>
                </div>
                {order.customerName && (
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-gray-300 pt-4 mb-4">
                <div className="text-center font-bold mb-2">ITENS</div>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>R$ {Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-300 pt-4 mb-4">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>R$ {Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Forma Pagto:</span>
                  <span>{PAYMENT_METHODS[order.paymentMethod]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Pagto:</span>
                  <span>{STATUS_LABELS[order.paymentStatus]} {order.paymentStatus === 'realizado' ? '✅' : '⏳'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Entrega:</span>
                  <span>{STATUS_LABELS[order.deliveryStatus]} {order.deliveryStatus === 'realizada' ? '✅' : '⏳'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-300 pt-4 text-center text-xs">
                <div>{BUSINESS_INFO.footer}</div>
                <div className="mt-2">{BUSINESS_INFO.website}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600" 
                onClick={handleDownload}
                disabled={generateTicket.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {generateTicket.isPending ? "Gerando..." : "Baixar PDF"}
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handleWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar WhatsApp
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Pedido não encontrado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
