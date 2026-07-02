/**
 * Run once to create the first super_admin:
 *   npx ts-node -r tsconfig-paths/register create-admin.ts
 *
 * Change USERNAME / PASSWORD / EMAIL below before running.
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const USERNAME = 'superadmin';
const PASSWORD = 'Admin@1234';
const EMAIL    = 'admin@casino.com';

async function main() {
  const ds = new DataSource({
    type: 'mysql',
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3333'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'gioocharkviani',
    database: process.env.DB_DATABASE || 'casino',
    entities: [path.join(__dirname, 'libs/database/entities/**/*.entity.{ts,js}')],
    synchronize: false,
    timezone: '+04:00',
    charset:  'utf8mb4',
  });

  await ds.initialize();

  const hash = await bcrypt.hash(PASSWORD, 10);

  await ds.query(`
    INSERT INTO admins (id, username, password, email, role, isActive, createdAt, updatedAt)
    VALUES (UUID(), ?, ?, ?, 'super_admin', 1, NOW(), NOW())
    ON DUPLICATE KEY UPDATE updatedAt = NOW()
  `, [USERNAME, hash, EMAIL]);

  console.log('');
  console.log('✅  Super admin created successfully!');
  console.log('   Username:', USERNAME);
  console.log('   Password:', PASSWORD);
  console.log('   Email:   ', EMAIL);
  console.log('');
  console.log('👉  Log in at http://localhost:3001/login');

  await ds.destroy();
}

main().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
