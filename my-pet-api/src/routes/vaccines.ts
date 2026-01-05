import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ USER ROUTES ============

// Get all vaccines for user's pets
router.get('/my-vaccines', authenticateUser, (req: AuthRequest, res: Response) => {
  const { petId, upcoming } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT 
      v.*,
      p.name as pet_name, p.species as pet_species, p.photo as pet_photo,
      vet.name as veterinary_name,
      s.name as vet_name
    FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN veterinaries vet ON v.veterinary_id = vet.id
    JOIN veterinary_staff s ON v.staff_id = s.id
    WHERE p.owner_id = ?
  `;
  const params: any[] = [userId];

  if (petId) {
    query += ` AND v.pet_id = ?`;
    params.push(petId);
  }

  if (upcoming === 'true') {
    query += ` AND v.next_dose_date IS NOT NULL AND v.next_dose_date >= DATE('now')`;
    query += ` ORDER BY v.next_dose_date ASC`;
  } else {
    query += ` ORDER BY v.application_date DESC`;
  }

  const vaccines = db.prepare(query).all(...params);
  res.json({ success: true, data: vaccines });
});

// Get vaccine calendar/reminders
router.get('/my-reminders', authenticateUser, (req: AuthRequest, res: Response) => {
  const userId = req.user.id;

  const upcoming = db.prepare(`
    SELECT 
      v.id, v.vaccine_name, v.next_dose_date,
      p.id as pet_id, p.name as pet_name, p.species as pet_species, p.photo as pet_photo,
      vet.name as veterinary_name, vet.phone as veterinary_phone
    FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN veterinaries vet ON v.veterinary_id = vet.id
    WHERE p.owner_id = ? 
    AND v.next_dose_date IS NOT NULL 
    AND v.next_dose_date >= DATE('now')
    ORDER BY v.next_dose_date ASC
    LIMIT 20
  `).all(userId);

  res.json({ success: true, data: upcoming });
});

// ============ STAFF ROUTES ============

// Get vaccines for a pet
router.get('/pet/:petId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { petId } = req.params;

  const vaccines = db.prepare(`
    SELECT 
      v.*,
      vet.name as veterinary_name,
      s.name as vet_name, s.license_number as vet_license
    FROM vaccines v
    JOIN veterinaries vet ON v.veterinary_id = vet.id
    JOIN veterinary_staff s ON v.staff_id = s.id
    WHERE v.pet_id = ?
    ORDER BY v.application_date DESC
  `).all(petId);

  res.json({ success: true, data: vaccines });
});

// Get pending vaccines (next 30 days)
router.get('/pending', authenticateStaff, (req: AuthRequest, res: Response) => {
  const veterinaryId = req.veterinary.id;

  const pending = db.prepare(`
    SELECT 
      v.*,
      p.name as pet_name, p.species as pet_species, p.photo as pet_photo,
      u.name as owner_name, u.phone as owner_phone, u.email as owner_email
    FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN users u ON p.owner_id = u.id
    JOIN veterinary_clients vc ON u.id = vc.user_id
    WHERE vc.veterinary_id = ?
    AND v.next_dose_date IS NOT NULL
    AND v.next_dose_date <= DATE('now', '+30 days')
    ORDER BY v.next_dose_date ASC
  `).all(veterinaryId);

  res.json({ success: true, data: pending });
});

// Add vaccine
router.post('/',
  authenticateStaff,
  body('petId').notEmpty(),
  body('vaccineName').notEmpty().trim(),
  body('applicationDate').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        petId, vaccineName, vaccineType, batchNumber, manufacturer,
        applicationDate, expiryDate, nextDoseDate, notes, isInternational
      } = req.body;

      const id = uuidv4();

      db.prepare(`
        INSERT INTO vaccines (
          id, pet_id, veterinary_id, staff_id, vaccine_name, vaccine_type,
          batch_number, manufacturer, application_date, expiry_date,
          next_dose_date, notes, is_international
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, petId, req.veterinary.id, req.staff.id,
        vaccineName, vaccineType || null, batchNumber || null, manufacturer || null,
        applicationDate, expiryDate || null, nextDoseDate || null,
        notes || null, isInternational ? 1 : 0
      );

      const vaccine = db.prepare(`
        SELECT v.*, s.name as vet_name
        FROM vaccines v
        JOIN veterinary_staff s ON v.staff_id = s.id
        WHERE v.id = ?
      `).get(id);

      res.status(201).json({ success: true, data: vaccine });
    } catch (error) {
      console.error('Add vaccine error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar vacuna' });
    }
  }
);

// Update vaccine
router.put('/:vaccineId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { vaccineId } = req.params;
      const veterinaryId = req.veterinary.id;

      const existing = db.prepare(
        'SELECT id FROM vaccines WHERE id = ? AND veterinary_id = ?'
      ).get(vaccineId, veterinaryId);

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vacuna no encontrada' });
      }

      const {
        vaccineName, vaccineType, batchNumber, manufacturer,
        expiryDate, nextDoseDate, notes, isInternational
      } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (vaccineName) { updates.push('vaccine_name = ?'); values.push(vaccineName); }
      if (vaccineType !== undefined) { updates.push('vaccine_type = ?'); values.push(vaccineType); }
      if (batchNumber !== undefined) { updates.push('batch_number = ?'); values.push(batchNumber); }
      if (manufacturer !== undefined) { updates.push('manufacturer = ?'); values.push(manufacturer); }
      if (expiryDate !== undefined) { updates.push('expiry_date = ?'); values.push(expiryDate); }
      if (nextDoseDate !== undefined) { updates.push('next_dose_date = ?'); values.push(nextDoseDate); }
      if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
      if (isInternational !== undefined) { updates.push('is_international = ?'); values.push(isInternational ? 1 : 0); }

      if (updates.length > 0) {
        values.push(vaccineId);
        db.prepare(`UPDATE vaccines SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      const vaccine = db.prepare(`
        SELECT v.*, s.name as vet_name
        FROM vaccines v
        JOIN veterinary_staff s ON v.staff_id = s.id
        WHERE v.id = ?
      `).get(vaccineId);

      res.json({ success: true, data: vaccine });
    } catch (error) {
      console.error('Update vaccine error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar vacuna' });
    }
  }
);

// Delete vaccine
router.delete('/:vaccineId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { vaccineId } = req.params;
      const veterinaryId = req.veterinary.id;

      const result = db.prepare(
        'DELETE FROM vaccines WHERE id = ? AND veterinary_id = ?'
      ).run(vaccineId, veterinaryId);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: 'Vacuna no encontrada' });
      }

      res.json({ success: true, message: 'Vacuna eliminada' });
    } catch (error) {
      console.error('Delete vaccine error:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar vacuna' });
    }
  }
);

export default router;
