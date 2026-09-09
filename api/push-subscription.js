import { settings, HttpError, authenticate, database, validateEndpoint, validateSubscription, endpointHash, notificationPayload, sendPush, respondError } from '../lib/push-server.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); return res.status(405).end(); }
  try {
    const env = settings();
    const userId = await authenticate(req, env);
    if (req.method === 'GET') return res.status(200).json({ publicKey: env.PUSH_VAPID_PUBLIC_KEY });
    if (JSON.stringify(req.body || {}).length > 8192) throw new HttpError(413, 'Die Geräteanfrage ist zu groß.');
    const { action, subscription, endpoint } = req.body || {};
    if (!['subscribe', 'unsubscribe', 'status', 'test'].includes(action)) throw new HttpError(400, 'Unbekannte Push-Aktion.');
    const address = validateEndpoint(action === 'subscribe' ? subscription?.endpoint : endpoint);
    const hash = endpointHash(address);
    const ownedQuery = `push_subscriptions?user_id=eq.${userId}&endpoint_hash=eq.${hash}`;
    const rows = await database(env, `${ownedQuery}&select=id,subscription`);
    if (action === 'status') return res.status(200).json({ enabled: rows.length > 0 });
    if (action === 'unsubscribe') {
      await database(env, ownedQuery, { method: 'DELETE' });
      return res.status(200).json({ enabled: false });
    }
    if (action === 'subscribe') {
      const clean = validateSubscription(subscription);
      if (rows.length) {
        await database(env, ownedQuery, { method: 'PATCH', body: { subscription: clean, updated_at: new Date().toISOString() } });
      } else {
        const devices = await database(env, `push_subscriptions?user_id=eq.${userId}&select=id&limit=10`);
        if (devices.length >= 10) throw new HttpError(400, 'Maximal zehn Geräte pro Konto. Bitte zuerst ein altes Gerät deaktivieren.');
        await database(env, 'push_subscriptions', { method: 'POST', body: { user_id: userId, endpoint_hash: hash, subscription: clean } });
      }
      return res.status(200).json({ enabled: true });
    }
    if (!rows[0]) throw new HttpError(404, 'Erinnerungen sind für dieses Gerät nicht aktiviert.');
    const claimed = await database(env, 'rpc/push_claim_test', { method: 'POST', body: { target_subscription: rows[0].id, target_user: userId } });
    if (!claimed) throw new HttpError(429, 'Bitte warte eine Minute vor der nächsten Testerinnerung.');
    try { await sendPush(env, rows[0].subscription, notificationPayload(env)); }
    catch (error) {
      if ([404, 410].includes(error.statusCode)) {
        await database(env, ownedQuery, { method: 'DELETE' });
        throw new HttpError(410, 'Die Geräteanmeldung ist abgelaufen. Bitte Erinnerungen erneut aktivieren.');
      }
      throw error;
    }
    return res.status(200).json({ sent: true });
  } catch (error) { return respondError(res, error); }
}
