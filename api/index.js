// API Serverless completa para Vercel
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, desc, sql } from 'drizzle-orm';
import { join } from 'path';

// Schema simplificado (apenas as tabelas necessárias)
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Users table
const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('vendor'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Products table
const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: text('size').notNull(),
  price: real('price').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Orders table
const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('pendente'),
  deliveryStatus: text('delivery_status').notNull().default('preparando'),
  vendorId: text('vendor_id'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Order items table
const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  orderId: text('order_id').notNull(),
  productId: text('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
});

// Configurar banco de dados
let db;
try {
  const dbPath = join(process.cwd(), 'data.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  db = drizzle({ client: sqlite, schema: { users, products, orders, orderItems } });
} catch (error) {
  console.error('Database initialization error:', error);
}

// Função para inicializar dados se necessário
async function initializeData() {
  try {
    // Verificar se já existem produtos
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('🌱 Inicializando produtos...');
      
      const productsData = [
        { name: 'Canjiquinha', type: 'tipica', size: 'marmitex', price: 20 },
        { name: 'Canjiquinha', type: 'tipica', size: 'cumbuquinha', price: 10 },
        { name: 'Feijão amigo', type: 'tipica', size: 'marmitex', price: 20 },
        { name: 'Feijão amigo', type: 'tipica', size: 'cumbuquinha', price: 10 },
        { name: 'Vaca atolada', type: 'tipica', size: 'marmitex', price: 25 },
        { name: 'Vaca atolada', type: 'tipica', size: 'cumbuquinha', price: 15 }
      ];
      
      for (const product of productsData) {
        await db.insert(products).values(product);
      }
    }
    
    // Verificar se existe usuário admin
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    if (adminUser.length === 0) {
      console.log('👤 Criando usuário admin...');
      await db.insert(users).values({
        username: 'admin',
        name: 'Administrador',
        password: 'gafac123',
        role: 'admin'
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Função para processar URL e extrair parâmetros
function parseUrl(url) {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  const query = new URLSearchParams(url.split('?')[1] || '');
  return { parts, query };
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

  // Inicializar dados se necessário (apenas uma vez)
  if (db) {
    await initializeData();
  }

  const { parts, query } = parseUrl(req.url);
  const path = '/' + parts.join('/');

  try {
    // Health check
    if (path === '/api/health') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'vercel' 
      });
    }

    // Auth routes
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { username, password } = req.body;
      
      const user = await db.select().from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (!user[0] || user[0].password !== password) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      return res.json({ 
        user: { 
          id: user[0].id, 
          username: user[0].username, 
          name: user[0].name, 
          role: user[0].role 
        } 
      });
    }

    // Users routes
    if (path === '/api/users' && req.method === 'GET') {
      const allUsers = await db.select().from(users);
      return res.json(allUsers.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })));
    }

    if (path === '/api/users' && req.method === 'POST') {
      const { username, name, password, role = 'vendor' } = req.body;
      
      if (!username || !name || !password) {
        return res.status(400).json({ message: 'Campos obrigatórios: username, name, password' });
      }

      const newUser = await db.insert(users).values({
        username,
        name,
        password,
        role
      }).returning();

      return res.status(201).json({ 
        id: newUser[0].id, 
        username: newUser[0].username, 
        name: newUser[0].name, 
        role: newUser[0].role 
      });
    }

    // Products routes
    if (path === '/api/products' && req.method === 'GET') {
      const allProducts = await db.select().from(products).where(eq(products.active, true));
      return res.json(allProducts);
    }

    if (path === '/api/products' && req.method === 'POST') {
      const { name, type, size, price } = req.body;
      
      const newProduct = await db.insert(products).values({
        name,
        type,
        size,
        price: parseFloat(price)
      }).returning();

      return res.status(201).json(newProduct[0]);
    }

    // Orders routes
    if (path === '/api/orders' && req.method === 'GET') {
      const limit = query.get('limit') ? parseInt(query.get('limit')) : undefined;
      
      let ordersQuery = db.select().from(orders).orderBy(desc(orders.createdAt));
      if (limit) ordersQuery = ordersQuery.limit(limit);
      
      const allOrders = await ordersQuery;
      
      // Para cada pedido, buscar os itens
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db.select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: products.name,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            totalPrice: orderItems.totalPrice
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));
          
          return { ...order, items };
        })
      );
      
      return res.json(ordersWithItems);
    }

    if (path === '/api/orders' && req.method === 'POST') {
      const { order, items } = req.body;
      
      if (!order || !items) {
        return res.status(400).json({ message: 'Order e items são obrigatórios' });
      }

      // Gerar número do pedido
      const orderNumber = `ORD-${Date.now()}`;
      
      // Criar o pedido
      const newOrder = await db.insert(orders).values({
        orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: parseFloat(order.totalAmount),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus || 'pendente',
        deliveryStatus: order.deliveryStatus || 'preparando',
        vendorId: order.vendorId,
        notes: order.notes
      }).returning();

      // Criar os itens do pedido
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: newOrder[0].id,
          productId: item.productId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        });
      }

      // Buscar o pedido completo com itens
      const orderWithItems = await db.select().from(orders).where(eq(orders.id, newOrder[0].id));
      const orderItemsData = await db.select().from(orderItems).where(eq(orderItems.orderId, newOrder[0].id));
      
      return res.status(201).json({ ...orderWithItems[0], items: orderItemsData });
    }

    // Update order
    if (path.startsWith('/api/orders/') && !path.includes('/status') && !path.includes('/ticket') && req.method === 'PUT') {
      const orderId = parts[2];
      const { order, items } = req.body;
      
      // Atualizar dados do pedido
      if (order) {
        await db.update(orders)
          .set({
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            totalAmount: order.totalAmount ? parseFloat(order.totalAmount) : undefined,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            deliveryStatus: order.deliveryStatus,
            notes: order.notes
          })
          .where(eq(orders.id, orderId));
      }
      
      // Se novos itens foram fornecidos, substituir todos
      if (items) {
        // Deletar itens existentes
        await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
        
        // Inserir novos itens
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId,
            productId: item.productId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice)
          });
        }
      }
      
      // Retornar pedido atualizado
      const updatedOrder = await db.select().from(orders).where(eq(orders.id, orderId));
      const updatedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      
      return res.json({ ...updatedOrder[0], items: updatedItems });
    }

    // Delete order
    if (path.startsWith('/api/orders/') && req.method === 'DELETE') {
      const orderId = parts[2];
      
      // Deletar itens primeiro
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
      
      // Deletar pedido
      await db.delete(orders).where(eq(orders.id, orderId));
      
      return res.json({ message: 'Pedido deletado com sucesso' });
    }

    // Stats routes
    if (path === '/api/stats' && req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      
      const allOrders = await db.select().from(orders);
      const todayOrders = allOrders.filter(o => o.createdAt?.startsWith(today));
      
      const stats = {
        ordersToday: todayOrders.length,
        revenueToday: todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        pendingPayments: allOrders.filter(o => o.paymentStatus === 'pendente').length,
        pendingDeliveries: allOrders.filter(o => o.deliveryStatus === 'preparando').length
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
      error: error.message 
    });
  }
}