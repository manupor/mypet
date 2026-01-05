import cron from 'node-cron';
import db from '../database/init';
import { sendEmail } from './emailService';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function startVaccineReminders() {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running vaccine reminder check...');
    await checkVaccineReminders();
  });
}

async function checkVaccineReminders() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const inThreeDays = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const inSevenDays = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Get vaccines with upcoming next_dose_date
  const upcomingVaccines = db.prepare(`
    SELECT 
      v.*,
      p.name as pet_name,
      p.species as pet_species,
      u.email as owner_email,
      u.name as owner_name,
      vet.name as veterinary_name
    FROM vaccines v
    JOIN pets p ON v.pet_id = p.id
    JOIN users u ON p.owner_id = u.id
    JOIN veterinaries vet ON v.veterinary_id = vet.id
    WHERE v.next_dose_date IN (?, ?, ?)
    AND v.id NOT IN (
      SELECT vaccine_id FROM vaccine_reminders 
      WHERE reminder_date = v.next_dose_date AND is_sent = 1
    )
  `).all(today, inThreeDays, inSevenDays) as any[];

  for (const vaccine of upcomingVaccines) {
    const daysUntil = Math.ceil(
      (new Date(vaccine.next_dose_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    let subject = '';
    let urgency = '';

    if (daysUntil <= 0) {
      subject = `⚠️ ¡${vaccine.pet_name} necesita su vacuna HOY!`;
      urgency = 'hoy';
    } else if (daysUntil <= 3) {
      subject = `📅 Recordatorio: Vacuna de ${vaccine.pet_name} en ${daysUntil} días`;
      urgency = `en ${daysUntil} días`;
    } else {
      subject = `📋 Próxima vacuna de ${vaccine.pet_name}`;
      urgency = `en ${daysUntil} días`;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">🐾 My Pet - Recordatorio de Vacuna</h2>
        
        <p>Hola ${vaccine.owner_name},</p>
        
        <p>Te recordamos que <strong>${vaccine.pet_name}</strong> tiene programada su vacuna <strong>${urgency}</strong>.</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Detalles de la vacuna:</h3>
          <p style="margin: 5px 0;"><strong>Vacuna:</strong> ${vaccine.vaccine_name}</p>
          <p style="margin: 5px 0;"><strong>Fecha programada:</strong> ${format(new Date(vaccine.next_dose_date), "d 'de' MMMM, yyyy", { locale: es })}</p>
          <p style="margin: 5px 0;"><strong>Veterinaria:</strong> ${vaccine.veterinary_name}</p>
        </div>
        
        <p>Te recomendamos agendar una cita lo antes posible para mantener al día el calendario de vacunación de tu mascota.</p>
        
        <p style="color: #6B7280; font-size: 14px;">
          — El equipo de My Pet
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: vaccine.owner_email,
        subject,
        html
      });

      // Record the reminder
      const { v4: uuidv4 } = await import('uuid');
      db.prepare(`
        INSERT INTO vaccine_reminders (id, vaccine_id, pet_id, user_id, reminder_date, is_sent, sent_at)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(
        uuidv4(),
        vaccine.id,
        vaccine.pet_id,
        vaccine.owner_id,
        vaccine.next_dose_date
      );

      console.log(`Reminder sent to ${vaccine.owner_email} for ${vaccine.pet_name}`);
    } catch (error) {
      console.error(`Failed to send reminder to ${vaccine.owner_email}:`, error);
    }
  }
}
