import { createClient, Client } from '@libsql/client';

// Create Turso client
const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./database.sqlite',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Database wrapper with similar API to better-sqlite3
class DatabaseWrapper {
  prepare(sql: string) {
    return {
      run: async (...params: any[]) => {
        await client.execute({ sql, args: params });
        return { changes: 1 };
      },
      get: async (...params: any[]) => {
        const result = await client.execute({ sql, args: params });
        return result.rows[0] || null;
      },
      all: async (...params: any[]) => {
        const result = await client.execute({ sql, args: params });
        return result.rows;
      }
    };
  }

  async exec(sql: string) {
    // Split multiple statements and execute each
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await client.execute(stmt);
      }
    }
  }
}

export const db = new DatabaseWrapper();

export async function initializeDatabase() {
  const isProduction = !!process.env.TURSO_DATABASE_URL;
  console.log(`🗄️  Using ${isProduction ? 'Turso (cloud)' : 'SQLite (local)'} database`);

  try {
    // Users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        auth_provider TEXT DEFAULT 'local',
        auth_provider_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Veterinaries table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS veterinaries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        logo TEXT,
        plan TEXT DEFAULT 'starter',
        is_active INTEGER DEFAULT 1,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Veterinary staff
    await client.execute(`
      CREATE TABLE IF NOT EXISTS veterinary_staff (
        id TEXT PRIMARY KEY,
        veterinary_id TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'vet',
        phone TEXT,
        avatar TEXT,
        license_number TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        UNIQUE(veterinary_id, email)
      )
    `);

    // Pets table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        species TEXT NOT NULL,
        breed TEXT,
        gender TEXT,
        birth_date DATE,
        weight REAL,
        color TEXT,
        photo TEXT,
        microchip_number TEXT,
        is_neutered INTEGER DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Pet passports
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pet_passports (
        id TEXT PRIMARY KEY,
        pet_id TEXT UNIQUE NOT NULL,
        passport_number TEXT,
        issue_date DATE,
        issue_country TEXT,
        expiry_date DATE,
        microchip_date DATE,
        microchip_location TEXT,
        document_photo TEXT,
        rabies_valid_until DATE,
        additional_info TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
      )
    `);

    // Veterinary-Client relationship
    await client.execute(`
      CREATE TABLE IF NOT EXISTS veterinary_clients (
        id TEXT PRIMARY KEY,
        veterinary_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        client_number TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(veterinary_id, user_id)
      )
    `);

    // Medical records
    await client.execute(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        veterinary_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        visit_date DATETIME NOT NULL,
        reason TEXT,
        diagnosis TEXT,
        treatment TEXT,
        prescription TEXT,
        weight REAL,
        temperature REAL,
        heart_rate INTEGER,
        notes TEXT,
        follow_up_date DATE,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES veterinary_staff(id)
      )
    `);

    // Vaccines
    await client.execute(`
      CREATE TABLE IF NOT EXISTS vaccines (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        veterinary_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        vaccine_name TEXT NOT NULL,
        vaccine_type TEXT,
        batch_number TEXT,
        manufacturer TEXT,
        application_date DATE NOT NULL,
        expiry_date DATE,
        next_dose_date DATE,
        notes TEXT,
        is_international INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES veterinary_staff(id)
      )
    `);

    // Vaccine reminders
    await client.execute(`
      CREATE TABLE IF NOT EXISTS vaccine_reminders (
        id TEXT PRIMARY KEY,
        vaccine_id TEXT NOT NULL,
        pet_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reminder_date DATE NOT NULL,
        is_sent INTEGER DEFAULT 0,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vaccine_id) REFERENCES vaccines(id) ON DELETE CASCADE,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Service types
    await client.execute(`
      CREATE TABLE IF NOT EXISTS service_types (
        id TEXT PRIMARY KEY,
        veterinary_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price REAL,
        loyalty_points INTEGER DEFAULT 0,
        loyalty_threshold INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE
      )
    `);

    // Service records
    await client.execute(`
      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        veterinary_id TEXT NOT NULL,
        service_type_id TEXT NOT NULL,
        staff_id TEXT,
        service_date DATETIME NOT NULL,
        price REAL,
        notes TEXT,
        is_free INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id),
        FOREIGN KEY (staff_id) REFERENCES veterinary_staff(id)
      )
    `);

    // Loyalty cards
    await client.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_cards (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        veterinary_id TEXT NOT NULL,
        total_points INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'bronze',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        UNIQUE(user_id, veterinary_id)
      )
    `);

    // Loyalty transactions
    await client.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id TEXT PRIMARY KEY,
        loyalty_card_id TEXT NOT NULL,
        type TEXT NOT NULL,
        points INTEGER NOT NULL,
        description TEXT,
        reference_id TEXT,
        reference_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loyalty_card_id) REFERENCES loyalty_cards(id) ON DELETE CASCADE
      )
    `);

    // Service counters for loyalty
    await client.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_service_counters (
        id TEXT PRIMARY KEY,
        loyalty_card_id TEXT NOT NULL,
        service_type_id TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        last_reset DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loyalty_card_id) REFERENCES loyalty_cards(id) ON DELETE CASCADE,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
        UNIQUE(loyalty_card_id, service_type_id)
      )
    `);

    // Appointments
    await client.execute(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        pet_id TEXT NOT NULL,
        veterinary_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        staff_id TEXT,
        service_type TEXT,
        scheduled_date DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (veterinary_id) REFERENCES veterinaries(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES veterinary_staff(id)
      )
    `);

    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON medical_records(pet_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_vaccines_pet ON vaccines(pet_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_vaccines_next_dose ON vaccines(next_dose_date)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_service_records_pet ON service_records(pet_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user ON loyalty_cards(user_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date)`);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export { client };
export default db;
