/**
 * Supabase Auth "Send Email" hook → Resend.
 * Deploy: supabase functions deploy send-auth-email --no-verify-jwt
 * Secrets: RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET, RESEND_FROM (optional)
 *
 * Dashboard: Authentication → Hooks → Send Email → https://<ref>.supabase.co/functions/v1/send-auth-email
 */
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API = 'https://api.resend.com/emails';

type EmailPayload = {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
    new_email?: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    token_new: string;
    token_hash_new: string;
    email_action_type: string;
    redirect_to: string;
    site_url: string;
    old_email?: string;
  };
};

function envFromEmail(name: string): string {
  const v = Deno.env.get(name);
  if (!v?.trim()) throw new Error(`Missing required secret: ${name}`);
  return v.trim();
}

function hookSecretRaw(): string {
  const full = envFromEmail('SEND_EMAIL_HOOK_SECRET');
  return full.replace(/^v1,whsec_/i, '').trim();
}

function resendFrom(): string {
  return Deno.env.get('RESEND_FROM')?.trim() || 'Student.Info <onboarding@resend.dev>';
}

function appName(): string {
  return Deno.env.get('APP_NAME')?.trim() || 'Student.Info';
}

function verifyType(action: string): string {
  const m: Record<string, string> = {
    signup: 'signup',
    invite: 'invite',
    magiclink: 'magiclink',
    recovery: 'recovery',
    email_change: 'email_change',
    email: 'signup',
    reauthentication: 'magiclink',
  };
  return m[action] ?? 'signup';
}

function buildVerifyUrl(email_data: EmailPayload['email_data'], tokenHash: string): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/u, '') ?? '';
  if (!supabaseUrl) throw new Error('SUPABASE_URL not set in edge environment');
  const type = verifyType(email_data.email_action_type);
  const params = new URLSearchParams({
    token: tokenHash,
    type,
    redirect_to: email_data.redirect_to || email_data.site_url || '/',
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

async function sendResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const key = envFromEmail('RESEND_API_KEY');
  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: [to],
      subject,
      html,
      text,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${body.slice(0, 500)}`);
  }
}

function templateSignupVerify(link: string, code: string, brand: string): { subject: string; html: string; text: string } {
  return {
    subject: `Confirm your email — ${brand}`,
    html: `<p>Welcome to ${brand}.</p><p><a href="${link}">Confirm your email</a></p><p>Or enter this code: <strong>${code}</strong></p>`,
    text: `Welcome to ${brand}. Confirm: ${link}\nOr code: ${code}`,
  };
}

function templateRecovery(link: string, code: string, brand: string): { subject: string; html: string; text: string } {
  return {
    subject: `Reset your password — ${brand}`,
    html: `<p>We received a password reset request.</p><p><a href="${link}">Reset password</a></p><p>Or code: <strong>${code}</strong></p>`,
    text: `Reset password: ${link}\nCode: ${code}`,
  };
}

function templateMagicLink(link: string, code: string, brand: string): { subject: string; html: string; text: string } {
  return {
    subject: `Your sign-in link — ${brand}`,
    html: `<p><a href="${link}">Sign in to ${brand}</a></p><p>Or code: <strong>${code}</strong></p>`,
    text: `Sign in: ${link}\nCode: ${code}`,
  };
}

function templateInfo(subject: string, bodyHtml: string, bodyText: string): { subject: string; html: string; text: string } {
  return { subject, html: bodyHtml, text: bodyText };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  let parsed: EmailPayload;

  try {
    const wh = new Webhook(hookSecretRaw());
    parsed = wh.verify(payload, headers) as EmailPayload;
  } catch (e) {
    console.error('Webhook verify failed:', e);
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { user, email_data } = parsed;
  const brand = appName();
  const action = email_data.email_action_type;
  let pack: { subject: string; html: string; text: string };

  try {
    if (
      action === 'password_changed_notification' ||
      action === 'email_changed_notification' ||
      action === 'phone_changed_notification' ||
      action === 'identity_linked_notification' ||
      action === 'identity_unlinked_notification' ||
      action === 'mfa_factor_enrolled_notification' ||
      action === 'mfa_factor_unenrolled_notification'
    ) {
      pack = templateInfo(
        `Security update — ${brand}`,
        `<p>Your account had a security-related change: <strong>${action.replace(/_notification$/u, '').replace(/_/gu, ' ')}</strong>.</p><p>If this wasn’t you, contact support immediately.</p>`,
        `Account security notice (${action}). If this wasn’t you, contact support.`,
      );
      await sendResend(user.email, pack.subject, pack.html, pack.text);
      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'email_change' && user.new_email && email_data.token_new) {
      const linkCurrent = buildVerifyUrl(email_data, email_data.token_hash_new);
      const linkNew = buildVerifyUrl(email_data, email_data.token_hash);
      await sendResend(
        user.email,
        `Confirm email change (current address) — ${brand}`,
        `<p>Confirm you requested an email change on <strong>${brand}</strong>.</p><p><a href="${linkCurrent}">Confirm from current inbox</a></p><p>Code: <strong>${email_data.token}</strong></p>`,
        `Confirm email change: ${linkCurrent}\nCode: ${email_data.token}`,
      );
      await sendResend(
        user.new_email,
        `Confirm your new email — ${brand}`,
        `<p>Confirm your new address for <strong>${brand}</strong>.</p><p><a href="${linkNew}">Confirm new email</a></p><p>Code: <strong>${email_data.token_new}</strong></p>`,
        `Confirm new email: ${linkNew}\nCode: ${email_data.token_new}`,
      );
      return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const link = buildVerifyUrl(email_data, email_data.token_hash);
    const code = email_data.token || '—';

    if (action === 'recovery' || action === 'reauthentication') {
      pack = templateRecovery(link, code, brand);
    } else if (action === 'magiclink') {
      pack = templateMagicLink(link, code, brand);
    } else if (action === 'signup' || action === 'invite' || action === 'email') {
      pack = templateSignupVerify(link, code, brand);
    } else {
      pack = templateSignupVerify(link, code, brand);
    }

    await sendResend(user.email, pack.subject, pack.html, pack.text);
  } catch (e) {
    console.error('send-auth-email error:', e);
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: e instanceof Error ? e.message : 'Send failed',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
