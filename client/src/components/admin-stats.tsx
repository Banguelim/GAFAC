import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/hooks/use-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, DollarSign, Clock, Truck } from "lucide-react";

export default function AdminStats() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Pedidos Hoje",
      value: stats.ordersToday.toString(),
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Faturamento Hoje",
      value: `R$ ${stats.revenueToday.toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      title: "Pagamentos Pendentes",
      value: stats.pendingPayments.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Entregas Pendentes",
      value: stats.pendingDeliveries.toString(),
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`${stat.color} text-xl h-6 w-6`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
