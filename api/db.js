import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join } from 'path';

// Banco SQLite local - cria o arquivo automaticamente
const dbPath = join(process.cwd(), 'data.db');
const sqlite = new Database(dbPath);

// Ativa WAL mode para melhor performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle({ client: sqlite, schema });