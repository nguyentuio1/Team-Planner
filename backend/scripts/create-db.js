require('dotenv').config();
const { Pool } = require('pg');

async function createDatabase() {
  // Connect to PostgreSQL without specifying a database
  const adminPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('🔄 Checking if database exists...');
    
    // Check if database exists
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    if (result.rows.length === 0) {
      console.log('📝 Creating database...');
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists!');
    }

    await adminPool.end();
    console.log('🎯 Ready to run migrations!');
    
  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    process.exit(1);
  }
}

createDatabase();