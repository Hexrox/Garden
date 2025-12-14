require('dotenv').config();
const { sendEmailVerification } = require('./utils/emailService');

async function testEmail() {
  console.log('🧪 Testowanie wysyłki emaila...');
  console.log('Wysyłam do: hexan@tlen.pl');

  // Generate proper 64-char hex token (32 bytes)
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  console.log('Token length:', token.length); // Should be 64

  const result = await sendEmailVerification(
    'hexan@tlen.pl',
    `https://gardenapp.pl/verify-email/${token}`,
    'TestUser'
  );

  if (result.success) {
    console.log('✅ Email wysłany pomyślnie!');
    console.log('Message ID:', result.messageId);
    console.log('');
    console.log('⚠️  UWAGA: To jest TESTOWY email!');
    console.log('Token NIE został zapisany w bazie danych.');
    console.log('Link w emailu NIE zadziała - to tylko demo wyglądu.');
    console.log('');
    console.log('Wysłany token:', token);
  } else {
    console.log('❌ Błąd wysyłki email');
    console.log('Error:', result.error);
  }

  process.exit(result.success ? 0 : 1);
}

testEmail();
