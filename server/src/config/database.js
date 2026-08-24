import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import { env } from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sequelize;

if (env.DB_DIALECT === 'sqlite') {
  const storagePath = path.resolve(__dirname, '../../', env.DB_STORAGE);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: env.NODE_ENV === 'development' ? false : false,
    define: {
      timestamps: true
    }
  });
} else {
  const isCloudDb = env.DB_HOST !== 'localhost' && env.DB_HOST !== '127.0.0.1';
  const sslOptions = isCloudDb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

  // Auto-create MySQL database if it does not exist (for local or permission-enabled instances)
  try {
    const connection = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: sslOptions
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\`;`);
    await connection.end();
  } catch (err) {
    console.warn(`[MySQL Auto-Create Warning] ${err.message}`);
  }

  sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: isCloudDb ? { ssl: sslOptions } : {},
    logging: false,
    define: {
      timestamps: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

export default sequelize;
