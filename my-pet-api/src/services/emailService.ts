import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Skip if SMTP not configured
  if (!process.env.SMTP_USER) {
    console.log('📧 Email (no SMTP):', {
      to: options.to,
      subject: options.subject
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'My Pet <noreply@mypet.guru>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    console.log('📧 Email sent to:', options.to);
  } catch (error) {
    console.error('📧 Email error:', error);
  }
}

// Email Templates
export async function sendWelcomeEmail(to: string, userName: string, veterinaryName: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 My Pet</h1>
        </div>
        <div class="content">
          <h2>¡Bienvenido/a ${userName}!</h2>
          <p>Has sido registrado como cliente en <strong>${veterinaryName}</strong>.</p>
          <p>Ahora puedes:</p>
          <ul>
            <li>Ver el historial médico de tus mascotas</li>
            <li>Recibir recordatorios de vacunas</li>
            <li>Acumular puntos de lealtad</li>
            <li>Acceder a tu cartilla digital</li>
          </ul>
          <p>Descarga la app My Pet para tener todo en tu celular:</p>
          <a href="https://mypet.guru" class="button">Ir a My Pet</a>
        </div>
        <div class="footer">
          <p>© 2026 My Pet - Tu compañero de cuidado</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `¡Bienvenido a ${veterinaryName}! 🐾`,
    html,
    text: `Bienvenido ${userName}! Has sido registrado como cliente en ${veterinaryName}.`
  });
}

export async function sendVaccineReminder(to: string, petName: string, vaccineName: string, dueDate: string, veterinaryName: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💉 Recordatorio de Vacuna</h1>
        </div>
        <div class="content">
          <h2>¡Hola!</h2>
          <div class="alert">
            <strong>${petName}</strong> tiene programada la vacuna <strong>${vaccineName}</strong> para el <strong>${dueDate}</strong>.
          </div>
          <p>Te recomendamos agendar una cita en <strong>${veterinaryName}</strong> para mantener a tu mascota protegida.</p>
        </div>
        <div class="footer">
          <p>© 2026 My Pet - Tu compañero de cuidado</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `Recordatorio: Vacuna de ${petName} 💉`,
    html,
    text: `Recordatorio: ${petName} tiene programada la vacuna ${vaccineName} para el ${dueDate}.`
  });
}
