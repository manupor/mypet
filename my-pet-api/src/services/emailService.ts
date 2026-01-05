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
  // In development, just log the email
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('📧 Email (dev mode):', {
      to: options.to,
      subject: options.subject
    });
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'My Pet <noreply@mypet.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  });
}
