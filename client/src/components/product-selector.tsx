import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { ChevronDown, UtensilsCrossed, Pizza, Soup } from "lucide-react";

interface ProductSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function ProductSelector({ value, onChange }: ProductSelectorProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

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
        return <Soup className="text-primary mr-3" />;
      case 'pizza':
        return <Pizza className="text-primary mr-3" />;
      case 'tipica':
        return <UtensilsCrossed className="text-primary mr-3" />;
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

  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="space-y-3">
        {Object.entries(productsByType).map(([category, categoryProducts]) => (
          <div key={category} className="border border-gray-200 rounded-lg">
            <button
              type="button"
              className="w-full text-left flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center">
                {getIcon(category)}
                <span className="font-medium">{getCategoryName(category)}</span>
              </div>
              <ChevronDown 
                className={`text-gray-400 transition-transform ${
                  openCategory === category ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {openCategory === category && (
              <div className="px-8 pb-3 space-y-2">
                {categoryProducts.map((product) => {
                  return (
                    <div key={product.id} className="flex items-center">
                      <RadioGroupItem 
                        value={product.id} 
                        id={product.id} 
                        className="text-primary focus:ring-primary mr-3" 
                      />
                      <Label htmlFor={product.id} className="cursor-pointer flex-1">
                        <span className="font-medium">{product.name}</span>
                        {product.size !== 'unico' && (
                          <span className="text-gray-500 ml-1">({product.size})</span>
                        )}
                        <span className="ml-auto text-gray-700 font-semibold">
                          - R$ {Number(product.price).toFixed(2)}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}
