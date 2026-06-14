import { logger } from "../middlewares/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  async send(options: SendEmailOptions): Promise<boolean> {
    // Aquí se podría integrar un cliente SMTP o un proveedor como Resend
    // Por ahora, simulamos el envío de correo imprimiendo el enlace y detalles en la consola de desarrollo
    console.log("\n" + "=".repeat(80));
    console.log(`✉️  [EMAIL SERVICE] - ENVIANDO CORREO ELECTRÓNICO`);
    console.log(`Para:     ${options.to}`);
    console.log(`Asunto:   ${options.subject}`);
    console.log(`Cuerpo (Texto plano):`);
    console.log(options.text);
    console.log("=".repeat(80) + "\n");

    logger.info({
      msg: "Correo electrónico enviado (simulado)",
      to: options.to,
      subject: options.subject,
    });

    return true;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const webUrl = process.env.WEB_URL || "http://localhost:5173";
    const resetUrl = `${webUrl}/reset-password?token=${token}`;

    const subject = "Restablece tu contraseña - BaseForge SaaS";
    const text = `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña. Puedes hacerlo ingresando al siguiente enlace:\n\n${resetUrl}\n\nEste enlace expirará en 1 hora.\nSi no solicitaste este cambio, puedes ignorar este correo.\n\nSaludos,\nEl equipo de BaseForge`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 24px;">Restablecer contraseña</h2>
        <p style="color: #334155; font-size: 16px; line-height: 24px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en BaseForge SaaS.</p>
        <p style="color: #334155; font-size: 16px; line-height: 24px; margin-bottom: 32px;">Haz clic en el siguiente botón para establecer una nueva contraseña:</p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 20px;">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
        <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin-bottom: 32px;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="color: #94a3b8; font-size: 12px;">Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `;

    return this.send({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
