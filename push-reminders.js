const ownerKey = 'beatfield-push-owner';
const apiUrl = new URL('./api/push-subscription', import.meta.url);
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function pushAvailability() {
  if (!window.isSecureContext) return 'Erinnerungen benötigen eine sichere HTTPS-Verbindung.';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) return 'Auf dem iPhone: In Safari „Teilen“ → „Zum Home-Bildschirm“ wählen und die App anschließend über das neue Symbol öffnen.';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'Dieser Browser unterstützt keine Push-Erinnerungen. Bitte nutze einen aktuellen Browser.';
  return null;
}
export function publicKeyBytes(key) {
  const binary = atob(key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '='));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
export async function preparePushWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
  await navigator.serviceWorker.register(new URL('./service-worker.js', import.meta.url), { scope: new URL('./', import.meta.url).pathname });
  let timer;
  try {
    return await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Die Geräteanmeldung dauert zu lange. Bitte lade die App neu.')), 15000); })]);
  } finally { clearTimeout(timer); }
}

export function createPushReminders({ getState, notify, openSession }) {
  const panel = document.querySelector('#pushSettings'), status = document.querySelector('#pushStatus');
  const enable = document.querySelector('#enablePushBtn'), disable = document.querySelector('#disablePushBtn');
  const test = document.querySelector('#testPushBtn'), refresh = document.querySelector('#refreshPushBtn');
  let currentUser = null, publicKey = null, enabled = false, busy = false, generation = 0;
  let landingHandledUser = null;
  async function request(body, token = getState().session?.access_token) {
    if (!token) throw new Error('Bitte zuerst anmelden.');
    const response = await fetch(apiUrl, {
      method: body ? 'POST' : 'GET', cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000),
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('Push ist auf diesem Server noch nicht eingerichtet.'); }
    if (!response.ok) throw new Error(result.error || 'Push ist momentan nicht erreichbar.');
    return result;
  }
  function buttons() {
    enable.disabled = busy || !publicKey || enabled || Boolean(pushAvailability());
    disable.disabled = busy || !enabled; test.disabled = busy || !enabled; refresh.disabled = busy;
    panel.setAttribute('aria-busy', String(busy));
  }
  async function registration() { return navigator.serviceWorker.getRegistration(new URL('./', import.meta.url)); }
  async function refreshStatus() {
    const run = ++generation;
    publicKey = null; enabled = false;
    const unsupported = pushAvailability();
    if (unsupported) { status.textContent = unsupported; buttons(); return; }
    busy = true; status.textContent = 'Geräteanmeldung wird geprüft …'; buttons();
    try {
      const config = await request();
      const reg = await preparePushWorker();
      let sub = await reg.pushManager.getSubscription();
      const owner = localStorage.getItem(ownerKey);
      if (sub && owner && owner !== currentUser) { await sub.unsubscribe(); sub = null; localStorage.removeItem(ownerKey); }
      const saved = sub ? await request({ action: 'status', endpoint: sub.endpoint }) : { enabled: false };
      if (run !== generation) return;
      publicKey = config.publicKey; enabled = saved.enabled;
      if (enabled) localStorage.setItem(ownerKey, currentUser);
      status.textContent = enabled ? 'Erinnerungen sind auf diesem Gerät aktiviert.' : Notification.permission === 'denied'
        ? 'Benachrichtigungen sind im Browser blockiert. Erlaube sie in den Website-Einstellungen und prüfe den Status erneut.'
        : 'Erinnerungen sind auf diesem Gerät ausgeschaltet.';
    } catch (error) { if (run === generation) status.textContent = error.message; }
    finally { if (run === generation) { busy = false; buttons(); } }
  }
  enable.addEventListener('click', async () => {
    if (busy || !publicKey) return;
    const userAtStart = currentUser;
    // Permission is requested directly from a deliberate user click, as required on iOS.
    const permission = Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
    busy = true; buttons();
    let sub;
    try {
      if (await permission !== 'granted') throw new Error('Keine Freigabe erteilt. Du kannst Erinnerungen später aktivieren.');
      const reg = await preparePushWorker();
      sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKeyBytes(publicKey) });
      if (currentUser !== userAtStart) throw new Error('Das angemeldete Konto hat sich geändert. Bitte erneut aktivieren.');
      await request({ action: 'subscribe', subscription: sub.toJSON() });
      if (currentUser !== userAtStart) { await sub.unsubscribe(); return; }
      localStorage.setItem(ownerKey, currentUser); enabled = true;
      status.textContent = 'Erinnerungen sind aktiviert. Mit „Testerinnerung senden“ kannst du den Empfang prüfen.';
    } catch (error) { if (sub) await sub.unsubscribe().catch(() => {}); status.textContent = error.message; }
    finally { busy = false; buttons(); }
  });
  async function deactivate({ silent = false } = {}) {
    if (!('serviceWorker' in navigator)) return;
    const reg = await registration();
    const sub = await reg?.pushManager?.getSubscription();
    let serverError = null;
    if (sub) {
      try { await request({ action: 'unsubscribe', endpoint: sub.endpoint }); } catch (error) { serverError = error; }
      const removed = await sub.unsubscribe();
      if (!removed && serverError) throw new Error('Die Geräteanmeldung konnte nicht entfernt werden. Bitte Benachrichtigungen in den Browser-Einstellungen sperren.');
    }
    localStorage.removeItem(ownerKey); enabled = false;
    if (!silent) status.textContent = serverError ? 'Auf diesem Gerät deaktiviert. Die Serverbereinigung erfolgt beim nächsten Versandversuch.' : 'Erinnerungen sind auf diesem Gerät deaktiviert.';
    buttons();
  }
  disable.addEventListener('click', async () => {
    busy = true; buttons();
    try { await deactivate(); } catch (error) { status.textContent = error.message; }
    finally { busy = false; buttons(); }
  });
  test.addEventListener('click', async () => {
    busy = true; buttons();
    try {
      const sub = await (await registration())?.pushManager.getSubscription();
      if (!sub) throw new Error('Bitte Erinnerungen erneut aktivieren.');
      await request({ action: 'test', endpoint: sub.endpoint });
      status.textContent = 'Testerinnerung an den Push-Anbieter übergeben. Prüfe die Mitteilungen auf deinem Gerät.';
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; buttons(); }
  });
  refresh.addEventListener('click', refreshStatus);
  return {
    render() {
      const state = getState();
      const user = ['trainer', 'admin'].includes(state.profile?.role) ? state.session?.user.id : null;
      panel.classList.toggle('hidden', !user);
      if (user === currentUser) return;
      const oldUser = currentUser;
      landingHandledUser = null;
      currentUser = user; generation++; busy = false;
      if (user) void refreshStatus();
      else if (oldUser) void deactivate({ silent: true }).catch(() => {});
    },
    async beforeLogout() {
      if (busy) { notify('Bitte warte, bis die Geräteanmeldung abgeschlossen ist.', true); return false; }
      try { await deactivate({ silent: true }); return true; }
      catch (error) { notify(error.message, true); return false; }
    },
    openPending() {
      const url = new URL(location.href), id = url.searchParams.get('attendanceReminder');
      const state = getState();
      if (!id) return Boolean(landingHandledUser && landingHandledUser === state.session?.user.id);
      if (!state.profile) return false;
      if (!['trainer', 'admin'].includes(state.profile.role)) return false;
      url.searchParams.delete('attendanceReminder'); history.replaceState(null, '', url);
      const session = uuidPattern.test(id) && state.sessions.find(entry => entry.id === id);
      const course = session && state.courses.find(entry => entry.id === session.course_id);
      if (!course) { notify('Dieser Termin ist für dein Konto nicht mehr verfügbar.', true); return false; }
      landingHandledUser = state.session?.user.id;
      openSession(session.id); return true;
    },
  };
}
