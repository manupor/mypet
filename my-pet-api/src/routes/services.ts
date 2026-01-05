import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ USER ROUTES ============

// Get service history for user's pets
router.get('/my-services', authenticateUser, (req: AuthRequest, res: Response) => {
  const { petId } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT 
      sr.*,
      st.name as service_name,
      p.name as pet_name, p.photo as pet_photo,
      v.name as veterinary_name
    FROM service_records sr
    JOIN service_types st ON sr.service_type_id = st.id
    JOIN pets p ON sr.pet_id = p.id
    JOIN veterinaries v ON sr.veterinary_id = v.id
    WHERE p.owner_id = ?
  `;
  const params: any[] = [userId];

  if (petId) {
    query += ` AND sr.pet_id = ?`;
    params.push(petId);
  }

  query += ` ORDER BY sr.service_date DESC LIMIT 50`;

  const services = db.prepare(query).all(...params);
  res.json({ success: true, data: services });
});

// ============ STAFF ROUTES ============

// Get service records for veterinary
router.get('/', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { petId, serviceTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const veterinaryId = req.veterinary.id;

  let query = `
    SELECT 
      sr.*,
      st.name as service_name,
      p.name as pet_name, p.species as pet_species,
      u.name as owner_name
    FROM service_records sr
    JOIN service_types st ON sr.service_type_id = st.id
    JOIN pets p ON sr.pet_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE sr.veterinary_id = ?
  `;
  const params: any[] = [veterinaryId];

  if (petId) {
    query += ` AND sr.pet_id = ?`;
    params.push(petId);
  }

  if (serviceTypeId) {
    query += ` AND sr.service_type_id = ?`;
    params.push(serviceTypeId);
  }

  if (startDate) {
    query += ` AND DATE(sr.service_date) >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND DATE(sr.service_date) <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY sr.service_date DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const services = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM service_records WHERE veterinary_id = ?
  `).get(veterinaryId) as any;

  res.json({
    success: true,
    data: services,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total.count,
      pages: Math.ceil(total.count / Number(limit))
    }
  });
});

// Add service record manually (without loyalty processing)
router.post('/',
  authenticateStaff,
  body('petId').notEmpty(),
  body('serviceTypeId').notEmpty(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { petId, serviceTypeId, serviceDate, price, notes, isFree } = req.body;

      const serviceType = db.prepare(
        'SELECT * FROM service_types WHERE id = ? AND veterinary_id = ?'
      ).get(serviceTypeId, req.veterinary.id);

      if (!serviceType) {
        return res.status(404).json({ success: false, message: 'Tipo de servicio no encontrado' });
      }

      const id = uuidv4();

      db.prepare(`
        INSERT INTO service_records (id, pet_id, veterinary_id, service_type_id, staff_id, service_date, price, notes, is_free)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, petId, req.veterinary.id, serviceTypeId, req.staff.id,
        serviceDate || new Date().toISOString(),
        price ?? (serviceType as any).price,
        notes || null,
        isFree ? 1 : 0
      );

      const service = db.prepare(`
        SELECT sr.*, st.name as service_name
        FROM service_records sr
        JOIN service_types st ON sr.service_type_id = st.id
        WHERE sr.id = ?
      `).get(id);

      res.status(201).json({ success: true, data: service });
    } catch (error) {
      console.error('Add service error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar servicio' });
    }
  }
);

// Get service statistics
router.get('/stats', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;
  const veterinaryId = req.veterinary.id;

  let dateFilter = '';
  const params: any[] = [veterinaryId];

  if (startDate && endDate) {
    dateFilter = ` AND DATE(sr.service_date) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  // Services by type
  const byType = db.prepare(`
    SELECT 
      st.name,
      COUNT(*) as count,
      SUM(sr.price) as total_revenue,
      SUM(CASE WHEN sr.is_free = 1 THEN 1 ELSE 0 END) as free_count
    FROM service_records sr
    JOIN service_types st ON sr.service_type_id = st.id
    WHERE sr.veterinary_id = ?${dateFilter}
    GROUP BY st.id
    ORDER BY count DESC
  `).all(...params);

  // Daily services
  const daily = db.prepare(`
    SELECT 
      DATE(sr.service_date) as date,
      COUNT(*) as count,
      SUM(sr.price) as revenue
    FROM service_records sr
    WHERE sr.veterinary_id = ?${dateFilter}
    GROUP BY DATE(sr.service_date)
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);

  // Total stats
  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_services,
      SUM(sr.price) as total_revenue,
      SUM(CASE WHEN sr.is_free = 1 THEN 1 ELSE 0 END) as free_services
    FROM service_records sr
    WHERE sr.veterinary_id = ?${dateFilter}
  `).get(...params);

  res.json({
    success: true,
    data: { byType, daily, totals }
  });
});

export default router;
