import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool =  mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'A0957333255a',
  database: process.env.DB_NAME || 'san_jose_encuestas',
  port: process.env.DB_PORT || 3306,
  timezone: '-05:00', // 🇪🇨 Ecuador
});

export default pool;