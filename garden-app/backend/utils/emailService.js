const nodemailer = require('nodemailer');

// Konfiguracja Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
  }
});

// HTML escape to prevent XSS in email templates
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Email templates
const emailTemplates = {
  passwordReset: (resetLink) => ({
    subject: 'Garden App - Reset hasła',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 Garden App</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Reset hasła</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Otrzymaliśmy prośbę o reset hasła do Twojego konta Garden App.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">
              <strong>⚠️ Uwaga:</strong> Link jest ważny przez 1 godzinę.
            </p>
          </div>

          <a href="${resetLink}"
             style="display: inline-block; background: #16a34a; color: white;
                    padding: 12px 30px; text-decoration: none; border-radius: 6px;
                    margin: 20px 0;">
            Zresetuj hasło
          </a>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.
          </p>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Link: ${resetLink}
          </p>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2026 Garden App. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    `
  }),

  emailVerification: (verificationLink, username) => ({
    subject: 'Garden App - Potwierdź swój email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 Garden App</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Witaj ${escapeHtml(username)}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Dziękujemy za rejestrację w Garden App! Potwierdź swój adres email, aby aktywować konto.
          </p>

          <a href="${verificationLink}"
             style="display: inline-block; background: #16a34a; color: white;
                    padding: 12px 30px; text-decoration: none; border-radius: 6px;
                    margin: 20px 0;">
            Potwierdź email
          </a>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0;">
              <strong>💡 Wskazówka:</strong> Link jest ważny przez 24 godziny.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Po potwierdzeniu będziesz mógł w pełni korzystać z Garden App!
          </p>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2026 Garden App
          </p>
        </div>
      </div>
    `
  }),

  accountDeleted: (restoreLink, username, deleteDate) => ({
    subject: 'Garden App - Twoje konto zostało usunięte',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #991b1b; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 Garden App</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Konto usunięte</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Cześć ${escapeHtml(username)}, Twoje konto Garden App zostało oznaczone do usunięcia.
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0;">
              <strong>⚠️ Ważne:</strong> Twoje dane zostaną permanentnie usunięte ${escapeHtml(deleteDate)}.
            </p>
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            Masz <strong>30 dni</strong> na przywrócenie konta. Po tym czasie wszystkie dane zostaną bezpowrotnie usunięte.
          </p>

          <a href="${restoreLink}"
             style="display: inline-block; background: #16a34a; color: white;
                    padding: 12px 30px; text-decoration: none; border-radius: 6px;
                    margin: 20px 0;">
            Przywróć konto
          </a>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Jeśli naprawdę chcesz usunąć konto, nie musisz nic robić.
          </p>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2026 Garden App
          </p>
        </div>
      </div>
    `
  }),

  newRegistration: (username, email) => ({
    subject: `Garden App - Nowa rejestracja: ${escapeHtml(username)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 Garden App</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Nowa rejestracja</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Nowy użytkownik zarejestrował się w Garden App:
          </p>

          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0;">
              <strong>Nazwa:</strong> ${escapeHtml(username)}<br>
              <strong>Email:</strong> ${escapeHtml(email)}<br>
              <strong>Data:</strong> ${new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })}
            </p>
          </div>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2026 Garden App
          </p>
        </div>
      </div>
    `
  }),

  accountRestored: (username) => ({
    subject: 'Garden App - Konto przywrócone!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 Garden App</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Witamy z powrotem! 🎉</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Cześć ${escapeHtml(username)}, Twoje konto zostało pomyślnie przywrócone!
          </p>

          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;">
              <strong>✅ Sukces:</strong> Wszystkie Twoje dane są bezpieczne i gotowe do użycia.
            </p>
          </div>

          <p style="color: #4b5563; line-height: 1.6;">
            Możesz teraz zalogować się i kontynuować zarządzanie swoim ogrodem!
          </p>

          <a href="${process.env.FRONTEND_URL}/login"
             style="display: inline-block; background: #16a34a; color: white;
                    padding: 12px 30px; text-decoration: none; border-radius: 6px;
                    margin: 20px 0;">
            Zaloguj się
          </a>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            © 2026 Garden App
          </p>
        </div>
      </div>
    `
  })
};

// Funkcja wysyłania emaila
async function sendEmail(to, template) {
  try {
    const mailOptions = {
      from: `"Garden App" <${process.env.EMAIL_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail: (email, resetLink) =>
    sendEmail(email, emailTemplates.passwordReset(resetLink)),

  sendEmailVerification: (email, verificationLink, username) =>
    sendEmail(email, emailTemplates.emailVerification(verificationLink, username)),

  sendAccountDeletedEmail: (email, restoreLink, username, deleteDate) =>
    sendEmail(email, emailTemplates.accountDeleted(restoreLink, username, deleteDate)),

  sendAccountRestoredEmail: (email, username) =>
    sendEmail(email, emailTemplates.accountRestored(username)),

  sendNewRegistrationNotification: (username, email) =>
    sendEmail('hexan@tlen.pl', emailTemplates.newRegistration(username, email))
};
