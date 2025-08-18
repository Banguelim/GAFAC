import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';
import { existsSync } from 'fs';
import { join } from 'path';
import { seedDatabase } from './seed-data';

// Função para inicializar o banco de dados
export async function initDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados SQLite...');
    
    const dbPath = join(process.cwd(), 'data.db');
    const isNewDatabase = !existsSync(dbPath);
    
    if (isNewDatabase) {
      // Executa as migrações apenas se for um banco novo
      await migrate(db, { migrationsFolder: './migrations' });
      console.log('✅ Banco de dados criado e inicializado com sucesso!');
      
      // Insere dados iniciais
      await seedDatabase();
    } else {
      console.log('✅ Banco de dados SQLite encontrado e conectado!');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}
