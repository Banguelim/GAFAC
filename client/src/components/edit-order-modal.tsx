import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpdateOrder } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_METHODS, PAYMENT_STATUS, DELIVERY_STATUS } from "@shared/schema";
import type { OrderWithDetails, InsertOrderItem } from "@shared/schema";
import { Minus, Plus, X } from "lucide-react";

const editOrderSchema = z.object({
  customerName: z.string().min(1, "Nome é obrigatório"),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS),
  paymentStatus: z.enum(PAYMENT_STATUS),
  deliveryStatus: z.enum(DELIVERY_STATUS),
});

type EditOrderForm = z.infer<typeof editOrderSchema>;

interface SelectedProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    price: number;
    size: string;
  };
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithDetails | null;
}

export default function EditOrderModal({ isOpen, onClose, order }: EditOrderModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const { data: products } = useProducts();
  const updateOrder = useUpdateOrder();
  const { toast } = useToast();

  const form = useForm<EditOrderForm>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "dinheiro",
      paymentStatus: "pendente",
      deliveryStatus: "pendente",
    },
  });

  // Preencher formulário quando pedido muda
  useEffect(() => {
    if (order) {
      form.reset({
        customerName: order.customerName,
        customerPhone: order.customerPhone || "",
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
      });

      // Converter itens do pedido para produtos selecionados
      const orderProducts = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          size: item.product.size,
        },
      }));
      setSelectedProducts(orderProducts);
    }
  }, [order, form]);

  const addProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = selectedProducts.findIndex(sp => sp.productId === productId);
    
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts(prev => [...prev, {
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          size: product.size,
        },
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSelectedProducts(prev => prev.filter(sp => sp.productId !== productId));
    } else {
      setSelectedProducts(prev => 
        prev.map(sp => 
          sp.productId === productId 
            ? { ...sp, quantity: newQuantity }
            : sp
        )
      );
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(sp => sp.productId !== productId));
  };

  const totalAmount = selectedProducts.reduce((sum, sp) => 
    sum + (sp.unitPrice * sp.quantity), 0
  );

  const onSubmit = async (data: EditOrderForm) => {
    if (!order || selectedProducts.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um produto",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderUpdate = {
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        deliveryStatus: data.deliveryStatus,
        totalAmount,
      };

      const items: InsertOrderItem[] = selectedProducts.map(sp => ({
        productId: sp.productId,
        quantity: sp.quantity,
        unitPrice: sp.unitPrice,
        totalPrice: sp.unitPrice * sp.quantity,
      }));

      await updateOrder.mutateAsync({
        id: order.id,
        order: orderUpdate,
        items,
      });

      toast({
        title: "Pedido atualizado",
        description: `Pedido #${order.orderNumber.toString().padStart(3, '0')} foi atualizado com sucesso`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar pedido",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Pedido {order ? `#${order.orderNumber.toString().padStart(3, '0')}` : ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nome do Cliente *</Label>
                <Input
                  id="customerName"
                  {...form.register("customerName")}
                  placeholder="Digite o nome do cliente"
                />
                {form.formState.errors.customerName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Telefone</Label>
                <Input
                  id="customerPhone"
                  {...form.register("customerPhone")}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Produtos Disponíveis */}
                <div>
                  <Label>Adicionar Produtos</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {products?.map((product) => (
                      <Button
                        key={product.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addProduct(product.id)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.size} - R$ {product.price.toFixed(2)}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Produtos Selecionados */}
                {selectedProducts.length > 0 && (
                  <div>
                    <Label>Produtos Selecionados</Label>
                    <div className="space-y-2 mt-2">
                      {selectedProducts.map((sp) => (
                        <div key={sp.productId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{sp.product.name}</div>
                            <div className="text-sm text-gray-500">
                              {sp.product.size} - R$ {sp.unitPrice.toFixed(2)} cada
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(sp.productId, sp.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {sp.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(sp.productId, sp.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(sp.productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">
                              R$ {(sp.unitPrice * sp.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="text-right p-3 border-t">
                        <div className="text-lg font-bold">
                          Total: R$ {totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Método de Pagamento</Label>
                <div className="flex gap-2 mt-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => form.setValue("paymentMethod", method)}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        form.watch("paymentMethod") === method
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {method === 'dinheiro' ? 'Dinheiro' : 
                       method === 'pix' ? 'PIX' : 'Aberto'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Status do Pagamento</Label>
                <div className="flex gap-2 mt-2">
                  {PAYMENT_STATUS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => form.setValue("paymentStatus", status)}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        form.watch("paymentStatus") === status
                          ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {status === 'realizado' ? 'Realizado' : 'Pendente'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Status da Entrega</Label>
                <div className="flex gap-2 mt-2">
                  {DELIVERY_STATUS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => form.setValue("deliveryStatus", status)}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        form.watch("deliveryStatus") === status
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {status === 'realizada' ? 'Realizada' : 'Pendente'}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={selectedProducts.length === 0 || updateOrder.isPending}
            >
              {updateOrder.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
