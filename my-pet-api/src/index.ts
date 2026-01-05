import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import passport from 'passport';

dotenv.config();

import { initializeDatabase } from './database/init';
import { configurePassport } from './config/passport';
import { errorHandler } from './middleware/errorHandler';
import { startVaccineReminders } from './services/reminderService';

// Routes
import authRoutes from './routes/auth';
import veterinaryRoutes from './routes/veterinary';
import clientRoutes from './routes/clients';
import petRoutes from './routes/pets';
import medicalRoutes from './routes/medical';
import vaccineRoutes from './routes/vaccines';
import loyaltyRoutes from './routes/loyalty';
import serviceRoutes from './routes/services';
import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3000;

// Health check - MUST be before any middleware
// This ensures instant 200 OK response for platform health verification
app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.DASHBOARD_URL || 'http://localhost:5174'
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Passport
configurePassport(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize
async function start() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    startVaccineReminders();
    console.log('✅ Vaccine reminder service started');
    
    app.listen(PORT, () => {
      console.log(`🚀 My Pet API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
