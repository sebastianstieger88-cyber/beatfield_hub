import { timingSafeEqual } from 'node:crypto';

export class WixError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function wixSettings(env = process.env) {
  for (const name of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','WIX_SITE_ID','WIX_API_KEY','WIX_WEBHOOK_SECRET']) {
    if (!env[name]) throw new WixError(503, `Wix-Verbindung noch nicht eingerichtet (${name}).`);
  }
  if (env.WIX_WEBHOOK_SECRET.length < 32) throw new WixError(503, 'Der Wix-Verbindungsschlüssel ist zu kurz.');
  return env;
}
export function validId(value) { return typeof value === 'string' && /^[a-f0-9-]{36}$/i.test(value); }
export function parseWixWebhookBody(raw) {
  const serialized = Buffer.isBuffer(raw) ? raw.toString('utf8') : typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
  if (Buffer.byteLength(serialized, 'utf8') > 4096) throw new WixError(413,'Anfrage zu groß.');
  let body;
  try { body = JSON.parse(serialized); }
  catch { throw new WixError(400,'Webhook enthält kein gültiges JSON.'); }
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(body)) throw new WixError(400,'Webhook muss ein JSON-Objekt enthalten.');
  // Accept explicit data envelopes, never merge credentials and IDs from different objects.
  const hasFields = value => ['secret','kind','id'].some(key => Object.hasOwn(value,key));
  if (hasFields(body) && Object.hasOwn(body,'data')) throw new WixError(400,'Webhook enthält mehrdeutige Daten. Bitte nur einen Datensatz senden.');
  if (!hasFields(body) && Object.hasOwn(body,'data')) {
    const data = body.data;
    if (isObject(data)) return {body:data,shape:'data-object'};
    if (Array.isArray(data) && data.length === 1 && isObject(data[0])) return {body:data[0],shape:'data-single-item'};
    throw new WixError(400,'Webhook data muss genau einen Datensatz enthalten.');
  }
  return {body,shape:'direct'};
}
export function webhookAuthorized(req, env) {
  // Wix Automations can send a fixed secret as a body field. Never persist it.
  const value = req.headers.authorization?.replace(/^Bearer /, '') || req.body?.secret;
  if (typeof value !== 'string') return false;
  const a = Buffer.from(value), b = Buffer.from(env.WIX_WEBHOOK_SECRET);
  return a.length === b.length && timingSafeEqual(a,b);
}
export function webhookAuthDiagnosis(req, env) {
  // Fixed labels and booleans only: never log payloads, headers or secret values.
  const body = req.body;
  const bodyType = body == null ? 'missing' : Array.isArray(body) ? 'array' : typeof body;
  const bodySecretIsText = typeof body?.secret === 'string';
  const headerPresent = Boolean(req.headers.authorization);
  const bodySecretMatches = bodySecretIsText && webhookAuthorized({headers:{},body}, env);
  let code = 'WIX_SECRET_MISMATCH';
  if (headerPresent && bodySecretMatches) code = 'WIX_AUTH_HEADER_CONFLICT';
  else if (!headerPresent && bodyType !== 'object') code = 'WIX_BODY_NOT_OBJECT';
  else if (!headerPresent && body?.secret == null) code = 'WIX_SECRET_MISSING';
  else if (!headerPresent && !bodySecretIsText) code = 'WIX_SECRET_NOT_TEXT';
  return {code, bodyType, headerPresent, bodySecretIsText,
    kindPresent: typeof body?.kind === 'string', idPresent: typeof body?.id === 'string',
    fieldCount: body && typeof body === 'object' ? Object.keys(body).length : 0,
    payloadPresent: Boolean(body && Object.hasOwn(body,'payload'))};
}
export async function requestJson(url, options, service, fetcher = fetch) {
  const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(12000), redirect:'error' });
  if (!response.ok) throw new WixError(502, `${service} antwortet mit HTTP ${response.status}. Zugang und Berechtigungen prüfen.`);
  return response.status === 204 ? null : response.json();
}
export function dbRequest(env, resource, body, fetcher = fetch) {
  return requestJson(`${env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${resource}`, {
    method:body === undefined ? 'GET' : 'POST',
    headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
  },'Supabase',fetcher);
}
export async function requireAdmin(req, env, fetcher = fetch) {
  const token = req.headers.authorization;
  if (typeof token !== 'string' || !token.startsWith('Bearer ') || token.length > 16000) throw new WixError(401,'Bitte anmelden.');
  const response = await fetcher(`${env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/user`, {
    headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:token},signal:AbortSignal.timeout(10000),redirect:'error',
  });
  if (!response.ok) throw new WixError(401,'Bitte erneut anmelden.');
  const user = await response.json();
  if (!validId(user.id)) throw new WixError(401,'Ungültige Anmeldung.');
  const profiles = await dbRequest(env,`profiles?user_id=eq.${user.id}&select=role`,undefined,fetcher);
  if (profiles[0]?.role !== 'admin') throw new WixError(403,'Nur Admins können Wix-Importe verwalten.');
}
export async function wixRequest(env, path, body, fetcher = fetch) {
  return requestJson(`https://www.wixapis.com${path}`, {
    method:body === undefined ? 'GET' : 'POST',
    headers:{Authorization:env.WIX_API_KEY,'wix-site-id':env.WIX_SITE_ID,'Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)}),
  },'Wix',fetcher);
}
const trim = (v, max=250) => typeof v === 'string' ? v.trim().slice(0,max) : '';
export function normalizeWix(kind, entity, contact = null) {
  if (!entity || !validId(entity.id) || !entity.updatedDate || !Number.isFinite(Date.parse(entity.updatedDate))) {
    throw new WixError(422,'Wix-Datensatz ohne gültige ID oder Änderungsdatum.');
  }
  const info = contact?.info;
  const person = kind === 'plan' ? {firstName:info?.name?.first,lastName:info?.name?.last,
    phone:contact?.primaryInfo?.phone || info?.phones?.items?.[0]?.phone,
    email:contact?.primaryInfo?.email || info?.emails?.items?.[0]?.email} : entity.contactDetails;
  const base = {kind,external_id:entity.id,source_updated_at:new Date(entity.updatedDate).toISOString(),
    full_name:trim([person?.firstName,person?.lastName].filter(Boolean).join(' ')),
    phone:trim(person?.phone,80),email:trim(person?.email),
    source_status:trim(entity.status,40),action:'review',reason:''};
  if (kind === 'plan') {
    base.offer_id = entity.planId;
    base.offer_name = trim(entity.planName);
    if (['PENDING','ACTIVE'].includes(entity.status) && entity.lastPaymentStatus === 'PAID') base.action='upsert';
    else if (entity.status === 'CANCELED') base.action='cancel';
    else if (entity.status === 'DRAFT') base.action='ignore';
    else base.reason='Preisplan ist nicht als bezahlt/aktiv bestätigt oder hat einen Sonderstatus. Bitte in Wix prüfen.';
  } else {
    const slot = entity.bookedEntity?.slot;
    base.offer_id = slot?.serviceId || entity.bookedEntity?.schedule?.serviceId;
    base.starts_at = entity.startDate || slot?.startDate;
    if (['CANCELED','DECLINED'].includes(entity.status)) base.action='cancel';
    else if (entity.status !== 'CONFIRMED') base.action='ignore';
    else if (!slot || entity.totalParticipants !== 1) base.reason='Mehrteilnehmer-, Varianten- oder Kursserienbuchung: bitte einzeln prüfen.';
    else if (entity.selectedPaymentOption === 'MEMBERSHIP') base.reason='Termin mit Preisplan bezahlt: bestehende Season-Teilnahme prüfen, um Doppelbuchung zu vermeiden.';
    else if (!base.starts_at || !/(Z|[+-]\d\d:\d\d)$/.test(base.starts_at) || !Number.isFinite(Date.parse(base.starts_at))) base.reason='Der Wix-Termin enthält keine eindeutige Startzeit mit Zeitzone.';
    else base.action='upsert';
  }
  if (!validId(base.offer_id)) throw new WixError(422,'Wix-Angebots-ID fehlt.');
  if (base.action === 'upsert' && !base.full_name) {base.action='review';base.reason='Teilnehmername fehlt in Wix.';}
  return base;
}
export async function importWix(env, kind, id, fetcher = fetch) {
  if (!['plan','booking'].includes(kind) || !validId(id)) throw new WixError(400,'Bitte Typ (plan/booking) und die Wix-Bestell- oder Buchungs-ID angeben.');
  let entity, contact;
  if (kind === 'plan') {
    ({order:entity} = await wixRequest(env,`/pricing-plans/v2/orders/${id}`,undefined,fetcher));
    if (validId(entity?.buyer?.contactId)) ({contact} = await wixRequest(env,`/contacts/v4/contacts/${entity.buyer.contactId}`,undefined,fetcher));
  } else {
    const result = await wixRequest(env,'/_api/bookings-reader/v2/extended-bookings/query',{
      query:{filter:{id:{$eq:id}},cursorPaging:{limit:1}},
    },fetcher);
    entity = result.extendedBookings?.[0]?.booking;
  }
  if (entity?.id !== id) throw new WixError(404,'Die Buchung wurde auf der konfigurierten Wix-Webseite nicht gefunden.');
  const payload = normalizeWix(kind,entity,contact);
  return dbRequest(env,'rpc/wix_apply_import',{incoming:{...payload,site_id:env.WIX_SITE_ID}},fetcher);
}
export function wixRespondError(res,error) {
  return res.status(error instanceof WixError ? error.status : 503).json({error:error instanceof WixError ? error.message : 'Wix-Import momentan nicht erreichbar. Bitte erneut versuchen.'});
}
