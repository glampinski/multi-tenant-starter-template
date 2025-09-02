const { Client } = require('pg');

// Test both connection strings
const configs = [
  {
    name: 'Pooled Connection',
    connectionString: "postgresql://postgres.mmncozelbhuhpssphoih:jYkdup-biftis-zonka2@aws-1-eu-central-2.pooler.supabase.com:6543/postgres"
  },
  {
    name: 'Direct Connection (5432)',
    connectionString: "postgresql://postgres.mmncozelbhuhpssphoih:jYkdup-biftis-zonka2@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
  },
  {
    name: 'Direct Supabase',
    connectionString: "postgresql://postgres:jYkdup-biftis-zonka2@db.mmncozelbhuhpssphoih.supabase.co:5432/postgres"
  }
];

async function testConnection(config) {
  const client = new Client({
    connectionString: config.connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`✅ ${config.name}: Connection successful`);
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
    
    await client.end();
  } catch (error) {
    console.log(`❌ ${config.name}: Connection failed`);
    console.log(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log('Testing Supabase connections...\n');
  
  for (const config of configs) {
    await testConnection(config);
    console.log('');
  }
}

main().catch(console.error);
