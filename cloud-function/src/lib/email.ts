import nodemailer from 'nodemailer';
import { config } from './config';

export function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: parseInt(config.EMAIL_PORT),
    secure: config.EMAIL_SECURE,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: config.EMAIL_FROM,
    replyTo: config.EMAIL_REPLY_TO,
    to,
    subject,
    text,
    html,
  });
}
