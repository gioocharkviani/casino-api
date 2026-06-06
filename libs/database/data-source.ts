import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [path.join(__dirname, 'entities', '**', '*.entity.{ts,js}')],

  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],

  synchronize: false,
  logging: true,
  timezone: '+04:00',
  charset: 'utf8mb4',
});
