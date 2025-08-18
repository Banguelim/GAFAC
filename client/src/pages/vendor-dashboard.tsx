import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderForm from "@/components/order-form";
import TicketModal from "@/components/ticket-modal";
import UserMenu from "@/components/user-menu";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, PlusCircle, List } from "lucide-react";

export default function VendorDashboard() {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: recentOrders, isLoading } = useOrders(10);
  const { user } = useAuth();

  const handleOrderSuccess = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowTicketModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Registrar Pedido</h1>
            {user ? (
              <p className="text-sm text-gray-500">Vendedor: {user.name}</p>
            ) : (
              <p className="text-sm text-orange-600">Faça login para registrar pedidos</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <BarChart className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pb-20">
        <OrderForm onSuccess={handleOrderSuccess} />

        {/* Recent Orders */}
        {recentOrders && recentOrders.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium">#{order.orderNumber.toString().padStart(3, '0')}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R$ {Number(order.totalAmount).toFixed(2)}</div>
                    <div className="flex gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        order.paymentStatus === 'realizado' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        order.deliveryStatus === 'realizada' ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button className="flex flex-col items-center p-2 text-primary">
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Novo Pedido</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-400">
            <List className="h-5 w-5" />
            <span className="text-xs mt-1">Pedidos</span>
          </button>
          <Link href="/admin">
            <button className="flex flex-col items-center p-2 text-gray-400">
              <BarChart className="h-5 w-5" />
              <span className="text-xs mt-1">Relatórios</span>
            </button>
          </Link>
        </div>
      </nav>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
