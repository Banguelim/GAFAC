// Upstash Redis Database - Redis persistente
import { Redis } from '@upstash/redis';

// Inicializar Redis com variáveis de ambiente do Upstash
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Chaves para o Redis
const KEYS = {
  USERS: 'gafac:users',
  PRODUCTS: 'gafac:products',
  ORDERS: 'gafac:orders',
  ORDER_ITEMS: 'gafac:order_items',
  COUNTER: 'gafac:counter'
};

// Função para gerar IDs únicos
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Função para obter data de hoje
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// =============================================================================
// USERS
// =============================================================================

export async function getUsers() {
  try {
    const users = await redis.get(KEYS.USERS);
    return users || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function createUser(userData) {
  try {
    const users = await getUsers();
    const newUser = {
      id: generateId(),
      ...userData,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await redis.set(KEYS.USERS, users);
    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getUserByUsername(username) {
  try {
    const users = await getUsers();
    return users.find(u => u.username === username);
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

// =============================================================================
// PRODUCTS
// =============================================================================

export async function getProducts() {
  try {
    const products = await redis.get(KEYS.PRODUCTS);
    return products || [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function createProduct(productData) {
  try {
    const products = await getProducts();
    const newProduct = {
      id: generateId(),
      ...productData,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    await redis.set(KEYS.PRODUCTS, products);
    
    return newProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// =============================================================================
// ORDERS
// =============================================================================

export async function getOrders() {
  try {
    const orders = await redis.get(KEYS.ORDERS);
    return orders || [];
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

export async function getOrder(id) {
  try {
    const orders = await getOrders();
    return orders.find(o => o.id === id);
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
}

export async function createOrder(orderData, itemsData) {
  try {
    // Incrementar contador
    const counter = await redis.incr(KEYS.COUNTER);
    
    // Criar pedido
    const newOrder = {
      id: generateId(),
      orderNumber: `ORD-${Date.now()}`,
      ...orderData,
      createdAt: new Date().toISOString()
    };
    
    // Criar itens
    const newItems = itemsData.map(item => ({
      id: generateId(),
      orderId: newOrder.id,
      ...item
    }));
    
    // Salvar no banco
    const orders = await getOrders();
    const orderItems = await getOrderItems();
    
    orders.push(newOrder);
    orderItems.push(...newItems);
    
    await redis.set(KEYS.ORDERS, orders);
    await redis.set(KEYS.ORDER_ITEMS, orderItems);
    
    return { ...newOrder, items: newItems };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function updateOrder(id, orderUpdate, itemsUpdate) {
  try {
    const orders = await getOrders();
    const orderItems = await getOrderItems();
    
    // Atualizar pedido
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      throw new Error('Pedido não encontrado');
    }
    
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...orderUpdate
    };
    
    // Atualizar itens se fornecidos
    if (itemsUpdate) {
      // Remover itens existentes
      const filteredItems = orderItems.filter(item => item.orderId !== id);
      
      // Adicionar novos itens
      const newItems = itemsUpdate.map(item => ({
        id: generateId(),
        orderId: id,
        ...item
      }));
      
      filteredItems.push(...newItems);
      await redis.set(KEYS.ORDER_ITEMS, filteredItems);
    }
    
    await redis.set(KEYS.ORDERS, orders);
    
    // Retornar pedido atualizado com itens
    const updatedItems = await getOrderItems();
    const items = updatedItems.filter(item => item.orderId === id);
    
    return { ...orders[orderIndex], items };
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

export async function deleteOrder(id) {
  try {
    const orders = await getOrders();
    const orderItems = await getOrderItems();
    
    // Remover pedido
    const filteredOrders = orders.filter(o => o.id !== id);
    
    // Remover itens do pedido
    const filteredItems = orderItems.filter(item => item.orderId !== id);
    
    await redis.set(KEYS.ORDERS, filteredOrders);
    await redis.set(KEYS.ORDER_ITEMS, filteredItems);
    
    return true;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// =============================================================================
// ORDER ITEMS
// =============================================================================

export async function getOrderItems() {
  try {
    const orderItems = await redis.get(KEYS.ORDER_ITEMS);
    return orderItems || [];
  } catch (error) {
    console.error('Error getting order items:', error);
    return [];
  }
}

// =============================================================================
// STATS
// =============================================================================

export async function getStats() {
  try {
    const today = getToday();
    const orders = await getOrders();
    const orderItems = await getOrderItems();
    const products = await getProducts();
    const users = await getUsers();
    
    const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
    
    // Stats de produtos
    const productStatsMap = {};
    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.orderId);
      if (order && order.createdAt.startsWith(today)) {
        const product = products.find(p => p.id === item.productId);
        const productName = product ? product.name : 'Produto não encontrado';
        
        if (!productStatsMap[item.productId]) {
          productStatsMap[item.productId] = {
            productId: item.productId,
            productName: productName,
            quantity: 0,
            revenue: 0
          };
        }
        
        productStatsMap[item.productId].quantity += item.quantity;
        productStatsMap[item.productId].revenue += item.totalPrice;
      }
    });
    
    // Stats de vendedores
    const vendorStatsMap = {};
    todayOrders.forEach(order => {
      const vendor = users.find(u => u.id === order.vendorId);
      const vendorName = vendor ? vendor.name : 'Vendedor não encontrado';
      
      if (!vendorStatsMap[order.vendorId]) {
        vendorStatsMap[order.vendorId] = {
          vendorId: order.vendorId,
          vendorName: vendorName,
          orderCount: 0,
          revenue: 0
        };
      }
      
      vendorStatsMap[order.vendorId].orderCount += 1;
      vendorStatsMap[order.vendorId].revenue += order.totalAmount;
    });
    
    // Stats de pagamento
    const paymentStats = {
      dinheiro: 0,
      pix: 0,
      aberto: 0
    };
    
    todayOrders.forEach(order => {
      if (paymentStats.hasOwnProperty(order.paymentMethod)) {
        paymentStats[order.paymentMethod] += order.totalAmount;
      }
    });
    
    return {
      ordersToday: todayOrders.length,
      revenueToday: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      pendingPayments: orders.filter(o => o.paymentStatus === 'pendente').length,
      pendingDeliveries: orders.filter(o => o.deliveryStatus === 'preparando').length,
      productStats: Object.values(productStatsMap),
      vendorStats: Object.values(vendorStatsMap),
      paymentStats: paymentStats
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      ordersToday: 0,
      revenueToday: 0,
      pendingPayments: 0,
      pendingDeliveries: 0,
      productStats: [],
      vendorStats: [],
      paymentStats: { dinheiro: 0, pix: 0, aberto: 0 }
    };
  }
}

// =============================================================================
// INICIALIZAÇÃO
// =============================================================================

export async function initializeDatabase() {
  try {
    // Verificar se usuários existem
    const users = await getUsers();
    if (users.length === 0) {
      console.log('🔧 Inicializando usuários...');
      await redis.set(KEYS.USERS, [
        {
          id: '1',
          username: 'admin',
          name: 'Administrador',
          password: 'gafac123',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString()
        }
      ]);
    }
    
    // Verificar se produtos existem
    const products = await getProducts();
    if (products.length === 0) {
      console.log('🔧 Inicializando produtos...');
      await redis.set(KEYS.PRODUCTS, [
        { id: '1', name: 'Canjiquinha', type: 'tipica', size: 'marmitex', price: 20, active: true },
        { id: '2', name: 'Canjiquinha', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
        { id: '3', name: 'Feijão amigo', type: 'tipica', size: 'marmitex', price: 20, active: true },
        { id: '4', name: 'Feijão amigo', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
        { id: '5', name: 'Vaca atolada', type: 'tipica', size: 'marmitex', price: 25, active: true },
        { id: '6', name: 'Vaca atolada', type: 'tipica', size: 'cumbuquinha', price: 15, active: true }
      ]);
    }
    
    console.log('✅ Banco de dados inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    return false;
  }
}
