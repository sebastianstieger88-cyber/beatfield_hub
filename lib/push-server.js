import { createHash, timingSafeEqual, ECDH } from 'node:crypto';
import webpush from 'web-push';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function settings(env = process.env) {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'PUSH_VAPID_PUBLIC_KEY', 'PUSH_VAPID_PRIVATE_KEY', 'PUSH_VAPID_SUBJECT', 'PUSH_APP_URL', 'CRON_SECRET'];
  if (required.some(key => !env[key])) throw new HttpError(503, 'Push-Erinnerungen sind auf dem Server noch nicht eingerichtet.');
  const app = new URL(env.PUSH_APP_URL);
  if (app.protocol !== 'https:' || app.username || app.password || app.search || app.hash || !app.pathname.endsWith('/')) {
    throw new HttpError(503, 'Die Push-App-Adresse muss eine HTTPS-Adresse mit abschließendem / sein.');
  }
  if (env.CRON_SECRET.length < 32) throw new HttpError(503, 'Die Push-Serverkonfiguration ist unvollständig.');
  return env;
}

export function validateEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) throw new HttpError(400, 'Ungültige Geräteadresse.');
  let url;
  try { url = new URL(endpoint); } catch { throw new HttpError(400, 'Ungültige Geräteadresse.'); }
  // No caller-controlled arbitrary network destinations (SSRF).
  const host = url.hostname;
  const allowed = host === 'fcm.googleapis.com'
    || host === 'updates.push.services.mozilla.com'
    || host.endsWith('.push.services.mozilla.com')
    || host === 'web.push.apple.com'
    || host.endsWith('.push.apple.com')
    || host.endsWith('.notify.windows.com');
  if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
    throw new HttpError(400, 'Dieser Push-Anbieter wird nicht unterstützt.');
  }
  return endpoint;
}

export function validateSubscription(value) {
  validateEndpoint(value?.endpoint);
  for (const [key, length] of [['p256dh', 65], ['auth', 16]]) {
    const data = value?.keys?.[key];
    if (typeof data !== 'string' || !/^[A-Za-z0-9_-]+={0,2}$/.test(data) || Buffer.from(data, 'base64url').length !== length) {
      throw new HttpError(400, 'Ungültiger Geräteschlüssel.');
    }
  }
  try { ECDH.convertKey(Buffer.from(value.keys.p256dh, 'base64url'), 'prime256v1'); }
  catch { throw new HttpError(400, 'Ungültiger Geräteschlüssel.'); }
  return { endpoint: value.endpoint, keys: { p256dh: value.keys.p256dh, auth: value.keys.auth } };
}

export const endpointHash = endpoint => createHash('sha256').update(endpoint).digest('hex');
export function cronAuthorized(header, secret) {
  if (typeof header !== 'string' || !secret || secret.length < 32) return false;
  const a = Buffer.from(header), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function database(env, resource, { method = 'GET', body, prefer } = {}) {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${resource}`, {
    method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(response.status === 409 ? 409 : 503, response.status === 409 ? 'Dieses Gerät ist bereits registriert. Bitte erneut aktivieren.' : 'Die Push-Datenbank ist noch nicht eingerichtet oder momentan nicht erreichbar.');
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function authenticate(req, env) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ') || authorization.length > 16000) throw new HttpError(401, 'Bitte erneut anmelden.');
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authorization }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(401, 'Bitte erneut anmelden.');
  const user = await response.json();
  if (!/^[a-f0-9-]{36}$/i.test(user.id || '')) throw new HttpError(401, 'Bitte erneut anmelden.');
  const profiles = await database(env, `profiles?user_id=eq.${user.id}&select=role`);
  if (!['trainer', 'admin'].includes(profiles[0]?.role)) throw new HttpError(403, 'Erinnerungen sind nur für freigeschaltete Trainer und Admins verfügbar.');
  return user.id;
}

export function notificationPayload(env, sessionId = null) {
  const url = new URL(env.PUSH_APP_URL);
  if (sessionId) url.searchParams.set('attendanceReminder', sessionId);
  return {
    title: sessionId ? 'Anwesenheit noch offen' : 'BEATFIELD · Testerinnerung',
    body: sessionId ? 'Bitte vervollständige die Anwesenheit für dein Training. Tippe hier, um den Termin zu öffnen.' : 'Push-Erinnerungen funktionieren auf diesem Gerät.',
    url: url.href, tag: sessionId ? `attendance-${sessionId}` : 'beatfield-push-test',
  };
}

export async function sendPush(env, subscription, payload) {
  const validated = validateSubscription(subscription);
  return webpush.sendNotification(validated, JSON.stringify(payload), {
    TTL: 900, urgency: 'normal', timeout: 7000,
    vapidDetails: { subject: env.PUSH_VAPID_SUBJECT, publicKey: env.PUSH_VAPID_PUBLIC_KEY, privateKey: env.PUSH_VAPID_PRIVATE_KEY },
  });
}

export function respondError(res, error) {
  // Never log subscription endpoints, bearer tokens or provider response bodies.
  return res.status(error instanceof HttpError ? error.status : 503).json({ error: error instanceof HttpError ? error.message : 'Push ist momentan nicht erreichbar. Bitte später erneut versuchen.' });
}
