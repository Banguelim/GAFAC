export const PRODUCTS = {
  caldos: [
    { id: 'caldo-galinha-pequeno', name: 'Caldo de Galinha', size: 'pequeno', price: 8.00 },
    { id: 'caldo-galinha-grande', name: 'Caldo de Galinha', size: 'grande', price: 12.00 },
    { id: 'caldo-carne-pequeno', name: 'Caldo de Carne', size: 'pequeno', price: 8.00 },
    { id: 'caldo-carne-grande', name: 'Caldo de Carne', size: 'grande', price: 12.00 },
    { id: 'caldo-peixe-pequeno', name: 'Caldo de Peixe', size: 'pequeno', price: 8.00 },
    { id: 'caldo-peixe-grande', name: 'Caldo de Peixe', size: 'grande', price: 12.00 },
  ],
  pizza: [
    { id: 'pizza-tradicional', name: 'Pizza Tradicional', size: 'unico', price: 25.00 },
  ],
  tipica: [
    { id: 'canjiquinha-marmitex', name: 'Canjiquinha', size: 'marmitex', price: 20.00 },
    { id: 'canjiquinha-cumbuquinha', name: 'Canjiquinha', size: 'cumbuquinha', price: 10.00 },
    { id: 'vaca-atolada-marmitex', name: 'Vaca Atolada', size: 'marmitex', price: 25.00 },
    { id: 'vaca-atolada-cumbuquinha', name: 'Vaca Atolada', size: 'cumbuquinha', price: 15.00 },
    { id: 'feijao-amigo-marmitex', name: 'Feijão Amigo', size: 'marmitex', price: 20.00 },
    { id: 'feijao-amigo-cumbuquinha', name: 'Feijão Amigo', size: 'cumbuquinha', price: 10.00 },
  ],
} as const;

export const PAYMENT_METHODS = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  aberto: 'Em Aberto',
} as const;

export const STATUS_LABELS = {
  realizado: 'Realizado',
  pendente: 'Pendente',
  realizada: 'Realizada',
} as const;

export const BUSINESS_INFO = {
  name: 'PIZZA & CIA',
  subtitle: 'Comidas Típicas & Caldos',
  phone: '(11) 99999-9999',
  website: 'www.pizzaecia.com.br',
  footer: 'Obrigado pela preferência!',
} as const;
