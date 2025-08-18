import { db } from './db';
import { users, products } from '@shared/schema';

// Dados iniciais para demonstração
export async function seedDatabase() {
  try {
    console.log('🌱 Inserindo dados iniciais...');

    // Verifica se já há dados
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('✅ Dados já existem, pulando seed');
      return;
    }

    // Inserir usuários de exemplo
    await db.insert(users).values([
      {
        username: 'admin',
        password: 'admin123', // Em produção, usar hash
        role: 'admin',
        name: 'Administrador'
      },
      {
        username: 'vendedor1',
        password: 'vend123', // Em produção, usar hash
        role: 'vendor',
        name: 'João Vendedor'
      }
    ]);

    // Inserir produtos de exemplo
    await db.insert(products).values([
      // Caldos
      { name: 'Caldo de Feijão', type: 'caldo', size: 'pequeno', price: 8.50 },
      { name: 'Caldo de Feijão', type: 'caldo', size: 'grande', price: 12.00 },
      { name: 'Caldo de Cana', type: 'caldo', size: 'pequeno', price: 6.00 },
      { name: 'Caldo de Cana', type: 'caldo', size: 'grande', price: 9.00 },
      
      // Pizzas
      { name: 'Pizza Margherita', type: 'pizza', size: 'pequeno', price: 25.00 },
      { name: 'Pizza Margherita', type: 'pizza', size: 'grande', price: 35.00 },
      { name: 'Pizza Portuguesa', type: 'pizza', size: 'pequeno', price: 28.00 },
      { name: 'Pizza Portuguesa', type: 'pizza', size: 'grande', price: 38.00 },
      
      // Comidas típicas
      { name: 'Tapioca', type: 'tipica', size: 'unico', price: 15.00 },
      { name: 'Acarajé', type: 'tipica', size: 'unico', price: 12.00 },
      { name: 'Pastéis', type: 'tipica', size: 'marmitex', price: 18.00 },
      { name: 'Coxinha', type: 'tipica', size: 'cumbuquinha', price: 8.00 }
    ]);

    console.log('✅ Dados iniciais inseridos com sucesso!');
    console.log('👤 Usuários criados:');
    console.log('   - admin/admin123 (Administrador)');
    console.log('   - vendedor1/vend123 (Vendedor)');
  } catch (error) {
    console.error('❌ Erro ao inserir dados iniciais:', error);
  }
}
