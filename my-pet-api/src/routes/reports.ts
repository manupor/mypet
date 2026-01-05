import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// Generate pet card PDF (for owners)
router.get('/pet-card/:petId', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { petId } = req.params;
    const userId = req.user.id;

    const pet = db.prepare(`
      SELECT p.*, u.name as owner_name, u.phone as owner_phone,
             pp.passport_number, pp.microchip_date, pp.rabies_valid_until
      FROM pets p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN pet_passports pp ON p.id = pp.pet_id
      WHERE p.id = ? AND p.owner_id = ?
    `).get(petId, userId) as any;

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }

    // Get recent vaccines
    const vaccines = db.prepare(`
      SELECT vaccine_name, application_date, next_dose_date
      FROM vaccines
      WHERE pet_id = ?
      ORDER BY application_date DESC
      LIMIT 5
    `).all(petId) as any[];

    // Create PDF
    const doc = new PDFDocument({ size: 'A6', layout: 'landscape', margin: 20 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tarjeta-${pet.name}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('🐾 My Pet', { align: 'center' });
    doc.moveDown(0.5);

    // Pet info
    doc.fontSize(14).font('Helvetica-Bold').text(pet.name);
    doc.fontSize(10).font('Helvetica');
    doc.text(`${pet.species === 'dog' ? '🐕' : '🐱'} ${pet.breed || pet.species}`);
    
    if (pet.birth_date) {
      doc.text(`Nacimiento: ${format(new Date(pet.birth_date), 'd MMM yyyy', { locale: es })}`);
    }
    
    if (pet.microchip_number) {
      doc.text(`Microchip: ${pet.microchip_number}`);
    }

    if (pet.passport_number) {
      doc.text(`Pasaporte: ${pet.passport_number}`);
    }

    doc.moveDown(0.5);
    doc.text(`Dueño: ${pet.owner_name}`);
    doc.text(`Tel: ${pet.owner_phone || 'No registrado'}`);

    // Vaccines
    if (vaccines.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').text('Vacunas recientes:');
      doc.fontSize(9).font('Helvetica');
      
      vaccines.forEach(v => {
        doc.text(`• ${v.vaccine_name} - ${format(new Date(v.application_date), 'd/MM/yy')}`);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Generate pet card error:', error);
    res.status(500).json({ success: false, message: 'Error al generar tarjeta' });
  }
});

// Generate complete medical report PDF
router.get('/medical-report/:petId', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { petId } = req.params;
    const userId = req.user.id;

    const pet = db.prepare(`
      SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             pp.*
      FROM pets p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN pet_passports pp ON p.id = pp.pet_id
      WHERE p.id = ? AND p.owner_id = ?
    `).get(petId, userId) as any;

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }

    // Get all medical records
    const medicalRecords = db.prepare(`
      SELECT mr.*, v.name as veterinary_name, s.name as vet_name
      FROM medical_records mr
      JOIN veterinaries v ON mr.veterinary_id = v.id
      JOIN veterinary_staff s ON mr.staff_id = s.id
      WHERE mr.pet_id = ?
      ORDER BY mr.visit_date DESC
    `).all(petId) as any[];

    // Get all vaccines
    const vaccines = db.prepare(`
      SELECT v.*, vet.name as veterinary_name, s.name as vet_name
      FROM vaccines v
      JOIN veterinaries vet ON v.veterinary_id = vet.id
      JOIN veterinary_staff s ON v.staff_id = s.id
      WHERE v.pet_id = ?
      ORDER BY v.application_date DESC
    `).all(petId) as any[];

    // Get all services
    const services = db.prepare(`
      SELECT sr.*, st.name as service_name, v.name as veterinary_name
      FROM service_records sr
      JOIN service_types st ON sr.service_type_id = st.id
      JOIN veterinaries v ON sr.veterinary_id = v.id
      WHERE sr.pet_id = ?
      ORDER BY sr.service_date DESC
    `).all(petId) as any[];

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expediente-${pet.name}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('🐾 My Pet', { align: 'center' });
    doc.fontSize(16).text('Expediente Médico Completo', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generado: ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`, { align: 'center' });
    
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Pet info
    doc.fontSize(16).font('Helvetica-Bold').text('Información de la Mascota');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    
    const speciesEmoji = pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾';
    doc.text(`Nombre: ${pet.name} ${speciesEmoji}`);
    doc.text(`Especie: ${pet.species}`);
    if (pet.breed) doc.text(`Raza: ${pet.breed}`);
    if (pet.gender) doc.text(`Género: ${pet.gender === 'male' ? 'Macho' : 'Hembra'}`);
    if (pet.birth_date) doc.text(`Fecha de nacimiento: ${format(new Date(pet.birth_date), "d 'de' MMMM yyyy", { locale: es })}`);
    if (pet.weight) doc.text(`Peso: ${pet.weight} kg`);
    if (pet.color) doc.text(`Color: ${pet.color}`);
    if (pet.microchip_number) doc.text(`Número de microchip: ${pet.microchip_number}`);
    doc.text(`Esterilizado: ${pet.is_neutered ? 'Sí' : 'No'}`);

    doc.moveDown();
    doc.text(`Propietario: ${pet.owner_name}`);
    doc.text(`Email: ${pet.owner_email}`);
    if (pet.owner_phone) doc.text(`Teléfono: ${pet.owner_phone}`);

    // Passport info
    if (pet.passport_number) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('📘 Pasaporte');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Número: ${pet.passport_number}`);
      if (pet.issue_country) doc.text(`País de emisión: ${pet.issue_country}`);
      if (pet.issue_date) doc.text(`Fecha de emisión: ${format(new Date(pet.issue_date), 'd/MM/yyyy')}`);
      if (pet.expiry_date) doc.text(`Vencimiento: ${format(new Date(pet.expiry_date), 'd/MM/yyyy')}`);
      if (pet.rabies_valid_until) doc.text(`Rabia válida hasta: ${format(new Date(pet.rabies_valid_until), 'd/MM/yyyy')}`);
    }

    // Vaccines section
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('💉 Historial de Vacunación');
    doc.moveDown(0.5);

    if (vaccines.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay vacunas registradas.');
    } else {
      vaccines.forEach((vaccine, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${vaccine.vaccine_name}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Fecha: ${format(new Date(vaccine.application_date), 'd/MM/yyyy')}`);
        if (vaccine.next_dose_date) {
          doc.text(`Próxima dosis: ${format(new Date(vaccine.next_dose_date), 'd/MM/yyyy')}`);
        }
        if (vaccine.batch_number) doc.text(`Lote: ${vaccine.batch_number}`);
        if (vaccine.manufacturer) doc.text(`Fabricante: ${vaccine.manufacturer}`);
        doc.text(`Veterinaria: ${vaccine.veterinary_name} - Dr. ${vaccine.vet_name}`);
        if (vaccine.is_international) doc.text('✈️ Vacuna internacional');
        doc.moveDown(0.5);
      });
    }

    // Medical records section
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('🏥 Historial Médico');
    doc.moveDown(0.5);

    if (medicalRecords.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay registros médicos.');
    } else {
      medicalRecords.forEach((record, index) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`${format(new Date(record.visit_date), "d 'de' MMMM yyyy", { locale: es })}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Veterinaria: ${record.veterinary_name}`);
        doc.text(`Atendido por: Dr. ${record.vet_name}`);
        
        if (record.reason) doc.text(`Motivo: ${record.reason}`);
        if (record.diagnosis) doc.text(`Diagnóstico: ${record.diagnosis}`);
        if (record.treatment) doc.text(`Tratamiento: ${record.treatment}`);
        if (record.prescription) doc.text(`Receta: ${record.prescription}`);
        if (record.weight) doc.text(`Peso registrado: ${record.weight} kg`);
        if (record.temperature) doc.text(`Temperatura: ${record.temperature}°C`);
        if (record.notes) doc.text(`Notas: ${record.notes}`);
        
        doc.moveDown();
        
        if (doc.y > 700) doc.addPage();
      });
    }

    // Services section
    doc.addPage();
    doc.fontSize(16).font('Helvetica-Bold').text('🛁 Historial de Servicios');
    doc.moveDown(0.5);

    if (services.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No hay servicios registrados.');
    } else {
      services.forEach(service => {
        doc.fontSize(11).font('Helvetica');
        const date = format(new Date(service.service_date), 'd/MM/yyyy');
        const price = service.is_free ? 'GRATIS' : `$${service.price}`;
        doc.text(`• ${date} - ${service.service_name} - ${price} (${service.veterinary_name})`);
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica')
      .text('Este documento fue generado por My Pet y contiene el historial médico consolidado de todas las veterinarias registradas.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Generate medical report error:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

// Staff: Generate client report
router.get('/client-report/:clientId', authenticateStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;
    const veterinaryId = req.veterinary.id;

    const client = db.prepare(`
      SELECT u.*, vc.client_number, vc.notes as client_notes
      FROM users u
      JOIN veterinary_clients vc ON u.id = vc.user_id
      WHERE u.id = ? AND vc.veterinary_id = ?
    `).get(clientId, veterinaryId) as any;

    if (!client) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Get pets
    const pets = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(clientId) as any[];

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=cliente-${client.name}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Cliente', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Cliente: ${client.name}`);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Email: ${client.email}`);
    if (client.phone) doc.text(`Teléfono: ${client.phone}`);
    doc.text(`Número de cliente: ${client.client_number || 'N/A'}`);
    
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').text(`Mascotas (${pets.length})`);
    doc.fontSize(11).font('Helvetica');

    for (const pet of pets) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(pet.name);
      doc.font('Helvetica').text(`${pet.species} - ${pet.breed || 'Sin raza especificada'}`);
      
      // Get records for this pet at this veterinary
      const records = db.prepare(`
        SELECT COUNT(*) as count FROM medical_records 
        WHERE pet_id = ? AND veterinary_id = ?
      `).get(pet.id, veterinaryId) as any;
      
      const services = db.prepare(`
        SELECT COUNT(*) as count, SUM(price) as total FROM service_records 
        WHERE pet_id = ? AND veterinary_id = ?
      `).get(pet.id, veterinaryId) as any;

      doc.text(`Consultas: ${records.count} | Servicios: ${services.count} | Total gastado: $${services.total || 0}`);
    }

    // Loyalty info
    const loyalty = db.prepare(`
      SELECT * FROM loyalty_cards WHERE user_id = ? AND veterinary_id = ?
    `).get(clientId, veterinaryId) as any;

    if (loyalty) {
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold').text('Programa de Lealtad');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Puntos acumulados: ${loyalty.total_points}`);
      doc.text(`Nivel: ${loyalty.tier}`);
    }

    doc.end();
  } catch (error) {
    console.error('Generate client report error:', error);
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

export default router;
