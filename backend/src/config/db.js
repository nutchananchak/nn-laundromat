import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
    connection.release();
  } catch (error) {
    console.error('เชื่อมต่อฐานข้อมูลล้มเหลว:', error.message);
  }
};

export default pool;