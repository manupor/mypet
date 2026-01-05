import { Router, Request, Response } from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import db from '../database/init';
import { generateUserToken, generateStaffToken } from '../utils/jwt';
import { authenticateUser, AuthRequest } from '../middleware/auth';

const router = Router();

// Register user (client/pet owner)
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, name, phone } = req.body;

      // Check if user exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();

      db.prepare(`
        INSERT INTO users (id, email, password, name, phone, auth_provider)
        VALUES (?, ?, ?, ?, ?, 'local')
      `).run(id, email, hashedPassword, name, phone || null);

      const user = db.prepare('SELECT id, email, name, phone, avatar FROM users WHERE id = ?').get(id);
      const token = generateUserToken(id);

      res.status(201).json({
        success: true,
        data: { user, token }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
  }
);

// Login user
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      if (!user.password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Esta cuenta usa login social. Usa Google o Facebook para ingresar.' 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      const token = generateUserToken(user.id);
      const { password: _, ...userData } = user;

      res.json({
        success: true,
        data: { user: userData, token }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
    }
  }
);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req: any, res: Response) => {
    const user = req.user;
    const token = generateUserToken(user.id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

// Facebook OAuth
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req: any, res: Response) => {
    const user = req.user;
    const token = generateUserToken(user.id);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', authenticateUser, (req: AuthRequest, res: Response) => {
  const { password, ...userData } = req.user;
  res.json({ success: true, data: userData });
});

// ============ STAFF/VETERINARY AUTH ============

// Staff login
router.post('/staff/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      const staff = db.prepare(`
        SELECT s.*, v.name as veterinary_name, v.logo as veterinary_logo
        FROM veterinary_staff s
        JOIN veterinaries v ON s.veterinary_id = v.id
        WHERE s.email = ? AND s.is_active = 1 AND v.is_active = 1
      `).get(email) as any;

      if (!staff) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      const isMatch = await bcrypt.compare(password, staff.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      const token = generateStaffToken(staff.id, staff.veterinary_id);
      const { password: _, ...staffData } = staff;

      res.json({
        success: true,
        data: { staff: staffData, token }
      });
    } catch (error) {
      console.error('Staff login error:', error);
      res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
    }
  }
);

// Register new veterinary (creates veterinary + admin user)
router.post('/veterinary/register',
  body('veterinaryName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('adminName').notEmpty().trim(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { veterinaryName, email, password, adminName, phone, address, city } = req.body;

      // Check if veterinary or staff email exists
      const existingStaff = db.prepare('SELECT id FROM veterinary_staff WHERE email = ?').get(email);
      if (existingStaff) {
        return res.status(400).json({ success: false, message: 'El email ya está registrado' });
      }

      // Create slug from name
      const baseSlug = veterinaryName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      while (db.prepare('SELECT id FROM veterinaries WHERE slug = ?').get(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const veterinaryId = uuidv4();
      const staffId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create veterinary
      db.prepare(`
        INSERT INTO veterinaries (id, name, slug, email, phone, address, city)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(veterinaryId, veterinaryName, slug, email, phone || null, address || null, city || null);

      // Create admin staff
      db.prepare(`
        INSERT INTO veterinary_staff (id, veterinary_id, email, password, name, role)
        VALUES (?, ?, ?, ?, ?, 'admin')
      `).run(staffId, veterinaryId, email, hashedPassword, adminName);

      // Create default service types
      const defaultServices = [
        { name: 'Consulta General', price: 500, points: 10 },
        { name: 'Baño', price: 300, points: 5, threshold: 4 },
        { name: 'Baño y Corte', price: 450, points: 8, threshold: 4 },
        { name: 'Vacunación', price: 400, points: 10 },
        { name: 'Desparasitación', price: 200, points: 5 },
        { name: 'Estética', price: 350, points: 5 }
      ];

      for (const service of defaultServices) {
        db.prepare(`
          INSERT INTO service_types (id, veterinary_id, name, price, loyalty_points, loyalty_threshold)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), veterinaryId, service.name, service.price, service.points, service.threshold || null);
      }

      const token = generateStaffToken(staffId, veterinaryId);

      res.status(201).json({
        success: true,
        data: {
          veterinary: { id: veterinaryId, name: veterinaryName, slug },
          staff: { id: staffId, name: adminName, email, role: 'admin' },
          token
        }
      });
    } catch (error) {
      console.error('Veterinary register error:', error);
      res.status(500).json({ success: false, message: 'Error al registrar veterinaria' });
    }
  }
);

export default router;
