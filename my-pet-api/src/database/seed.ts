import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { initializeDatabase, db } from './init';

async function seed() {
  console.log('🌱 Seeding database...');
  
  initializeDatabase();

  // Create demo veterinary
  const vetId = uuidv4();
  const adminId = uuidv4();
  const hashedPassword = await bcrypt.hash('demo123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO veterinaries (id, name, slug, email, phone, address, city)
    VALUES (?, 'Veterinaria Demo', 'veterinaria-demo', 'demo@mypet.com', '555-1234', 'Calle Principal 123', 'Ciudad')
  `).run(vetId);

  db.prepare(`
    INSERT OR IGNORE INTO veterinary_staff (id, veterinary_id, email, password, name, role, license_number)
    VALUES (?, ?, 'admin@demo.com', ?, 'Dr. Demo Admin', 'admin', 'VET-001')
  `).run(adminId, vetId, hashedPassword);

  // Create demo user (pet owner)
  const userId = uuidv4();
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, name, phone)
    VALUES (?, 'cliente@demo.com', ?, 'Cliente Demo', '555-5678')
  `).run(userId, hashedPassword);

  // Link user to veterinary
  db.prepare(`
    INSERT OR IGNORE INTO veterinary_clients (id, veterinary_id, user_id, client_number)
    VALUES (?, ?, ?, 'C-0001')
  `).run(uuidv4(), vetId, userId);

  // Create loyalty card
  const loyaltyCardId = uuidv4();
  db.prepare(`
    INSERT OR IGNORE INTO loyalty_cards (id, user_id, veterinary_id, total_points)
    VALUES (?, ?, ?, 150)
  `).run(loyaltyCardId, userId, vetId);

  // Create demo pets
  const pet1Id = uuidv4();
  const pet2Id = uuidv4();

  db.prepare(`
    INSERT OR IGNORE INTO pets (id, owner_id, name, species, breed, gender, birth_date, weight, color, microchip_number, is_neutered)
    VALUES (?, ?, 'Max', 'dog', 'Labrador Retriever', 'male', '2020-03-15', 28.5, 'Dorado', 'CHIP123456789', 1)
  `).run(pet1Id, userId);

  db.prepare(`
    INSERT OR IGNORE INTO pets (id, owner_id, name, species, breed, gender, birth_date, weight, color, is_neutered)
    VALUES (?, ?, 'Luna', 'cat', 'Siamés', 'female', '2021-06-20', 4.2, 'Crema', 0)
  `).run(pet2Id, userId);

  // Create passport for Max
  db.prepare(`
    INSERT OR IGNORE INTO pet_passports (id, pet_id, passport_number, issue_date, issue_country, microchip_date, rabies_valid_until)
    VALUES (?, ?, 'MX-2023-001234', '2023-01-15', 'México', '2020-04-01', '2025-01-15')
  `).run(uuidv4(), pet1Id);

  // Create default service types
  const serviceTypes = [
    { name: 'Consulta General', price: 500, points: 10, threshold: null },
    { name: 'Baño Pequeño', price: 250, points: 5, threshold: 4 },
    { name: 'Baño Mediano', price: 350, points: 5, threshold: 4 },
    { name: 'Baño Grande', price: 450, points: 8, threshold: 4 },
    { name: 'Baño y Corte', price: 550, points: 10, threshold: 4 },
    { name: 'Vacunación', price: 400, points: 10, threshold: null },
    { name: 'Desparasitación', price: 200, points: 5, threshold: null },
    { name: 'Estética Canina', price: 400, points: 8, threshold: null },
    { name: 'Limpieza Dental', price: 800, points: 15, threshold: null },
  ];

  const serviceTypeIds: Record<string, string> = {};
  
  for (const service of serviceTypes) {
    const id = uuidv4();
    serviceTypeIds[service.name] = id;
    db.prepare(`
      INSERT OR IGNORE INTO service_types (id, veterinary_id, name, price, loyalty_points, loyalty_threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, vetId, service.name, service.price, service.points, service.threshold);
  }

  // Create some medical records
  db.prepare(`
    INSERT INTO medical_records (id, pet_id, veterinary_id, staff_id, visit_date, reason, diagnosis, treatment, weight, temperature, notes)
    VALUES (?, ?, ?, ?, '2024-01-10', 'Revisión anual', 'Mascota sana', 'Ninguno requerido', 28.5, 38.5, 'Max está en excelentes condiciones')
  `).run(uuidv4(), pet1Id, vetId, adminId);

  db.prepare(`
    INSERT INTO medical_records (id, pet_id, veterinary_id, staff_id, visit_date, reason, diagnosis, treatment, prescription, weight, temperature)
    VALUES (?, ?, ?, ?, '2024-02-15', 'Malestar estomacal', 'Gastritis leve', 'Dieta blanda por 3 días', 'Omeprazol 10mg cada 24h', 27.8, 38.8)
  `).run(uuidv4(), pet1Id, vetId, adminId);

  // Create vaccines
  db.prepare(`
    INSERT INTO vaccines (id, pet_id, veterinary_id, staff_id, vaccine_name, vaccine_type, batch_number, manufacturer, application_date, next_dose_date, is_international)
    VALUES (?, ?, ?, ?, 'Rabia', 'Antirrábica', 'RAB-2024-001', 'Zoetis', '2024-01-15', '2025-01-15', 1)
  `).run(uuidv4(), pet1Id, vetId, adminId);

  db.prepare(`
    INSERT INTO vaccines (id, pet_id, veterinary_id, staff_id, vaccine_name, vaccine_type, batch_number, application_date, next_dose_date)
    VALUES (?, ?, ?, ?, 'Múltiple (DHLPP)', 'Polivalente', 'DHLPP-2024-045', '2024-01-15', '2025-01-15')
  `).run(uuidv4(), pet1Id, vetId, adminId);

  db.prepare(`
    INSERT INTO vaccines (id, pet_id, veterinary_id, staff_id, vaccine_name, application_date, next_dose_date)
    VALUES (?, ?, ?, ?, 'Triple Felina', '2024-02-01', '2025-02-01')
  `).run(uuidv4(), pet2Id, vetId, adminId);

  // Create service records (baths)
  const bathServiceId = serviceTypeIds['Baño Grande'];
  for (let i = 0; i < 3; i++) {
    db.prepare(`
      INSERT INTO service_records (id, pet_id, veterinary_id, service_type_id, staff_id, service_date, price)
      VALUES (?, ?, ?, ?, ?, DATE('now', '-${30 * i} days'), 450)
    `).run(uuidv4(), pet1Id, vetId, bathServiceId, adminId);
  }

  // Create loyalty service counter (3 baths completed, 2 more for free one)
  db.prepare(`
    INSERT INTO loyalty_service_counters (id, loyalty_card_id, service_type_id, count)
    VALUES (?, ?, ?, 3)
  `).run(uuidv4(), loyaltyCardId, bathServiceId);

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('================');
  console.log('Dashboard (Staff):');
  console.log('  Email: admin@demo.com');
  console.log('  Password: demo123');
  console.log('');
  console.log('App (Client):');
  console.log('  Email: cliente@demo.com');
  console.log('  Password: demo123');
}

seed().catch(console.error);
