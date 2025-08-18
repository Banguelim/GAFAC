import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStats } from "@/hooks/use-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminCharts() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Sales by Product */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Vendas por Produto</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.productStats.map((product, index) => {
              const colors = ['bg-primary', 'bg-green-500', 'bg-orange-500'];
              return (
                <div key={product.productId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 ${colors[index % colors.length]} rounded-full mr-3`}></div>
                    <span className="font-medium">{product.productName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{product.quantity} unid.</div>
                    <div className="text-sm text-gray-500">R$ {product.revenue.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sales by Vendor */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Vendas por Vendedor</CardTitle>
          <Select defaultValue="hoje">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.vendorStats.map((vendor, index) => {
              const colors = ['bg-primary/20 text-primary', 'bg-green-100 text-green-600'];
              return (
                <div key={vendor.vendorId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${colors[index % colors.length]} rounded-full flex items-center justify-center mr-3`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{vendor.vendorName}</div>
                      <div className="text-sm text-gray-500">{vendor.orderCount} pedidos</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">R$ {vendor.revenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Comissão: R$ {(vendor.revenue * 0.1).toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Control */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-xl">Controle Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span>Dinheiro</span>
              </div>
              <span className="font-bold text-gray-900">R$ {stats.paymentStats.dinheiro.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span>PIX</span>
              </div>
              <span className="font-bold text-gray-900">R$ {stats.paymentStats.pix.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span>Em Aberto</span>
              </div>
              <span className="font-bold text-gray-900">R$ {stats.paymentStats.aberto.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {stats.revenueToday.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Status Progress */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa de Pagamento</span>
                <span>{stats.ordersToday > 0 ? Math.round(((stats.ordersToday - stats.pendingPayments) / stats.ordersToday) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{
                    width: `${stats.ordersToday > 0 ? ((stats.ordersToday - stats.pendingPayments) / stats.ordersToday) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Delivery Status Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa de Entrega</span>
                <span>{stats.ordersToday > 0 ? Math.round(((stats.ordersToday - stats.pendingDeliveries) / stats.ordersToday) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{
                    width: `${stats.ordersToday > 0 ? ((stats.ordersToday - stats.pendingDeliveries) / stats.ordersToday) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
