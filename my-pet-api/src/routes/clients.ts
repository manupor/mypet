import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../database/init';
import { authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all clients for veterinary
router.get('/', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const veterinaryId = req.veterinary.id;

  let query = `
    SELECT 
      u.id, u.email, u.name, u.phone, u.avatar,
      vc.client_number, vc.notes as client_notes, vc.created_at as registered_at,
      (SELECT COUNT(*) FROM pets WHERE owner_id = u.id) as pet_count,
      (SELECT total_points FROM loyalty_cards WHERE user_id = u.id AND veterinary_id = ?) as loyalty_points
    FROM users u
    JOIN veterinary_clients vc ON u.id = vc.user_id
    WHERE vc.veterinary_id = ?
  `;
  const params: any[] = [veterinaryId, veterinaryId];

  if (search) {
    query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY vc.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const clients = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM veterinary_clients WHERE veterinary_id = ?
  `).get(veterinaryId) as any;

  res.json({
    success: true,
    data: clients,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total.count,
      pages: Math.ceil(total.count / Number(limit))
    }
  });
});

// Get client by ID
router.get('/:clientId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { clientId } = req.params;
  const veterinaryId = req.veterinary.id;

  const client = db.prepare(`
    SELECT 
      u.id, u.email, u.name, u.phone, u.avatar, u.created_at,
      vc.client_number, vc.notes as client_notes, vc.created_at as registered_at
    FROM users u
    JOIN veterinary_clients vc ON u.id = vc.user_id
    WHERE u.id = ? AND vc.veterinary_id = ?
  `).get(clientId, veterinaryId);

  if (!client) {
    return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
  }

  // Get pets
  const pets = db.prepare(`
    SELECT p.*, pp.passport_number
    FROM pets p
    LEFT JOIN pet_passports pp ON p.id = pp.pet_id
    WHERE p.owner_id = ?
    ORDER BY p.created_at DESC
  `).all(clientId);

  // Get loyalty info
  const loyalty = db.prepare(`
    SELECT * FROM loyalty_cards WHERE user_id = ? AND veterinary_id = ?
  `).get(clientId, veterinaryId);

  res.json({
    success: true,
    data: { ...client, pets, loyalty }
  });
});

// Add new client (or link existing user)
router.post('/',
  authenticateStaff,
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, name, phone, notes } = req.body;
      const veterinaryId = req.veterinary.id;

      // Check if user exists
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

      if (!user) {
        // Create new user
        const userId = uuidv4();
        const tempPassword = await bcrypt.hash(uuidv4(), 10);
        
        db.prepare(`
          INSERT INTO users (id, email, password, name, phone, auth_provider)
          VALUES (?, ?, ?, ?, ?, 'local')
        `).run(userId, email, tempPassword, name, phone || null);

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      }

      // Check if already a client of this veterinary
      const existingClient = db.prepare(
        'SELECT id FROM veterinary_clients WHERE veterinary_id = ? AND user_id = ?'
      ).get(veterinaryId, user.id);

      if (existingClient) {
        return res.status(400).json({ success: false, message: 'El cliente ya está registrado' });
      }

      // Create client relationship
      const clientNumber = `C${Date.now().toString().slice(-6)}`;
      db.prepare(`
        INSERT INTO veterinary_clients (id, veterinary_id, user_id, client_number, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), veterinaryId, user.id, clientNumber, notes || null);

      // Create loyalty card
      db.prepare(`
        INSERT INTO loyalty_cards (id, user_id, veterinary_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), user.id, veterinaryId);

      const client = db.prepare(`
        SELECT 
          u.id, u.email, u.name, u.phone, u.avatar,
          vc.client_number, vc.notes as client_notes, vc.created_at as registered_at
        FROM users u
        JOIN veterinary_clients vc ON u.id = vc.user_id
        WHERE u.id = ? AND vc.veterinary_id = ?
      `).get(user.id, veterinaryId);

      res.status(201).json({ success: true, data: client });
    } catch (error) {
      console.error('Add client error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar cliente' });
    }
  }
);

// Update client notes
router.put('/:clientId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { clientId } = req.params;
      const { notes, clientNumber } = req.body;
      const veterinaryId = req.veterinary.id;

      const existing = db.prepare(
        'SELECT id FROM veterinary_clients WHERE veterinary_id = ? AND user_id = ?'
      ).get(veterinaryId, clientId);

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
      if (clientNumber) { updates.push('client_number = ?'); values.push(clientNumber); }

      if (updates.length > 0) {
        values.push(veterinaryId, clientId);
        db.prepare(`
          UPDATE veterinary_clients SET ${updates.join(', ')} 
          WHERE veterinary_id = ? AND user_id = ?
        `).run(...values);
      }

      const client = db.prepare(`
        SELECT 
          u.id, u.email, u.name, u.phone, u.avatar,
          vc.client_number, vc.notes as client_notes, vc.created_at as registered_at
        FROM users u
        JOIN veterinary_clients vc ON u.id = vc.user_id
        WHERE u.id = ? AND vc.veterinary_id = ?
      `).get(clientId, veterinaryId);

      res.json({ success: true, data: client });
    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
    }
  }
);

export default router;
