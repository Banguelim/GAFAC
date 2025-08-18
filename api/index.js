// API Serverless simplificada para Vercel (in-memory data)
// Dados em memória - serão reinicializados a cada deploy
let users = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrador',
    password: 'gafac123',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString()
  }
];

let products = [
  { id: '1', name: 'Canjiquinha', type: 'tipica', size: 'marmitex', price: 20, active: true },
  { id: '2', name: 'Canjiquinha', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
  { id: '3', name: 'Feijão amigo', type: 'tipica', size: 'marmitex', price: 20, active: true },
  { id: '4', name: 'Feijão amigo', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
  { id: '5', name: 'Vaca atolada', type: 'tipica', size: 'marmitex', price: 25, active: true },
  { id: '6', name: 'Vaca atolada', type: 'tipica', size: 'cumbuquinha', price: 15, active: true }
];

let orders = [];
let orderItems = [];
let orderCounter = 1;

// Função para gerar IDs únicos
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Função para processar URL e extrair parâmetros
function parseUrl(url) {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  const query = new URLSearchParams(url.split('?')[1] || '');
  return { parts, query };
}

// Função para parselar JSON do body
function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET') {
      resolve({});
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Handler principal
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { parts, query } = parseUrl(req.url);
  const path = '/' + parts.join('/');

  try {
    // Parse body para requests POST/PUT
    const body = await parseBody(req);

    // Health check
    if (path === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        users: users.length,
        products: products.length,
        orders: orders.length
      });
    }

    // Auth routes
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { username, password } = body;
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      return res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          role: user.role 
        } 
      });
    }

    // Users routes
    if (path === '/api/users' && req.method === 'GET') {
      return res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })));
    }

    if (path === '/api/users' && req.method === 'POST') {
      const { username, name, password, role = 'vendor' } = body;
      
      if (!username || !name || !password) {
        return res.status(400).json({ message: 'Campos obrigatórios: username, name, password' });
      }

      // Verificar se usuário já existe
      if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const newUser = {
        id: generateId(),
        username,
        name,
        password,
        role,
        active: true,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);

      return res.status(201).json({ 
        id: newUser.id, 
        username: newUser.username, 
        name: newUser.name, 
        role: newUser.role 
      });
    }

    // Products routes
    if (path === '/api/products' && req.method === 'GET') {
      return res.json(products.filter(p => p.active));
    }

    if (path === '/api/products' && req.method === 'POST') {
      const { name, type, size, price } = body;
      
      const newProduct = {
        id: generateId(),
        name,
        type,
        size,
        price: parseFloat(price),
        active: true,
        createdAt: new Date().toISOString()
      };

      products.push(newProduct);
      return res.status(201).json(newProduct);
    }

    // Orders routes
    if (path === '/api/orders' && req.method === 'GET') {
      const limit = query.get('limit') ? parseInt(query.get('limit')) : undefined;
      
      // Ordenar por data de criação (mais recente primeiro)
      const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const limitedOrders = limit ? sortedOrders.slice(0, limit) : sortedOrders;
      
      // Para cada pedido, buscar os itens
      const ordersWithItems = limitedOrders.map(order => {
        const items = orderItems
          .filter(item => item.orderId === order.id)
          .map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              ...item,
              product: product || { name: 'Produto não encontrado', price: 0 },
              productName: product ? product.name : 'Produto não encontrado'
            };
          });
        
        return { ...order, items };
      });
      
      return res.json(ordersWithItems);
    }

    // Get single order
    if (path.startsWith('/api/orders/') && !path.includes('/status') && !path.includes('/ticket') && req.method === 'GET') {
      const orderId = parts[2];
      
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Buscar itens do pedido
      const items = orderItems
        .filter(item => item.orderId === orderId)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            product: product || { name: 'Produto não encontrado', price: 0 },
            productName: product ? product.name : 'Produto não encontrado'
          };
        });

      return res.json({ ...order, items });
    }

    if (path === '/api/orders' && req.method === 'POST') {
      const { order, items } = body;
      
      if (!order || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Order e items são obrigatórios' });
      }

      // Gerar número do pedido
      const orderNumber = `ORD-${Date.now()}`;
      const orderId = generateId();
      
      // Criar o pedido
      const newOrder = {
        id: orderId,
        orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: parseFloat(order.totalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus || 'pendente',
        deliveryStatus: order.deliveryStatus || 'preparando',
        vendorId: order.vendorId,
        notes: order.notes,
        createdAt: new Date().toISOString()
      };

      orders.push(newOrder);

      // Criar os itens do pedido
      const newItems = items.map(item => ({
        id: generateId(),
        orderId: orderId,
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice)
      }));

      orderItems.push(...newItems);

      return res.status(201).json({ ...newOrder, items: newItems });
    }

    // Update order
    if (path.startsWith('/api/orders/') && !path.includes('/status') && !path.includes('/ticket') && req.method === 'PUT') {
      const orderId = parts[2];
      const { order: orderUpdate, items: itemsUpdate } = body;
      
      // Encontrar e atualizar o pedido
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Atualizar dados do pedido
      if (orderUpdate) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          ...orderUpdate,
          totalAmount: orderUpdate.totalAmount ? parseFloat(orderUpdate.totalAmount) : orders[orderIndex].totalAmount
        };
      }
      
      // Se novos itens foram fornecidos, substituir todos
      if (itemsUpdate && Array.isArray(itemsUpdate)) {
        // Remover itens existentes
        orderItems = orderItems.filter(item => item.orderId !== orderId);
        
        // Adicionar novos itens
        const newItems = itemsUpdate.map(item => ({
          id: generateId(),
          orderId: orderId,
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }));

        orderItems.push(...newItems);
      }
      
      // Retornar pedido atualizado com itens
      const updatedOrder = orders[orderIndex];
      const updatedItems = orderItems.filter(item => item.orderId === orderId);
      
      return res.json({ ...updatedOrder, items: updatedItems });
    }

    // Delete order
    if (path.startsWith('/api/orders/') && req.method === 'DELETE') {
      const orderId = parts[2];
      
      // Remover itens do pedido
      orderItems = orderItems.filter(item => item.orderId !== orderId);
      
      // Remover pedido
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      orders.splice(orderIndex, 1);
      
      return res.json({ message: 'Pedido deletado com sucesso' });
    }

    // Stats routes
    if (path === '/api/stats' && req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      
      const stats = {
        ordersToday: todayOrders.length,
        revenueToday: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        pendingPayments: orders.filter(o => o.paymentStatus === 'pendente').length,
        pendingDeliveries: orders.filter(o => o.deliveryStatus === 'preparando').length
      };
      
      return res.json(stats);
    }

    // Para outras rotas, retornar erro 404
    return res.status(404).json({ 
      message: 'API endpoint not found',
      url: req.url,
      method: req.method 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
}