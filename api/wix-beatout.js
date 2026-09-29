import { timingSafeEqual } from 'node:crypto';
import { WixError, serviceFetch, wixRespondError } from '../lib/wix-server.js';

const MAX_BODY_BYTES = 4096;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function settings(env = process.env) {
  for (const name of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'WIX_BEATOUT_WEBHOOK_SECRET']) {
    if (!env[name]) throw new WixError(503, 'BEAT-OUT-Automatisierung ist noch nicht eingerichtet (' + name + ').');
  }
  if (env.WIX_BEATOUT_WEBHOOK_SECRET.length < 32) throw new WixError(503, 'Der Schlüssel für die BEAT-OUT-Automatisierung ist zu kurz.');
  return env;
}
function normalizeText(value, max = 160) { return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''; }
function comparisonKey(value) { return normalizeText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('de-DE'); }
function phoneKey(value) { return typeof value === 'string' ? value.replace(/[^\d+]/g, '') : ''; }
function parseBody(raw) {
  const serialized = Buffer.isBuffer(raw) ? raw.toString('utf8') : typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) throw new WixError(413, 'Anfrage zu groß.');
  let body; try { body = JSON.parse(serialized); } catch { throw new WixError(400, 'Webhook enthält kein gültiges JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new WixError(400, 'Webhook muss ein JSON-Objekt enthalten.');
  return body;
}
function authorized(req, body, env) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || body.secret;
  if (typeof token !== 'string') return false;
  const left = Buffer.from(token), right = Buffer.from(env.WIX_BEATOUT_WEBHOOK_SECRET);
  return left.length === right.length && timingSafeEqual(left, right);
}
function normalizedDate(value) {
  const raw = normalizeText(value, 20);
  if (DATE_PATTERN.test(raw) && !Number.isNaN(Date.parse(raw + 'T00:00:00Z'))) return raw;
  const parts = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!parts) return '';
  const iso = parts[3] + '-' + parts[2].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
  return Number.isNaN(Date.parse(iso + 'T00:00:00Z')) ? '' : iso;
}
function timeKey(value) {
  const match = normalizeText(value, 32).match(/(?:^|\s)(\d{1,2}):(\d{2})(?::\d{2})?(?:\s|$)/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return '';
  return match[1].padStart(2, '0') + ':' + match[2];
}
function weekdayFor(date) { return ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][new Date(date + 'T12:00:00Z').getUTCDay()]; }
function weekdayKey(value) {
  const v = comparisonKey(value);
  const aliases = { mo: 'montag', montag: 'montag', di: 'dienstag', dienstag: 'dienstag', mi: 'mittwoch', mittwoch: 'mittwoch', do: 'donnerstag', donnerstag: 'donnerstag', fr: 'freitag', freitag: 'freitag', sa: 'samstag', samstag: 'samstag', so: 'sonntag', sonntag: 'sonntag' };
  return aliases[v] || v;
}
function requestData(body) {
  const firstName = normalizeText(body.firstName ?? body.first_name ?? body.vorname, 80);
  const lastName = normalizeText(body.lastName ?? body.last_name ?? body.nachname, 80);
  const fullName = normalizeText(body.fullName ?? body.full_name ?? body.name ?? [firstName, lastName].filter(Boolean).join(' '));
  const trainingLocation = normalizeText(body.trainingLocation ?? body.training_location ?? body.location ?? body.trainingsstandort, 80);
  const sessionDate = normalizedDate(body.sessionDate ?? body.session_date ?? body.date ?? body.datum);
  const trainingTime = timeKey(body.trainingTime ?? body.training_time ?? body.time ?? body.trainingsuhrzeit);
  const phone = phoneKey(body.phone);
  if (!fullName || !trainingLocation || !sessionDate || !trainingTime) throw new WixError(400, 'Benötigt werden Vorname, Nachname, Trainingsstandort, Datum und Trainingsuhrzeit.');
  return { fullName, trainingLocation, sessionDate, trainingTime, phone };
}
async function supabase(env, resource, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json'; if (prefer) headers.Prefer = prefer;
  const response = await serviceFetch(env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + resource, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, 'Supabase');
  if (!response.ok) throw new WixError(502, 'Supabase antwortet mit HTTP ' + response.status + '. Bitte erneut versuchen.');
  if (response.status === 204) return null; try { return await response.json(); } catch { throw new WixError(502, 'Supabase hat keine gültige Antwort zurückgegeben.'); }
}
function one(rows, message) { if (!Array.isArray(rows) || rows.length !== 1) throw new WixError(409, message); return rows[0]; }
function beatOutLimit(packageType) { const value = normalizeText(packageType).toUpperCase(); return value === '1X TRAIN' ? 1 : value === '2X BEAT' ? 2 : value === '3X REPEAT' ? 3 : 0; }
async function getOrCreateSession(env, courseId, seasonId, sessionDate) {
  const lookup = 'attendance_sessions?course_id=eq.' + encodeURIComponent(courseId) + '&session_date=eq.' + encodeURIComponent(sessionDate) + '&select=id,season_id';
  const existing = await supabase(env, lookup);
  if (existing.length === 1) { if (existing[0].season_id !== seasonId) throw new WixError(409, 'Der Termin gehört zu einer anderen Season.'); return existing[0]; }
  if (existing.length > 1) throw new WixError(409, 'Mehrere passende Trainingstermine gefunden.');
  const inserted = await supabase(env, 'attendance_sessions?on_conflict=course_id,session_date', { method: 'POST', body: { course_id: courseId, season_id: seasonId, session_date: sessionDate }, prefer: 'resolution=ignore-duplicates,return=representation' });
  if (inserted.length === 1) return inserted[0];
  const retried = await supabase(env, lookup), session = one(retried, 'Der Trainingstermin konnte nicht angelegt werden.');
  if (session.season_id !== seasonId) throw new WixError(409, 'Der Termin gehört zu einer anderen Season.'); return session;
}
async function applyBeatOut(env, input) {
  const courses = await supabase(env, 'courses?select=id,name,location,weekday,time');
  const course = one(courses.filter((entry) => comparisonKey(entry.location) === comparisonKey(input.trainingLocation) && timeKey(entry.time) === input.trainingTime && weekdayKey(entry.weekday) === weekdayKey(weekdayFor(input.sessionDate))), 'Für Standort, Datum und Uhrzeit wurde kein eindeutiger Kurs gefunden.');
  const participants = await supabase(env, 'participants?course_id=eq.' + encodeURIComponent(course.id) + '&select=id,full_name,phone,season_id,season_booking_id');
  const sameName = participants.filter((entry) => comparisonKey(entry.full_name) === comparisonKey(input.fullName));
  if (!sameName.length) throw new WixError(404, 'Kein passender Teilnehmer für diesen Kurs gefunden.');
  const seasonIds = [...new Set(sameName.map((entry) => entry.season_id).filter(Boolean))];
  if (!seasonIds.length) throw new WixError(422, 'Der Teilnehmer hat keine gültige Season-Buchung.');
  const seasons = await supabase(env, 'seasons?id=in.(' + seasonIds.map(encodeURIComponent).join(',') + ')&select=id,start_date,end_date');
  const seasonById = new Map(seasons.map((entry) => [entry.id, entry]));
  let matches = sameName.filter((entry) => { const season = seasonById.get(entry.season_id); return season && season.start_date <= input.sessionDate && season.end_date >= input.sessionDate; });
  if (input.phone) matches = matches.filter((entry) => phoneKey(entry.phone) === input.phone);
  const participant = one(matches, input.phone ? 'Teilnehmer oder Telefonnummer sind nicht eindeutig.' : 'Der Teilnehmer ist nicht eindeutig.');
  if (!participant.season_booking_id) throw new WixError(422, 'Der Teilnehmer hat keine Season-Buchung für BEAT-OUT.');
  const booking = one(await supabase(env, 'season_bookings?id=eq.' + encodeURIComponent(participant.season_booking_id) + '&season_id=eq.' + encodeURIComponent(participant.season_id) + '&select=id,season_id,package_type'), 'Die zugehörige Season-Buchung wurde nicht gefunden.');
  const limit = beatOutLimit(booking.package_type); if (!limit) throw new WixError(422, 'Das gebuchte Paket erlaubt keinen BEAT-OUT.');
  const session = await getOrCreateSession(env, course.id, participant.season_id, input.sessionDate);
  const existing = await supabase(env, 'beat_out_entries?session_id=eq.' + encodeURIComponent(session.id) + '&participant_id=eq.' + encodeURIComponent(participant.id) + '&select=id');
  if (existing.length) return { created: false };
  const entries = await supabase(env, 'beat_out_entries?season_booking_id=eq.' + encodeURIComponent(booking.id) + '&select=session_id');
  const seasonSessions = await supabase(env, 'attendance_sessions?season_id=eq.' + encodeURIComponent(participant.season_id) + '&select=id');
  if (entries.filter((entry) => new Set(seasonSessions.map((row) => row.id)).has(entry.session_id)).length >= limit) throw new WixError(422, 'Das BEAT-OUT-Limit dieses Pakets (' + limit + ') ist bereits erreicht.');
  const created = await supabase(env, 'beat_out_entries?on_conflict=session_id,participant_id', { method: 'POST', body: { session_id: session.id, participant_id: participant.id, season_booking_id: booking.id }, prefer: 'resolution=ignore-duplicates,return=representation' });
  await supabase(env, 'attendance_records?session_id=eq.' + encodeURIComponent(session.id) + '&participant_id=eq.' + encodeURIComponent(participant.id), { method: 'DELETE' });
  return { created: created.length === 1 };
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  try { const env = settings(), body = parseBody(req.body); if (!authorized(req, body, env)) { console.warn('wix-beatout: authentication rejected', { hasAuthorization: Boolean(req.headers.authorization), hasBodySecret: typeof body.secret === 'string' }); return res.status(401).json({ error: 'Nicht autorisiert.', code: 'WIX_BEATOUT_SECRET_MISMATCH' }); }
    const result = await applyBeatOut(env, requestData(body)); return res.status(200).json({ status: 'ok', ...result });
  } catch (error) { return wixRespondError(res, error); }
}
