import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Railway PostgreSQL Connection Test ===');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('Testing Railway PostgreSQL connection...');

pool.query('SELECT NOW() as current_time, version() as db_version')
  .then(res => {
    console.log('✅ SUCCESS! Railway PostgreSQL connected!');
    console.log('Current time:', res.rows[0].current_time);
    console.log('Database version:', res.rows[0].db_version.split(' ')[0]);
    console.log('\n🎉 Your Railway PostgreSQL connection is working!');
    
    // Test if tables exist
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
  })
  .then(res => {
    console.log('\n=== Existing Tables ===');
    if (res.rows.length === 0) {
      console.log('No tables found. You need to run the database setup.');
      console.log('Copy the contents of database-setup.sql and run it in Railway SQL editor.');
    } else {
      console.log('Tables found:', res.rows.map(row => row.table_name).join(', '));
    }
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ FAILED:', err.message);
    console.log('\n=== TROUBLESHOOTING ===');
    console.log('1. Make sure you have a Railway PostgreSQL database');
    console.log('2. Copy the connection string from Railway dashboard');
    console.log('3. Update your .env file with the Railway DATABASE_URL');
    console.log('4. The connection string should look like:');
    console.log('   postgresql://postgres:PASSWORD@CONTAINER.railway.app:PORT/railway');
    process.exit(1);
  }); 