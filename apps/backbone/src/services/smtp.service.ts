import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  tls: boolean;
}

export async function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const isPort465 = config.port === 465;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: isPort465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });
}

export function buildOtpEmailHtml(code: string, expirationMinutes = 5): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #333; margin-bottom: 24px;">Codigo de verificacao</h2>
      <p style="color: #555; font-size: 16px;">Use o codigo abaixo para entrar na sua conta:</p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
      </div>
      <p style="color: #888; font-size: 14px;">
        Este codigo expira em <strong>${expirationMinutes} minutos</strong>.
      </p>
      <p style="color: #888; font-size: 14px;">
        Se voce nao solicitou este codigo, ignore este email.
      </p>
    </div>
  `;
}
