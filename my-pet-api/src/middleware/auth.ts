import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/init';

export interface AuthRequest extends Request {
  user?: any;
  staff?: any;
  veterinary?: any;
}

export function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    if (decoded.type !== 'user') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

export function authenticateStaff(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    if (decoded.type !== 'staff') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const staff = db.prepare(`
      SELECT s.*, v.name as veterinary_name, v.slug as veterinary_slug 
      FROM veterinary_staff s 
      JOIN veterinaries v ON s.veterinary_id = v.id 
      WHERE s.id = ? AND s.is_active = 1
    `).get(decoded.id) as any;
    
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Staff no encontrado' });
    }

    const veterinary = db.prepare('SELECT * FROM veterinaries WHERE id = ?').get(staff.veterinary_id);

    req.staff = staff;
    req.veterinary = veterinary;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.staff) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' });
    }

    next();
  };
}
