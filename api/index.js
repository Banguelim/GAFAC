// API Serverless com Vercel KV (Redis persistente)
import {
  getUsers,
  createUser,
  getUserByUsername,
  getProducts,
  createProduct,
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderItems,
  getStats,
  initializeDatabase
} from './database.js';

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

  // Inicializar banco se necessário
  await initializeDatabase();

  const { parts, query } = parseUrl(req.url);
  const path = '/' + parts.join('/');

  try {
    // Parse body para requests POST/PUT
    const body = await parseBody(req);

    // Health check
    if (path === '/api/health') {
      const stats = await getStats();
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel',
        database: 'redis-kv',
        data: {
          users: (await getUsers()).length,
          products: (await getProducts()).length,
          orders: (await getOrders()).length,
          todayOrders: stats.ordersToday,
          todayRevenue: stats.revenueToday
        }
      });
    }

    // Auth routes
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { username, password } = body;
      
      const user = await getUserByUsername(username);
      
      if (!user || user.password !== password) {
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
      const users = await getUsers();
      return res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })));
    }

    if (path === '/api/users' && req.method === 'POST') {
      const { username, name, password, role = 'vendor' } = body;
      
      if (!username || !name || !password) {
        return res.status(400).json({ message: 'Campos obrigatórios: username, name, password' });
      }

      // Verificar se usuário já existe
      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const newUser = await createUser({ username, name, password, role });

      return res.status(201).json({ 
        id: newUser.id, 
        username: newUser.username, 
        name: newUser.name, 
        role: newUser.role 
      });
    }

    // Products routes
    if (path === '/api/products' && req.method === 'GET') {
      const products = await getProducts();
      return res.json(products.filter(p => p.active));
    }

    if (path === '/api/products' && req.method === 'POST') {
      const { name, type, size, price } = body;
      
      const newProduct = await createProduct({
        name,
        type,
        size,
        price: parseFloat(price)
      });

      return res.status(201).json(newProduct);
    }

    // Orders routes
    if (path === '/api/orders' && req.method === 'GET') {
      const limit = query.get('limit') ? parseInt(query.get('limit')) : undefined;
      
      const allOrders = await getOrders();
      const allOrderItems = await getOrderItems();
      const products = await getProducts();
      const users = await getUsers();
      
      // Ordenar por data de criação (mais recente primeiro)
      const sortedOrders = allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const limitedOrders = limit ? sortedOrders.slice(0, limit) : sortedOrders;
      
      // Para cada pedido, buscar os itens e dados do vendor
      const ordersWithItems = limitedOrders.map(order => {
        const items = allOrderItems
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
      
      const order = await getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Buscar itens do pedido
      const allOrderItems = await getOrderItems();
      const products = await getProducts();
      const users = await getUsers();
      
      const items = allOrderItems
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

      const newOrder = await createOrder(
        {
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: parseFloat(order.totalAmount),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus || 'pendente',
          deliveryStatus: order.deliveryStatus || 'preparando',
          vendorId: order.vendorId,
          notes: order.notes
        },
        items.map(item => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      );

      return res.status(201).json(newOrder);
    }

    // Update order
    if (path.startsWith('/api/orders/') && !path.includes('/status') && !path.includes('/ticket') && req.method === 'PUT') {
      const orderId = parts[2];
      const { order: orderUpdate, items: itemsUpdate } = body;
      
      const updatedOrder = await updateOrder(orderId, orderUpdate, itemsUpdate);
      return res.json(updatedOrder);
    }

    // Delete order
    if (path.startsWith('/api/orders/') && req.method === 'DELETE') {
      const orderId = parts[2];
      
      await deleteOrder(orderId);
      return res.json({ message: 'Pedido deletado com sucesso' });
    }

    // Stats routes
    if (path === '/api/stats' && req.method === 'GET') {
      const stats = await getStats();
      return res.json(stats);
    }

    // PDF ticket generation
    if (path.startsWith('/api/orders/') && path.includes('/ticket') && req.method === 'POST') {
      const orderId = parts[2];
      
      const order = await getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Buscar itens do pedido
      const allOrderItems = await getOrderItems();
      const products = await getProducts();
      const users = await getUsers();
      
      const items = allOrderItems
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}