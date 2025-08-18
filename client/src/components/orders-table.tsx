import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EditOrderModal from "./edit-order-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Receipt, Filter, Check, Clock, Edit, Trash2 } from "lucide-react";

export default function OrdersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const { data: orders, isLoading } = useOrders(50);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { user } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.role === 'admin';

  const filteredOrders = orders?.filter(order => 
    order.orderNumber.toString().includes(searchTerm) ||
    order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleStatusUpdate = async (orderId: string, field: 'paymentStatus' | 'deliveryStatus', value: string) => {
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        [field]: value,
      });
      
      toast({
        title: "Status atualizado",
        description: `${field === 'paymentStatus' ? 'Status de pagamento' : 'Status de entrega'} atualizado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: number) => {
    try {
      await deleteOrder.mutateAsync(orderId);
      
      toast({
        title: "Pedido excluído",
        description: `Pedido #${orderNumber.toString().padStart(3, '0')} foi excluído com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir pedido",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Pedidos Recentes</CardTitle>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      #{order.orderNumber.toString().padStart(3, '0')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} {' '}
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.items.map(item => item.product.name).join(', ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.map(item => `${item.quantity}x`).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900">{order.vendor.name}</TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    R$ {Number(order.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={order.paymentStatus === 'realizado' ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
                        order.paymentStatus === 'realizado' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                      onClick={() => handleStatusUpdate(
                        order.id, 
                        'paymentStatus', 
                        order.paymentStatus === 'realizado' ? 'pendente' : 'realizado'
                      )}
                    >
                      {order.paymentStatus === 'realizado' ? (
                        <><Check className="h-3 w-3 mr-1" /> Realizado</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={order.deliveryStatus === 'realizada' ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
                        order.deliveryStatus === 'realizada' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                      onClick={() => handleStatusUpdate(
                        order.id, 
                        'deliveryStatus', 
                        order.deliveryStatus === 'realizada' ? 'pendente' : 'realizada'
                      )}
                    >
                      {order.deliveryStatus === 'realizada' ? (
                        <><Check className="h-3 w-3 mr-1" /> Realizada</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" title="Ver Detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Gerar Ticket">
                        <Receipt className="h-4 w-4" />
                      </Button>
                      
                      {isAdmin && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Editar Pedido"
                            onClick={() => setEditingOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Excluir Pedido"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o pedido #{order.orderNumber.toString().padStart(3, '0')}? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nenhum pedido encontrado para a busca.' : 'Nenhum pedido encontrado.'}
            </div>
          )}
        </div>
      </CardContent>
      
      <EditOrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
      />
    </Card>
  );
}
