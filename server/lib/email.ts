import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Momentum <onboarding@resend.dev>';

/** Sends a password reset email with a tokenised link.
 *  No-ops (with a warning) if RESEND_API_KEY is not configured. */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send. Reset URL:', resetUrl);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Momentum password',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f0f1f3;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f1f3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Momentum</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:32px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Reset your password</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a request to reset the password for your Momentum account.
                Click the button below — the link expires in <strong>1 hour</strong>.
              </p>

              <a href="${resetUrl}"
                 style="display:inline-block;padding:11px 24px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
                Reset Password
              </a>

              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                If you didn't request this, you can safely ignore this email — your password won't change.<br /><br />
                Or copy this link into your browser:<br />
                <span style="color:#6b7280;word-break:break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()
  });
}
