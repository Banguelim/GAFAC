import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import MultiProductSelector, { type SelectedProduct } from "@/components/multi-product-selector";
import { useCreateOrder } from "@/hooks/use-orders";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PAYMENT_METHODS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { Check, Clock, Minus, Plus, Receipt, User } from "lucide-react";

const orderFormSchema = z.object({
  paymentMethod: z.enum(["dinheiro", "pix", "aberto"]),
  paymentStatus: z.enum(["realizado", "pendente"]),
  deliveryStatus: z.enum(["realizada", "pendente"]),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().min(1, "Telefone do cliente é obrigatório"),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onSuccess?: (orderId: string) => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { user } = useAuth();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      paymentStatus: "pendente",
      deliveryStatus: "pendente",
      customerName: "",
      customerPhone: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const totalAmount = selectedProducts.reduce((sum, sp) => sum + sp.subtotal, 0);

  const onSubmit = async (data: OrderFormData) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecione produtos",
        description: "Escolha pelo menos um produto para o pedido",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para registrar pedidos",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = {
        vendorId: user.id,
        vendorName: user.name,
        vendorPhone: null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        deliveryStatus: data.deliveryStatus,
        totalAmount: totalAmount,
      };

      const items = selectedProducts.map(sp => ({
        productId: sp.product.id,
        quantity: sp.quantity,
        unitPrice: Number(sp.product.price),
        totalPrice: sp.subtotal,
      }));

      const result = await createOrder.mutateAsync({ order, items });
      
      toast({
        title: "Pedido registrado com sucesso!",
        description: `Pedido #${result.orderNumber.toString().padStart(3, '0')} criado`,
      });

      form.reset();
      setSelectedProducts([]);
      
      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar pedido",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  // Se o usuário não estiver logado, mostra mensagem
  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Login necessário</h3>
          <p className="text-gray-600 mb-4">
            Faça login com sua conta de vendedor para registrar pedidos
          </p>
          <p className="text-sm text-gray-500">
            Use o botão de usuário no canto superior direito para entrar ou criar sua conta
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do cliente" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do Cliente *</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Product Selection */}
        <MultiProductSelector 
          selectedProducts={selectedProducts}
          onChange={setSelectedProducts}
        />

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={`flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                            field.value === value 
                              ? "border-primary bg-primary/10 shadow-sm" 
                              : "border-gray-200"
                          }`}
                        >
                          <span className={`text-sm font-medium ${
                            field.value === value ? "text-primary" : "text-gray-700"
                          }`}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Payment Status */}
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Pagamento</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("realizado")}
                        className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex-1 transition-all ${
                          field.value === "realizado" 
                            ? "border-green-500 bg-green-50 shadow-sm" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`rounded-full p-2 mr-3 transition-colors ${
                          field.value === "realizado" 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Realizado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("pendente")}
                        className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex-1 transition-all ${
                          field.value === "pendente" 
                            ? "border-orange-500 bg-orange-50 shadow-sm" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`rounded-full p-2 mr-3 transition-colors ${
                          field.value === "pendente" 
                            ? "bg-orange-500 text-white" 
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Pendente</span>
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Delivery Status */}
            <FormField
              control={form.control}
              name="deliveryStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Entrega</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange("realizada")}
                        className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex-1 transition-all ${
                          field.value === "realizada" 
                            ? "border-green-500 bg-green-50 shadow-sm" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`rounded-full p-2 mr-3 transition-colors ${
                          field.value === "realizada" 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Realizada</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("pendente")}
                        className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex-1 transition-all ${
                          field.value === "pendente" 
                            ? "border-orange-500 bg-orange-50 shadow-sm" 
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`rounded-full p-2 mr-3 transition-colors ${
                          field.value === "pendente" 
                            ? "bg-orange-500 text-white" 
                            : "bg-gray-300 text-gray-600"
                        }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Pendente</span>
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Customer Information (for Em Aberto) */}
            {paymentMethod === "aberto" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>



        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full bg-primary text-white py-4 text-lg font-semibold hover:bg-primary/90 shadow-lg"
            disabled={createOrder.isPending || selectedProducts.length === 0}
          >
            <Check className="h-5 w-5 mr-2" />
            {createOrder.isPending ? "Registrando..." : "Confirmar Pedido"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
