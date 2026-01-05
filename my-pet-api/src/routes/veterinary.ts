import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../database/init';
import { authenticateStaff, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Get veterinary info
router.get('/me', authenticateStaff, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.veterinary });
});

// Update veterinary info
router.put('/me',
  authenticateStaff,
  requireRole('admin'),
  body('name').optional().trim(),
  body('email').optional().isEmail(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, phone, address, city } = req.body;
      const veterinaryId = req.veterinary.id;

      const updates: string[] = [];
      const values: any[] = [];

      if (name) { updates.push('name = ?'); values.push(name); }
      if (email) { updates.push('email = ?'); values.push(email); }
      if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
      if (address !== undefined) { updates.push('address = ?'); values.push(address); }
      if (city !== undefined) { updates.push('city = ?'); values.push(city); }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(veterinaryId);
        
        db.prepare(`UPDATE veterinaries SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      const veterinary = db.prepare('SELECT * FROM veterinaries WHERE id = ?').get(veterinaryId);
      res.json({ success: true, data: veterinary });
    } catch (error) {
      console.error('Update veterinary error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar veterinaria' });
    }
  }
);

// Get staff list
router.get('/staff', authenticateStaff, (req: AuthRequest, res: Response) => {
  const staff = db.prepare(`
    SELECT id, email, name, role, phone, avatar, license_number, is_active, created_at
    FROM veterinary_staff
    WHERE veterinary_id = ?
    ORDER BY created_at DESC
  `).all(req.veterinary.id);

  res.json({ success: true, data: staff });
});

// Add staff member
router.post('/staff',
  authenticateStaff,
  requireRole('admin'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'vet', 'receptionist', 'groomer']),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, name, role, phone, licenseNumber } = req.body;
      const veterinaryId = req.veterinary.id;

      // Check if email exists in this veterinary
      const existing = db.prepare(
        'SELECT id FROM veterinary_staff WHERE veterinary_id = ? AND email = ?'
      ).get(veterinaryId, email);

      if (existing) {
        return res.status(400).json({ success: false, message: 'El email ya existe en esta veterinaria' });
      }

      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      db.prepare(`
        INSERT INTO veterinary_staff (id, veterinary_id, email, password, name, role, phone, license_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, veterinaryId, email, hashedPassword, name, role, phone || null, licenseNumber || null);

      const staff = db.prepare(`
        SELECT id, email, name, role, phone, license_number, is_active, created_at
        FROM veterinary_staff WHERE id = ?
      `).get(id);

      res.status(201).json({ success: true, data: staff });
    } catch (error) {
      console.error('Add staff error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar personal' });
    }
  }
);

// Update staff member
router.put('/staff/:staffId',
  authenticateStaff,
  requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { staffId } = req.params;
      const { name, role, phone, licenseNumber, isActive } = req.body;
      const veterinaryId = req.veterinary.id;

      const staff = db.prepare(
        'SELECT id FROM veterinary_staff WHERE id = ? AND veterinary_id = ?'
      ).get(staffId, veterinaryId);

      if (!staff) {
        return res.status(404).json({ success: false, message: 'Personal no encontrado' });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (name) { updates.push('name = ?'); values.push(name); }
      if (role) { updates.push('role = ?'); values.push(role); }
      if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
      if (licenseNumber !== undefined) { updates.push('license_number = ?'); values.push(licenseNumber); }
      if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(staffId);
        
        db.prepare(`UPDATE veterinary_staff SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      const updatedStaff = db.prepare(`
        SELECT id, email, name, role, phone, license_number, is_active, created_at
        FROM veterinary_staff WHERE id = ?
      `).get(staffId);

      res.json({ success: true, data: updatedStaff });
    } catch (error) {
      console.error('Update staff error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar personal' });
    }
  }
);

// Get service types
router.get('/services', authenticateStaff, (req: AuthRequest, res: Response) => {
  const services = db.prepare(`
    SELECT * FROM service_types
    WHERE veterinary_id = ?
    ORDER BY name
  `).all(req.veterinary.id);

  res.json({ success: true, data: services });
});

// Add service type
router.post('/services',
  authenticateStaff,
  requireRole('admin'),
  body('name').notEmpty().trim(),
  body('price').isNumeric(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, description, price, loyaltyPoints, loyaltyThreshold } = req.body;
      const id = uuidv4();

      db.prepare(`
        INSERT INTO service_types (id, veterinary_id, name, description, price, loyalty_points, loyalty_threshold)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, 
        req.veterinary.id, 
        name, 
        description || null, 
        price, 
        loyaltyPoints || 0,
        loyaltyThreshold || null
      );

      const service = db.prepare('SELECT * FROM service_types WHERE id = ?').get(id);
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      console.error('Add service error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar servicio' });
    }
  }
);

// Dashboard stats
router.get('/dashboard', authenticateStaff, (req: AuthRequest, res: Response) => {
  const veterinaryId = req.veterinary.id;

  const totalClients = db.prepare(`
    SELECT COUNT(*) as count FROM veterinary_clients WHERE veterinary_id = ?
  `).get(veterinaryId) as any;

  const totalPets = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as count 
    FROM pets p
    JOIN veterinary_clients vc ON p.owner_id = vc.user_id
    WHERE vc.veterinary_id = ?
  `).get(veterinaryId) as any;

  const todayAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments 
    WHERE veterinary_id = ? AND DATE(scheduled_date) = DATE('now')
  `).get(veterinaryId) as any;

  const pendingVaccines = db.prepare(`
    SELECT COUNT(*) as count FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN veterinary_clients vc ON p.owner_id = vc.user_id
    WHERE vc.veterinary_id = ? AND v.next_dose_date <= DATE('now', '+7 days')
  `).get(veterinaryId) as any;

  const recentServices = db.prepare(`
    SELECT sr.*, p.name as pet_name, st.name as service_name
    FROM service_records sr
    JOIN pets p ON sr.pet_id = p.id
    JOIN service_types st ON sr.service_type_id = st.id
    WHERE sr.veterinary_id = ?
    ORDER BY sr.service_date DESC
    LIMIT 5
  `).all(veterinaryId);

  res.json({
    success: true,
    data: {
      totalClients: totalClients.count,
      totalPets: totalPets.count,
      todayAppointments: todayAppointments.count,
      pendingVaccines: pendingVaccines.count,
      recentServices
    }
  });
});

export default router;
