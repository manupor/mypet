import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init';
import { authenticateUser, authenticateStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ USER ROUTES ============

// Get user's loyalty cards (all veterinaries)
router.get('/my-cards', authenticateUser, (req: AuthRequest, res: Response) => {
  const userId = req.user.id;

  const cards = db.prepare(`
    SELECT 
      lc.*,
      v.name as veterinary_name, v.logo as veterinary_logo
    FROM loyalty_cards lc
    JOIN veterinaries v ON lc.veterinary_id = v.id
    WHERE lc.user_id = ?
  `).all(userId);

  // Get service counters for each card
  const result = cards.map((card: any) => {
    const counters = db.prepare(`
      SELECT lsc.*, st.name as service_name, st.loyalty_threshold
      FROM loyalty_service_counters lsc
      JOIN service_types st ON lsc.service_type_id = st.id
      WHERE lsc.loyalty_card_id = ?
    `).all(card.id);

    return { ...card, serviceCounters: counters };
  });

  res.json({ success: true, data: result });
});

// Get loyalty card details for a specific veterinary
router.get('/my-cards/:veterinaryId', authenticateUser, (req: AuthRequest, res: Response) => {
  const { veterinaryId } = req.params;
  const userId = req.user.id;

  const card = db.prepare(`
    SELECT 
      lc.*,
      v.name as veterinary_name, v.logo as veterinary_logo
    FROM loyalty_cards lc
    JOIN veterinaries v ON lc.veterinary_id = v.id
    WHERE lc.user_id = ? AND lc.veterinary_id = ?
  `).get(userId, veterinaryId);

  if (!card) {
    return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
  }

  // Get service counters
  const counters = db.prepare(`
    SELECT lsc.*, st.name as service_name, st.loyalty_threshold
    FROM loyalty_service_counters lsc
    JOIN service_types st ON lsc.service_type_id = st.id
    WHERE lsc.loyalty_card_id = ?
  `).all((card as any).id);

  // Get recent transactions
  const transactions = db.prepare(`
    SELECT * FROM loyalty_transactions
    WHERE loyalty_card_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all((card as any).id);

  res.json({ 
    success: true, 
    data: { ...card, serviceCounters: counters, transactions } 
  });
});

// ============ STAFF ROUTES ============

// Get client's loyalty card
router.get('/client/:clientId', authenticateStaff, (req: AuthRequest, res: Response) => {
  const { clientId } = req.params;
  const veterinaryId = req.veterinary.id;

  let card = db.prepare(`
    SELECT * FROM loyalty_cards
    WHERE user_id = ? AND veterinary_id = ?
  `).get(clientId, veterinaryId) as any;

  // Create card if doesn't exist
  if (!card) {
    const cardId = uuidv4();
    db.prepare(`
      INSERT INTO loyalty_cards (id, user_id, veterinary_id)
      VALUES (?, ?, ?)
    `).run(cardId, clientId, veterinaryId);
    
    card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(cardId);
  }

  // Get service counters
  const counters = db.prepare(`
    SELECT lsc.*, st.name as service_name, st.loyalty_threshold
    FROM loyalty_service_counters lsc
    JOIN service_types st ON lsc.service_type_id = st.id
    WHERE lsc.loyalty_card_id = ?
  `).all(card.id);

  // Get transactions
  const transactions = db.prepare(`
    SELECT * FROM loyalty_transactions
    WHERE loyalty_card_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(card.id);

  res.json({ 
    success: true, 
    data: { ...card, serviceCounters: counters, transactions } 
  });
});

// Add points manually
router.post('/add-points',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { clientId, points, description } = req.body;
      const veterinaryId = req.veterinary.id;

      if (!clientId || !points) {
        return res.status(400).json({ success: false, message: 'Cliente y puntos son requeridos' });
      }

      // Get or create card
      let card = db.prepare(
        'SELECT * FROM loyalty_cards WHERE user_id = ? AND veterinary_id = ?'
      ).get(clientId, veterinaryId) as any;

      if (!card) {
        const cardId = uuidv4();
        db.prepare(`
          INSERT INTO loyalty_cards (id, user_id, veterinary_id)
          VALUES (?, ?, ?)
        `).run(cardId, clientId, veterinaryId);
        card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(cardId);
      }

      // Add transaction
      db.prepare(`
        INSERT INTO loyalty_transactions (id, loyalty_card_id, type, points, description)
        VALUES (?, ?, 'earn', ?, ?)
      `).run(uuidv4(), card.id, points, description || 'Puntos agregados manualmente');

      // Update total
      db.prepare(`
        UPDATE loyalty_cards 
        SET total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(points, card.id);

      const updated = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(card.id);
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Add points error:', error);
      res.status(500).json({ success: false, message: 'Error al agregar puntos' });
    }
  }
);

// Redeem points
router.post('/redeem',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { clientId, points, description } = req.body;
      const veterinaryId = req.veterinary.id;

      const card = db.prepare(
        'SELECT * FROM loyalty_cards WHERE user_id = ? AND veterinary_id = ?'
      ).get(clientId, veterinaryId) as any;

      if (!card) {
        return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
      }

      if (card.total_points < points) {
        return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
      }

      // Add transaction
      db.prepare(`
        INSERT INTO loyalty_transactions (id, loyalty_card_id, type, points, description)
        VALUES (?, ?, 'redeem', ?, ?)
      `).run(uuidv4(), card.id, -points, description || 'Canje de puntos');

      // Update total
      db.prepare(`
        UPDATE loyalty_cards 
        SET total_points = total_points - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(points, card.id);

      const updated = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(card.id);
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Redeem points error:', error);
      res.status(500).json({ success: false, message: 'Error al canjear puntos' });
    }
  }
);

// Process service with loyalty (handles "5th bath free" logic)
router.post('/process-service',
  authenticateStaff,
  async (req: AuthRequest, res: Response) => {
    try {
      const { clientId, serviceTypeId, petId } = req.body;
      const veterinaryId = req.veterinary.id;

      // Get service type
      const serviceType = db.prepare(
        'SELECT * FROM service_types WHERE id = ? AND veterinary_id = ?'
      ).get(serviceTypeId, veterinaryId) as any;

      if (!serviceType) {
        return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
      }

      // Get or create loyalty card
      let card = db.prepare(
        'SELECT * FROM loyalty_cards WHERE user_id = ? AND veterinary_id = ?'
      ).get(clientId, veterinaryId) as any;

      if (!card) {
        const cardId = uuidv4();
        db.prepare(`
          INSERT INTO loyalty_cards (id, user_id, veterinary_id)
          VALUES (?, ?, ?)
        `).run(cardId, clientId, veterinaryId);
        card = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(cardId);
      }

      let isFree = false;
      let message = '';

      // Check if service has loyalty threshold (e.g., 5th bath free)
      if (serviceType.loyalty_threshold) {
        // Get or create counter
        let counter = db.prepare(
          'SELECT * FROM loyalty_service_counters WHERE loyalty_card_id = ? AND service_type_id = ?'
        ).get(card.id, serviceTypeId) as any;

        if (!counter) {
          db.prepare(`
            INSERT INTO loyalty_service_counters (id, loyalty_card_id, service_type_id, count)
            VALUES (?, ?, ?, 0)
          `).run(uuidv4(), card.id, serviceTypeId);
          counter = { count: 0 };
        }

        const newCount = counter.count + 1;

        // Check if this is the free service
        if (newCount > serviceType.loyalty_threshold) {
          isFree = true;
          // Reset counter
          db.prepare(`
            UPDATE loyalty_service_counters 
            SET count = 0, last_reset = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE loyalty_card_id = ? AND service_type_id = ?
          `).run(card.id, serviceTypeId);
          
          message = `¡${serviceType.name} GRATIS! El cliente completó ${serviceType.loyalty_threshold + 1} servicios.`;
        } else {
          // Increment counter
          db.prepare(`
            UPDATE loyalty_service_counters 
            SET count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE loyalty_card_id = ? AND service_type_id = ?
          `).run(newCount, card.id, serviceTypeId);
          
          const remaining = serviceType.loyalty_threshold - newCount + 1;
          message = `Servicio ${newCount}/${serviceType.loyalty_threshold + 1}. Faltan ${remaining} para el próximo gratis.`;
        }
      }

      // Add points (unless free service)
      if (!isFree && serviceType.loyalty_points > 0) {
        db.prepare(`
          INSERT INTO loyalty_transactions (id, loyalty_card_id, type, points, description, reference_id, reference_type)
          VALUES (?, ?, 'earn', ?, ?, ?, 'service')
        `).run(uuidv4(), card.id, serviceType.loyalty_points, `Puntos por ${serviceType.name}`, serviceTypeId);

        db.prepare(`
          UPDATE loyalty_cards 
          SET total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(serviceType.loyalty_points, card.id);
      }

      // Create service record
      db.prepare(`
        INSERT INTO service_records (id, pet_id, veterinary_id, service_type_id, staff_id, service_date, price, is_free)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(
        uuidv4(), 
        petId, 
        veterinaryId, 
        serviceTypeId, 
        req.staff.id,
        isFree ? 0 : serviceType.price,
        isFree ? 1 : 0
      );

      // Get updated card with counters
      const updatedCard = db.prepare('SELECT * FROM loyalty_cards WHERE id = ?').get(card.id);
      const counters = db.prepare(`
        SELECT lsc.*, st.name as service_name, st.loyalty_threshold
        FROM loyalty_service_counters lsc
        JOIN service_types st ON lsc.service_type_id = st.id
        WHERE lsc.loyalty_card_id = ?
      `).all(card.id);

      res.json({ 
        success: true, 
        data: { 
          card: updatedCard, 
          serviceCounters: counters,
          isFree,
          message,
          pointsEarned: isFree ? 0 : serviceType.loyalty_points
        } 
      });
    } catch (error) {
      console.error('Process service error:', error);
      res.status(500).json({ success: false, message: 'Error al procesar servicio' });
    }
  }
);

export default router;
