import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/pets'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// ============ USER ROUTES (Pet owners) ============

// Get user's pets
router.get('/my-pets', authenticateUser, (req: AuthRequest, res: Response) => {
  const pets = db.prepare(`
    SELECT p.*, pp.passport_number, pp.microchip_date
    FROM pets p
    LEFT JOIN pet_passports pp ON p.id = pp.pet_id
    WHERE p.owner_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);

  res.json({ success: true, data: pets });
});

// Get pet details (for owner)
router.get('/my-pets/:petId', authenticateUser, (req: AuthRequest, res: Response) => {
  const { petId } = req.params;

  const pet = db.prepare(`
    SELECT p.*, pp.*
    FROM pets p
    LEFT JOIN pet_passports pp ON p.id = pp.pet_id
    WHERE p.id = ? AND p.owner_id = ?
  `).get(petId, req.user.id);

  if (!pet) {
    return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
  }

  // Get veterinaries where this pet has records
  const veterinaries = db.prepare(`
    SELECT DISTINCT v.id, v.name, v.logo, v.phone, v.address
    FROM veterinaries v
    JOIN medical_records mr ON v.id = mr.veterinary_id
    WHERE mr.pet_id = ?
  `).all(petId);

  res.json({ success: true, data: { ...pet, veterinaries } });
});

// ============ STAFF ROUTES (Dashboard) ============

// Get all pets for veterinary
router.get('/', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { search, species, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const veterinaryId = req.veterinary.id;

  let query = `
    SELECT 
      p.*, 
      u.name as owner_name, u.phone as owner_phone, u.email as owner_email,
      pp.passport_number
    FROM pets p
    JOIN users u ON p.owner_id = u.id
    JOIN veterinary_clients vc ON u.id = vc.user_id
    LEFT JOIN pet_passports pp ON p.id = pp.pet_id
    WHERE vc.veterinary_id = ?
  `;
  const params: any[] = [veterinaryId];

  if (search) {
    query += ` AND (p.name LIKE ? OR u.name LIKE ? OR p.microchip_number LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (species) {
    query += ` AND p.species = ?`;
    params.push(species);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const pets = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM pets p
    JOIN veterinary_clients vc ON p.owner_id = vc.user_id
    WHERE vc.veterinary_id = ?
  `).get(veterinaryId) as any;

  res.json({
    success: true,
    data: pets,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: total.count,
      pages: Math.ceil(total.count / Number(limit))
    }
  });
});

// Get pet by ID (staff)
router.get('/:petId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { petId } = req.params;
  const veterinaryId = req.veterinary.id;

  const pet = db.prepare(`
    SELECT 
      p.*, 
      u.id as owner_id, u.name as owner_name, u.phone as owner_phone, u.email as owner_email,
      pp.*
    FROM pets p
    JOIN users u ON p.owner_id = u.id
    JOIN veterinary_clients vc ON u.id = vc.user_id
    LEFT JOIN pet_passports pp ON p.id = pp.pet_id
    WHERE p.id = ? AND vc.veterinary_id = ?
  `).get(petId, veterinaryId);

  if (!pet) {
    return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
  }

  // Get recent medical records
  const medicalRecords = db.prepare(`
    SELECT mr.*, s.name as vet_name
    FROM medical_records mr
    JOIN veterinary_staff s ON mr.staff_id = s.id
    WHERE mr.pet_id = ? AND mr.veterinary_id = ?
    ORDER BY mr.visit_date DESC
    LIMIT 10
  `).all(petId, veterinaryId);

  // Get vaccines
  const vaccines = db.prepare(`
    SELECT v.*, s.name as vet_name
    FROM vaccines v
    JOIN veterinary_staff s ON v.staff_id = s.id
    WHERE v.pet_id = ?
    ORDER BY v.application_date DESC
  `).all(petId);

  // Get service history
  const services = db.prepare(`
    SELECT sr.*, st.name as service_name
    FROM service_records sr
    JOIN service_types st ON sr.service_type_id = st.id
    WHERE sr.pet_id = ? AND sr.veterinary_id = ?
    ORDER BY sr.service_date DESC
    LIMIT 20
  `).all(petId, veterinaryId);

  res.json({
    success: true,
    data: { ...pet, medicalRecords, vaccines, services }
  });
});

// Create pet
router.post('/',
  authenticateStaff,
  body('ownerId').notEmpty(),
  body('name').notEmpty().trim(),
  body('species').isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { 
        ownerId, name, species, breed, gender, birthDate, 
        weight, color, microchipNumber, isNeutered, notes 
      } = req.body;

      // Verify owner is a client
      const isClient = db.prepare(
        'SELECT id FROM veterinary_clients WHERE veterinary_id = ? AND user_id = ?'
      ).get(req.veterinary.id, ownerId);

      if (!isClient) {
        return res.status(400).json({ success: false, message: 'El propietario no es cliente de esta veterinaria' });
      }

      const petId = uuidv4();

      db.prepare(`
        INSERT INTO pets (id, owner_id, name, species, breed, gender, birth_date, weight, color, microchip_number, is_neutered, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        petId, ownerId, name, species, 
        breed || null, gender || null, birthDate || null,
        weight || null, color || null, microchipNumber || null,
        isNeutered ? 1 : 0, notes || null
      );

      const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId);
      res.status(201).json({ success: true, data: pet });
    } catch (error) {
      console.error('Create pet error:', error);
      res.status(500).json({ success: false, message: 'Error al crear mascota' });
    }
  }
);

// Update pet
router.put('/:petId',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { petId } = req.params;
      const veterinaryId = req.veterinary.id;

      // Verify pet exists and belongs to a client
      const pet = db.prepare(`
        SELECT p.id FROM pets p
        JOIN veterinary_clients vc ON p.owner_id = vc.user_id
        WHERE p.id = ? AND vc.veterinary_id = ?
      `).get(petId, veterinaryId);

      if (!pet) {
        return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
      }

      const { 
        name, species, breed, gender, birthDate, 
        weight, color, microchipNumber, isNeutered, notes 
      } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (name) { updates.push('name = ?'); values.push(name); }
      if (species) { updates.push('species = ?'); values.push(species); }
      if (breed !== undefined) { updates.push('breed = ?'); values.push(breed); }
      if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
      if (birthDate !== undefined) { updates.push('birth_date = ?'); values.push(birthDate); }
      if (weight !== undefined) { updates.push('weight = ?'); values.push(weight); }
      if (color !== undefined) { updates.push('color = ?'); values.push(color); }
      if (microchipNumber !== undefined) { updates.push('microchip_number = ?'); values.push(microchipNumber); }
      if (isNeutered !== undefined) { updates.push('is_neutered = ?'); values.push(isNeutered ? 1 : 0); }
      if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(petId);
        db.prepare(`UPDATE pets SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }

      const updatedPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId);
      res.json({ success: true, data: updatedPet });
    } catch (error) {
      console.error('Update pet error:', error);
      res.status(500).json({ success: false, message: 'Error al actualizar mascota' });
    }
  }
);

// Upload pet photo
router.post('/:petId/photo',
  authenticateStaff,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { petId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No se proporcionó imagen' });
      }

      // Resize image
      const resizedPath = file.path.replace(/\.\w+$/, '_resized.webp');
      await sharp(file.path)
        .resize(500, 500, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(resizedPath);

      const photoUrl = `/uploads/pets/${path.basename(resizedPath)}`;
      
      db.prepare('UPDATE pets SET photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(photoUrl, petId);

      res.json({ success: true, data: { photo: photoUrl } });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ success: false, message: 'Error al subir foto' });
    }
  }
);

// ============ PASSPORT ROUTES ============

// Create/Update passport
router.post('/:petId/passport',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { petId } = req.params;
      const { 
        passportNumber, issueDate, issueCountry, expiryDate,
        microchipDate, microchipLocation, rabiesValidUntil, additionalInfo 
      } = req.body;

      // Check if passport exists
      const existing = db.prepare('SELECT id FROM pet_passports WHERE pet_id = ?').get(petId);

      if (existing) {
        // Update
        db.prepare(`
          UPDATE pet_passports SET
            passport_number = ?, issue_date = ?, issue_country = ?, expiry_date = ?,
            microchip_date = ?, microchip_location = ?, rabies_valid_until = ?,
            additional_info = ?, updated_at = CURRENT_TIMESTAMP
          WHERE pet_id = ?
        `).run(
          passportNumber || null, issueDate || null, issueCountry || null, expiryDate || null,
          microchipDate || null, microchipLocation || null, rabiesValidUntil || null,
          additionalInfo || null, petId
        );
      } else {
        // Create
        db.prepare(`
          INSERT INTO pet_passports (id, pet_id, passport_number, issue_date, issue_country, expiry_date, microchip_date, microchip_location, rabies_valid_until, additional_info)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), petId,
          passportNumber || null, issueDate || null, issueCountry || null, expiryDate || null,
          microchipDate || null, microchipLocation || null, rabiesValidUntil || null,
          additionalInfo || null
        );
      }

      const passport = db.prepare('SELECT * FROM pet_passports WHERE pet_id = ?').get(petId);
      res.json({ success: true, data: passport });
    } catch (error) {
      console.error('Passport error:', error);
      res.status(500).json({ success: false, message: 'Error al guardar pasaporte' });
    }
  }
);

// Upload passport document photo
router.post('/:petId/passport/document',
  authenticateStaff,
  upload.single('document'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { petId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No se proporcionó documento' });
      }

      const documentUrl = `/uploads/pets/${file.filename}`;
      
      db.prepare(`
        UPDATE pet_passports SET document_photo = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE pet_id = ?
      `).run(documentUrl, petId);

      res.json({ success: true, data: { document_photo: documentUrl } });
    } catch (error) {
      console.error('Upload passport document error:', error);
      res.status(500).json({ success: false, message: 'Error al subir documento' });
    }
  }
);

export default router;
