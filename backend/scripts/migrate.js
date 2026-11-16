import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant dans backend/.env');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
try {
 const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../sql');
 const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
 for (const file of files) { console.log(`Application de ${file}...`); await pool.query(fs.readFileSync(path.join(dir,file),'utf8')); }
 console.log('Schéma PostgreSQL initialisé.');
} finally { await pool.end(); }
