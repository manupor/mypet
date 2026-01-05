import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ USER ROUTES ============

// Get all medical records for user's pets (consolidated from all veterinaries)
router.get('/my-records', authenticateUser, (req: AuthRequest, res: Response) => {
  const { petId } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT 
      mr.*,
      p.name as pet_name, p.species as pet_species, p.photo as pet_photo,
      v.name as veterinary_name, v.logo as veterinary_logo,
      s.name as vet_name
    FROM medical_records mr
    JOIN pets p ON mr.pet_id = p.id
    JOIN veterinaries v ON mr.veterinary_id = v.id
    JOIN veterinary_staff s ON mr.staff_id = s.id
    WHERE p.owner_id = ?
  `;
  const params: any[] = [userId];

  if (petId) {
    query += ` AND mr.pet_id = ?`;
    params.push(petId);
  }

  query += ` ORDER BY mr.visit_date DESC`;

  const records = db.prepare(query).all(...params);
  res.json({ success: true, data: records });
});

// ============ STAFF ROUTES ============

// Get medical records for a pet
router.get('/pet/:petId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { petId } = req.params;
  const { all } = req.query; // If 'all', show from all veterinaries
  const veterinaryId = req.veterinary.id;

  let query = `
    SELECT 
      mr.*,
      v.name as veterinary_name,
      s.name as vet_name, s.license_number as vet_license
    FROM medical_records mr
    JOIN veterinaries v ON mr.veterinary_id = v.id
    JOIN veterinary_staff s ON mr.staff_id = s.id
    WHERE mr.pet_id = ?
  `;
  const params: any[] = [petId];

  if (!all) {
    query += ` AND mr.veterinary_id = ?`;
    params.push(veterinaryId);
  }

  query += ` ORDER BY mr.visit_date DESC`;

  const records = db.prepare(query).all(...params);
  res.json({ success: true, data: records });
});

// Get single medical record
router.get('/:recordId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { recordId } = req.params;

  const record = db.prepare(`
    SELECT 
      mr.*,
      p.name as pet_name, p.species as pet_species,
      u.name as owner_name, u.phone as owner_phone,
      v.name as veterinary_name,
      s.name as vet_name, s.license_number as vet_license
    FROM medical_records mr
    JOIN pets p ON mr.pet_id = p.id
    JOIN users u ON p.owner_id = u.id
    JOIN veterinaries v ON mr.veterinary_id = v.id
    JOIN veterinary_staff s ON mr.staff_id = s.id
    WHERE mr.id = ?
  `).get(recordId);

  if (!record) {
    return res.status(404).json({ success: false, message: 'Registro no encontrado' });
  }

  res.json({ success: true, data: record });
});

// Create medical record
router.post('/',
  authenticateStaff,
  body('petId').notEmpty(),
  body('visitDate').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        petId, visitDate, reason, diagnosis, treatment,
        prescription, weight, temperature, heartRate,
        notes, followUpDate
      } = req.body;

      const id = uuidv4();

      db.prepare(`
        INSERT INTO medical_records (
          id, pet_id, veterinary_id, staff_id, visit_date,
          reason, diagnosis, treatment, prescription,
          weight, temperature, heart_rate, notes, follow_up_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, petId, req.veterinary.id, req.staff.id, visitDate,
        reason || null, diagnosis || null, treatment || null, prescription || null,
        weight || null, temperature || null, heartRate || null,
        notes || null, followUpDate || null
      );

      // Update pet weight if provided
      if (weight) {
        db.prepare('UPDATE pets SET weight = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(weight, petId);
      }

      const record = db.prepare(`
        SELECT mr.*, s.name as vet_name
        FROM medical_records mr
        JOIN veterinary_staff s ON mr.staff_id = s.id
        WHERE mr.id = ?
      `).get(id);

      res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('Create medical record error:', error);
      res.status(500).json({ success: false, message: 'Error al crear registro médico' });
    }
  }
);

// Update medical record
router.put('/:recordId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { recordId } = req.params;
      const veterinaryId = req.veterinary.id;

      // Verify record belongs to this veterinary
      const existing = db.prepare(
        'SELECT id FROM medical_records WHERE id = ? AND veterinary_id = ?'
      ).get(recordId, veterinaryId);

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      }

      const {
        reason, diagnosis, treatment, prescription,
        weight, temperature, heartRate, notes, followUpDate
      } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (reason !== undefined) { updates.push('reason = ?'); values.push(reason); }
      if (diagnosis !== undefined) { updates.push('diagnosis = ?'); values.push(diagnosis); }
      if (treatment !== undefined) { updates.push('treatment = ?'); values.push(treatment); }
      if (prescription !== undefined) { updates.push('prescription = ?'); values.push(prescription); }
      if (weight !== undefined) { updates.push('weight = ?'); values.push(weight); }
      if (temperature !== undefined) { updates.push('temperature = ?'); values.push(temperature); }
      if (heartRate !== undefined) { updates.push('heart_rate = ?'); values.push(heartRate); }
      if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
      if (followUpDate !== undefined) { updates.push('follow_up_date = ?'); values.push(followUpDate); }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(recordId);
        db.prepare(`UPDATE medical_records SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      const record = db.prepare(`
        SELECT mr.*, s.name as vet_name
        FROM medical_records mr
        JOIN veterinary_staff s ON mr.staff_id = s.id
        WHERE mr.id = ?
      `).get(recordId);

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Update medical record error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar registro médico' });
    }
  }
);

// Delete medical record
router.delete('/:recordId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { recordId } = req.params;
      const veterinaryId = req.veterinary.id;

      const result = db.prepare(
        'DELETE FROM medical_records WHERE id = ? AND veterinary_id = ?'
      ).run(recordId, veterinaryId);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: 'Registro no encontrado' });
      }

      res.json({ success: true, message: 'Registro eliminado' });
    } catch (error) {
      console.error('Delete medical record error:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar registro médico' });
    }
  }
);

export default router;
