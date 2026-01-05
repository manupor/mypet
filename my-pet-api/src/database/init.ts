import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
export const db = new Database(dbPath);

export function initializeDatabase() {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Users table (clients/pet owners)
  db.exec(`
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

  // Veterinaries table (tenants)
  db.exec(`
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

  // Veterinary staff (vets, receptionists, admins)
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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

  // Services (baths, grooming, etc.)
  db.exec(`
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
  db.exec(`
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

  // Loyalty program
  db.exec(`
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
  db.exec(`
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

  // Service counters for loyalty (e.g., bath counter for "5th free")
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
    CREATE INDEX IF NOT EXISTS idx_medical_records_pet ON medical_records(pet_id);
    CREATE INDEX IF NOT EXISTS idx_vaccines_pet ON vaccines(pet_id);
    CREATE INDEX IF NOT EXISTS idx_vaccines_next_dose ON vaccines(next_dose_date);
    CREATE INDEX IF NOT EXISTS idx_service_records_pet ON service_records(pet_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user ON loyalty_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);
  `);

  console.log('Database tables created successfully');
}

export default db;
