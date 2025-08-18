import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminStats from "@/components/admin-stats";
import AdminCharts from "@/components/admin-charts";
import OrdersTable from "@/components/orders-table";
import { Download, Shield, ArrowLeft } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-600">Dashboard de vendas e controle</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button className="bg-primary hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatórios
              </Button>
              <div className="flex items-center text-gray-600">
                <Shield className="h-4 w-4 mr-2" />
                <span>Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <AdminStats />

        {/* Charts Section */}
        <AdminCharts />

        {/* Orders Table */}
        <OrdersTable />
      </main>
    </div>
  );
}
