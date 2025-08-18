// API Serverless com dados persistentes simulados
// Dados iniciais que são recarregados sempre que necessário
function getInitialUsers() {
  return [
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
}

function getInitialProducts() {
  return [
    { id: '1', name: 'Canjiquinha', type: 'tipica', size: 'marmitex', price: 20, active: true },
    { id: '2', name: 'Canjiquinha', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
    { id: '3', name: 'Feijão amigo', type: 'tipica', size: 'marmitex', price: 20, active: true },
    { id: '4', name: 'Feijão amigo', type: 'tipica', size: 'cumbuquinha', price: 10, active: true },
    { id: '5', name: 'Vaca atolada', type: 'tipica', size: 'marmitex', price: 25, active: true },
    { id: '6', name: 'Vaca atolada', type: 'tipica', size: 'cumbuquinha', price: 15, active: true }
  ];
}

// Dados em memória (reinicializados a cada instância serverless)
let users = getInitialUsers();
let products = getInitialProducts();
let orders = [];
let orderItems = [];
let orderCounter = 1;

// Simular alguns dados de exemplo para demonstração
function seedExampleData() {
  // Adicionar alguns pedidos de exemplo se não existirem
  if (orders.length === 0) {
    const today = new Date().toISOString();
    
    // Pedido 1
    const order1 = {
      id: 'example-1',
      orderNumber: `ORD-${Date.now() - 1000}`,
      customerName: 'Cliente Exemplo',
      customerPhone: '(11) 99999-9999',
      totalAmount: 45,
      paymentMethod: 'dinheiro',
      paymentStatus: 'realizado',
      deliveryStatus: 'realizada',
      vendorId: '1',
      notes: 'Pedido de exemplo',
      createdAt: today
    };
    
    const items1 = [
      {
        id: 'item-1-1',
        orderId: 'example-1',
        productId: '1',
        quantity: 1,
        unitPrice: 20,
        totalPrice: 20
      },
      {
        id: 'item-1-2',
        orderId: 'example-1',
        productId: '2',
        quantity: 2,
        unitPrice: 10,
        totalPrice: 20
      },
      {
        id: 'item-1-3',
        orderId: 'example-1',
        productId: '6',
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15
      }
    ];
    
    // Pedido 2
    const order2 = {
      id: 'example-2',
      orderNumber: `ORD-${Date.now() - 500}`,
      customerName: 'Outro Cliente',
      customerPhone: '(11) 88888-8888',
      totalAmount: 30,
      paymentMethod: 'pix',
      paymentStatus: 'realizado',
      deliveryStatus: 'preparando',
      vendorId: '1',
      notes: '',
      createdAt: today
    };
    
    const items2 = [
      {
        id: 'item-2-1',
        orderId: 'example-2',
        productId: '3',
        quantity: 1,
        unitPrice: 20,
        totalPrice: 20
      },
      {
        id: 'item-2-2',
        orderId: 'example-2',
        productId: '4',
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10
      }
    ];
    
    orders.push(order1, order2);
    orderItems.push(...items1, ...items2);
  }
}

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

  // Garantir que dados de exemplo existam (para demonstração)
  seedExampleData();

  const { parts, query } = parseUrl(req.url);
  const path = '/' + parts.join('/');

  try {
    // Parse body para requests POST/PUT
    const body = await parseBody(req);

    // Health check
    if (path === '/api/health') {
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        data: {
          users: users.length,
          products: products.length,
          totalOrders: orders.length,
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          sampleOrder: orders[0] || null
        },
        timezone: {
          current: new Date().toISOString(),
          today: today,
          localTime: new Date().toLocaleString('pt-BR')
        }
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
      
      // Para cada pedido, buscar os itens e dados do vendor
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
        
        // Buscar dados do vendor
        const vendor = users.find(u => u.id === order.vendorId) || { name: 'Vendedor não encontrado', id: order.vendorId };
        
        return { 
          ...order, 
          items,
          vendor: {
            id: vendor.id,
            name: vendor.name
          }
        };
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

      // Buscar dados do vendor
      const vendor = users.find(u => u.id === order.vendorId) || { name: 'Vendedor não encontrado', id: order.vendorId };

      return res.json({ 
        ...order, 
        items,
        vendor: {
          id: vendor.id,
          name: vendor.name
        }
      });
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
      
      console.log('[STATS DEBUG]', {
        today,
        totalOrders: orders.length,
        allOrderDates: orders.map(o => ({ id: o.id, date: o.createdAt })),
        timezone: new Date().toLocaleString('pt-BR')
      });
      
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      
      console.log('[STATS DEBUG] Today Orders:', todayOrders.length, todayOrders.map(o => o.id));
      
      // Calcular stats de produtos
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
      
      // Calcular stats de vendedores
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
      
      // Calcular stats de pagamento
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
      
      const stats = {
        ordersToday: todayOrders.length,
        revenueToday: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        pendingPayments: orders.filter(o => o.paymentStatus === 'pendente').length,
        pendingDeliveries: orders.filter(o => o.deliveryStatus === 'preparando').length,
        productStats: Object.values(productStatsMap),
        vendorStats: Object.values(vendorStatsMap),
        paymentStats: paymentStats
      };
      
      return res.json(stats);
    }

    // PDF ticket generation
    if (path.startsWith('/api/orders/') && path.includes('/ticket') && req.method === 'POST') {
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

      // Buscar dados do vendor
      const vendor = users.find(u => u.id === order.vendorId) || { name: 'Vendedor não encontrado' };

      // Gerar PDF simples como HTML (para ser convertido pelo navegador)
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprovante de Pedido #${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .label { font-weight: bold; }
        .items { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items th { background-color: #f2f2f2; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>GAFAC VENDAS</h1>
        <h2>Comprovante de Pedido</h2>
        <p><strong>Pedido #${order.orderNumber}</strong></p>
    </div>
    
    <div class="section">
        <p><span class="label">Data:</span> ${new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        <p><span class="label">Cliente:</span> ${order.customerName}</p>
        <p><span class="label">Telefone:</span> ${order.customerPhone}</p>
        <p><span class="label">Vendedor:</span> ${vendor.name}</p>
    </div>
    
    <div class="section">
        <h3>Itens do Pedido:</h3>
        <table class="items">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Valor Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.productName}</td>
                        <td>${item.quantity}</td>
                        <td>R$ ${Number(item.unitPrice).toFixed(2)}</td>
                        <td>R$ ${Number(item.totalPrice).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <p><span class="label">Forma de Pagamento:</span> ${order.paymentMethod.toUpperCase()}</p>
        <p><span class="label">Status do Pagamento:</span> ${order.paymentStatus}</p>
        <p><span class="label">Status da Entrega:</span> ${order.deliveryStatus}</p>
    </div>
    
    <div class="total">
        <p>TOTAL: R$ ${Number(order.totalAmount).toFixed(2)}</p>
    </div>
    
    <div class="footer">
        <p>Obrigado pela preferência!</p>
        <p>Sistema GAFAC - ${new Date().getFullYear()}</p>
        <p><em>Este comprovante pode ser impresso usando Ctrl+P</em></p>
    </div>
    
    <script>
        // Auto-abrir diálogo de impressão
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="pedido-${order.orderNumber}.html"`);
      return res.send(htmlContent);
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