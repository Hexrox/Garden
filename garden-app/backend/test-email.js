require('dotenv').config();
const { sendEmailVerification } = require('./utils/emailService');

async function testEmail() {
  console.log('🧪 Testowanie wysyłki emaila...');
  console.log('Wysyłam do: hexan@tlen.pl');

  const result = await sendEmailVerification(
    'hexan@tlen.pl',
    'https://gardenapp.pl/verify-email/test-token-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    'TestUser'
  );

  if (result.success) {
    console.log('✅ Email wysłany pomyślnie!');
    console.log('Message ID:', result.messageId);
  } else {
    console.log('❌ Błąd wysyłki email');
    console.log('Error:', result.error);
  }

  process.exit(result.success ? 0 : 1);
}

testEmail();
