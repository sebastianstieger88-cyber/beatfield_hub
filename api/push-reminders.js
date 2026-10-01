import { settings, cronAuthorized, database, notificationPayload, sendPush, respondError } from '../lib/push-server.js';
import { wixSettings, syncWixPlanOrders } from '../lib/wix-server.js';

// Exported with dependencies for isolated tests; never called from the browser.
export async function deliverReminders(env, db = database, send = sendPush, clock = Date.now) {
  const started = clock();
  const due = await db(env, 'rpc/push_due_reminders', { method: 'POST', body: {} });
  const totals = { due: due.length, claimed: 0, accepted: 0, failed: 0 };
  for (const target of due) {
    if (clock() - started > 40000) break;
    const devices = await db(env, `push_subscriptions?user_id=eq.${target.user_id}&select=id,subscription`);
    if (!devices.length) continue;
    const claimed = await db(env, 'rpc/push_claim_reminder', { method: 'POST', body: { target_session: target.session_id, target_user: target.user_id } });
    if (!claimed) continue;
    totals.claimed++;
    const results = await Promise.all(devices.map(async device => {
      try {
        const current = await db(env, `push_subscriptions?id=eq.${device.id}&user_id=eq.${target.user_id}&select=id`);
        if (!current.length) return false;
        await send(env, device.subscription, notificationPayload(env, target.session_id));
        return true;
      } catch (error) {
        if ([404, 410].includes(error.statusCode)) await db(env, `push_subscriptions?id=eq.${device.id}`, { method: 'DELETE' }).catch(() => {});
        return false;
      }
    }));
    const accepted = results.filter(Boolean).length, failed = results.length - accepted;
    totals.accepted += accepted; totals.failed += failed;
    await db(env, `push_reminder_log?session_id=eq.${target.session_id}&user_id=eq.${target.user_id}`, {
      method: 'PATCH', body: { status: failed ? accepted ? 'partial' : 'failed' : 'sent', accepted_count: accepted, failed_count: failed, finished_at: new Date().toISOString() },
    });
  }
  return totals;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!cronAuthorized(req.headers.authorization, process.env.CRON_SECRET)) return res.status(401).json({ error: 'Nicht autorisiert.' });
  try {
    const reminders = await deliverReminders(settings());
    let wix = null;
    try { wix = await syncWixPlanOrders(wixSettings()); }
    catch (error) { console.warn('wix scheduled sync skipped', error instanceof Error ? error.message : 'unbekannter Fehler'); }
    return res.status(200).json({ ...reminders, wix });
  } catch (error) { return respondError(res, error); }
}
