// Vercel Serverless Function
export default function handler(req, res) {
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

  // Health check
  if (req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: 'vercel' 
    });
  }

  // Mock data para teste
  if (req.url === '/api/products' && req.method === 'GET') {
    return res.status(200).json([
      {
        id: '1',
        name: 'Canjiquinha',
        type: 'tipica',
        size: 'marmitex',
        price: 20,
        active: true
      },
      {
        id: '2',
        name: 'Canjiquinha',
        type: 'tipica',
        size: 'cumbuquinha',
        price: 10,
        active: true
      },
      {
        id: '3',
        name: 'Feijão amigo',
        type: 'tipica',
        size: 'marmitex',
        price: 20,
        active: true
      },
      {
        id: '4',
        name: 'Feijão amigo',
        type: 'tipica',
        size: 'cumbuquinha',
        price: 10,
        active: true
      },
      {
        id: '5',
        name: 'Vaca atolada',
        type: 'tipica',
        size: 'marmitex',
        price: 25,
        active: true
      },
      {
        id: '6',
        name: 'Vaca atolada',
        type: 'tipica',
        size: 'cumbuquinha',
        price: 15,
        active: true
      }
    ]);
  }

  // Mock orders
  if (req.url === '/api/orders' && req.method === 'GET') {
    return res.status(200).json([]);
  }

  // Mock stats
  if (req.url === '/api/stats' && req.method === 'GET') {
    return res.status(200).json({
      ordersToday: 0,
      revenueToday: 0,
      pendingPayments: 0,
      pendingDeliveries: 0
    });
  }

  // Mock login
  if (req.url === '/api/auth/login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    
    if (username === 'admin' && password === 'gafac123') {
      return res.status(200).json({
        user: {
          id: '1',
          username: 'admin',
          name: 'Administrador',
          role: 'admin'
        }
      });
    }
    
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Para outras rotas, retornar erro 404
  return res.status(404).json({ 
    message: 'API endpoint not found',
    url: req.url,
    method: req.method 
  });
}