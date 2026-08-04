/**
 * Email stub. No-op until EMAIL_ADDRESS / EMAIL_PASSWORD are configured.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) {
    console.warn('Email not configured; skipping send.', { to, subject });
    return { skipped: true };
  }
  // Wire nodemailer (or similar) when needed.
  console.log('Email stub would send:', { to, subject, text: Boolean(text), html: Boolean(html) });
  return { skipped: true };
};

module.exports = { sendEmail };
