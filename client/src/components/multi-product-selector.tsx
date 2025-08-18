import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { ChevronDown, UtensilsCrossed, Pizza, Soup, Minus, Plus } from "lucide-react";

export interface SelectedProduct {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface MultiProductSelectorProps {
  selectedProducts: SelectedProduct[];
  onChange: (products: SelectedProduct[]) => void;
}

export default function MultiProductSelector({ selectedProducts, onChange }: MultiProductSelectorProps) {
  const [openCategory, setOpenCategory] = useState<string | null>("tipica"); // Abre "Comida Típica" por padrão

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });

  // Early return se houver erro ou carregando
  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Erro ao carregar produtos. Tente recarregar a página.</p>
        </CardContent>
      </Card>
    );
  }

  // Group products by type
  const productsByType = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = [];
    }
    acc[product.type].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'caldo':
        return <Soup className="text-primary h-5 w-5" />;
      case 'pizza':
        return <Pizza className="text-primary h-5 w-5" />;
      case 'tipica':
        return <UtensilsCrossed className="text-primary h-5 w-5" />;
      default:
        return null;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'caldo':
        return 'Caldos';
      case 'pizza':
        return 'Pizza';
      case 'tipica':
        return 'Comida Típica';
      default:
        return category;
    }
  };

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(sp => sp.product.id === productId);
  };

  const getProductQuantity = (productId: string) => {
    const selectedProduct = selectedProducts.find(sp => sp.product.id === productId);
    return selectedProduct?.quantity || 1;
  };

  const toggleProduct = (product: Product, checked: boolean) => {
    try {
      if (checked) {
        // Verificar se já não está selecionado (evitar duplicatas)
        if (selectedProducts.some(sp => sp.product.id === product.id)) {
          return;
        }
        
        // Adicionar produto
        const newSelectedProduct: SelectedProduct = {
          product,
          quantity: 1,
          subtotal: Number(product.price)
        };
        onChange([...selectedProducts, newSelectedProduct]);
      } else {
        // Remover produto
        const filtered = selectedProducts.filter(sp => sp.product.id !== product.id);
        onChange(filtered);
      }
    } catch (error) {
      console.error('Erro ao alterar produto:', error);
    }
  };

  const updateProductQuantity = (productId: string, delta: number) => {
    try {
      const updatedProducts = selectedProducts.map(sp => {
        if (sp.product.id === productId) {
          const newQuantity = Math.max(1, sp.quantity + delta);
          return {
            ...sp,
            quantity: newQuantity,
            subtotal: Number(sp.product.price) * newQuantity
          };
        }
        return sp;
      });
      onChange(updatedProducts);
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const totalAmount = selectedProducts.reduce((sum, sp) => sum + sp.subtotal, 0);

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de categorias */}
      <div className="space-y-3">
        {Object.entries(productsByType).map(([category, categoryProducts]) => (
          <Card key={`category-${category}`}>
            <CardHeader className="pb-3">
              <button
                type="button"
                className="w-full text-left flex items-center justify-between hover:bg-gray-50 rounded p-2 -m-2"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-3">
                  {getIcon(category)}
                  <CardTitle className="text-lg">{getCategoryName(category)}</CardTitle>
                </div>
                <ChevronDown 
                  className={`text-gray-400 transition-transform h-5 w-5 ${
                    openCategory === category ? 'rotate-180' : ''
                  }`} 
                />
              </button>
            </CardHeader>
            
            {openCategory === category && (
              <CardContent className="pt-0 space-y-3">
                {categoryProducts.map((product) => {
                  const isSelected = isProductSelected(product.id);
                  const quantity = getProductQuantity(product.id);
                  const subtotal = Number(product.price) * quantity;

                  return (
                    <div key={`product-${product.id}-${category}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            id={product.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleProduct(product, checked as boolean)}
                          />
                          <div className="flex-1">
                            <label htmlFor={product.id} className="cursor-pointer">
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                ({product.size}) - R$ {Number(product.price).toFixed(2)}
                              </div>
                            </label>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateProductQuantity(product.id, -1)}
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateProductQuantity(product.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <div className="font-semibold text-primary">
                                R$ {subtotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Resumo do pedido */}
      {selectedProducts.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedProducts.map((sp) => (
                <div key={`summary-${sp.product.id}`} className="flex justify-between text-sm">
                  <span>{sp.quantity}x {sp.product.name} ({sp.product.size})</span>
                  <span className="font-medium">R$ {sp.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
