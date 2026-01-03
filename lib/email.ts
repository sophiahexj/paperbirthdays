/**
 * Email utility functions for Paper Birthdays
 *
 * Supports: SendGrid, Mailgun, AWS SES
 * Configure by setting EMAIL_SERVICE environment variable
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://happybdaypaper.com';

interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send verification email for new subscription
 */
export async function sendVerificationEmail(
  email: string,
  paperTitle: string,
  verificationToken: string,
  monthDay: string
): Promise<boolean> {
  const verificationUrl = `${SITE_URL}/api/verify-email/${verificationToken}`;

  // Format the date nicely (e.g., "01-15" -> "January 15")
  const [month, day] = monthDay.split('-');
  const date = new Date(2000, parseInt(month) - 1, parseInt(day));
  const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const subject = `Confirm your Paper Birthday subscription`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .paper-title { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎂 Paper Birthdays</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Confirm Your Subscription</p>
        </div>
        <div class="content">
          <p>Hi there!</p>

          <p>You've requested to receive annual birthday reminders for this paper:</p>

          <div class="paper-title">
            <strong>"${paperTitle}"</strong>
          </div>

          <p>Every year on <strong>${formattedDate}</strong>, we'll send you an email celebrating this paper's publication anniversary!</p>

          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Confirm Subscription</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Didn't request this? You can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>Happy Birthday Paper | <a href="${SITE_URL}">happybdaypaper.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Paper Birthdays - Confirm Your Subscription

You've requested to receive annual birthday reminders for:
"${paperTitle}"

Every year on ${formattedDate}, we'll send you an email celebrating this paper's publication anniversary!

Confirm your subscription by clicking this link:
${verificationUrl}

Didn't request this? You can safely ignore this email.

Happy Birthday Paper | ${SITE_URL}
  `.trim();

  return sendEmail(email, subject, html, text);
}

/**
 * Send birthday notification email
 */
export async function sendBirthdayEmail(
  email: string,
  paperTitle: string,
  paperYear: number,
  citationCount: number,
  paperUrl: string,
  field: string,
  monthDay: string,
  unsubscribeToken: string
): Promise<boolean> {
  const currentYear = new Date().getFullYear();
  const age = currentYear - paperYear;

  // Format the date nicely
  const [month, day] = monthDay.split('-');
  const date = new Date(2000, parseInt(month) - 1, parseInt(day));
  const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const unsubscribeUrl = `${SITE_URL}/api/unsubscribe/${unsubscribeToken}`;
  const dateUrl = `${SITE_URL}/${month.toLowerCase()}-${parseInt(day)}`;

  const subject = `🎂 Happy ${age}th Birthday to "${paperTitle}"!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .birthday-icon { font-size: 48px; margin-bottom: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .paper-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat { display: inline-block; margin: 10px 15px 10px 0; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 10px 10px 0; }
        .button-secondary { background: #6b7280; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="birthday-icon">🎂</div>
          <h1 style="margin: 0; font-size: 28px;">Paper Birthday!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Celebrating ${age} Years</p>
        </div>
        <div class="content">
          <p>Today marks <strong>${age} years</strong> since this paper was published!</p>

          <div class="paper-card">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111;">"${paperTitle}"</h2>

            <div>
              <span class="stat">📅 Published ${formattedDate}, ${paperYear}</span>
              <span class="stat">📊 ${citationCount.toLocaleString()} citations</span>
              <span class="stat">🏷️ ${field}</span>
            </div>
          </div>

          <p style="text-align: center;">
            <a href="${paperUrl}" class="button">Read the Paper</a>
            <a href="${dateUrl}" class="button button-secondary">More ${formattedDate} Papers</a>
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            You're receiving this email because you subscribed to birthday reminders for this paper on happybdaypaper.com
          </p>
        </div>
        <div class="footer">
          <p>
            <a href="${unsubscribeUrl}">Unsubscribe</a> from this paper
          </p>
          <p>Happy Birthday Paper | <a href="${SITE_URL}">happybdaypaper.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎂 Paper Birthday! Celebrating ${age} Years

Today marks ${age} years since this paper was published:

"${paperTitle}"

📅 Published ${formattedDate}, ${paperYear}
📊 ${citationCount.toLocaleString()} citations
🏷️ ${field}

Read the paper: ${paperUrl}
More ${formattedDate} papers: ${dateUrl}

---
Unsubscribe: ${unsubscribeUrl}
Happy Birthday Paper | ${SITE_URL}
  `.trim();

  return sendEmail(email, subject, html, text);
}

/**
 * Core email sending function
 * Routes to appropriate email service based on EMAIL_SERVICE env var
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const emailService = process.env.EMAIL_SERVICE || 'resend';

  try {
    switch (emailService.toLowerCase()) {
      case 'resend':
        return await sendEmailResend(to, subject, html, text);
      case 'sendgrid':
        return await sendEmailSendGrid(to, subject, html, text);
      case 'mailgun':
        return await sendEmailMailgun(to, subject, html, text);
      case 'ses':
      case 'aws':
        return await sendEmailSES(to, subject, html, text);
      default:
        console.error(`Unknown email service: ${emailService}`);
        return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send email via Resend
 */
async function sendEmailResend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@happybdaypaper.com';
  const fromName = process.env.FROM_NAME || 'Paper Birthdays';

  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Resend error:', error);
    return false;
  }
}

/**
 * Send email via SendGrid
 */
async function sendEmailSendGrid(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@happybdaypaper.com';
  const fromName = process.env.FROM_NAME || 'Paper Birthdays';

  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}

/**
 * Send email via Mailgun
 */
async function sendEmailMailgun(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.FROM_EMAIL || `noreply@${domain}`;
  const fromName = process.env.FROM_NAME || 'Paper Birthdays';

  if (!apiKey || !domain) {
    console.error('MAILGUN_API_KEY or MAILGUN_DOMAIN not configured');
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('from', `${fromName} <${fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', text);
    formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailgun error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Mailgun error:', error);
    return false;
  }
}

/**
 * Send email via AWS SES
 */
async function sendEmailSES(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  // AWS SES requires AWS SDK - would need to install @aws-sdk/client-ses
  // For now, log that it's not implemented
  console.error('AWS SES integration not yet implemented. Please use SendGrid or Mailgun.');
  console.error('To implement SES: npm install @aws-sdk/client-ses');
  return false;
}
