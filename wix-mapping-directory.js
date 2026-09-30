const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function addStyles() {
  if (document.querySelector('#wix-directory-styles')) return;
  const style = document.createElement('style');
  style.id = 'wix-directory-styles';
  style.textContent = '.wix-directory{margin-top:28px}.wix-directory-toolbar{display:grid;grid-template-columns:minmax(180px,1.7fr) repeat(2,minmax(130px,1fr)) auto;gap:10px;align-items:end;margin:16px 0 10px;padding:14px;background:var(--panel-strong);border:1px solid var(--line);border-radius:12px}.wix-directory-toolbar label{display:grid;gap:6px}.wix-directory-toolbar label span{color:var(--muted);font-size:.72rem;font-weight:700}.wix-directory-toolbar button{white-space:nowrap}.wix-directory-result{margin:0 0 12px}.wix-directory-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}.wix-directory-table{width:100%;min-width:820px;border-collapse:collapse}.wix-directory-table th,.wix-directory-table td{padding:14px 16px;vertical-align:middle;border-bottom:1px solid var(--line)}.wix-directory-table tr:last-child td{border-bottom:0}.wix-directory-table th{text-align:left;color:var(--muted);font-size:.72rem;letter-spacing:.04em;text-transform:uppercase}.wix-directory-table td:nth-child(1){min-width:150px}.wix-directory-table code{display:inline-block;max-width:190px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;color:inherit}.wix-directory-table .ghost{margin:0}@media(max-width:980px){.wix-directory-toolbar{grid-template-columns:repeat(2,minmax(0,1fr))}.wix-directory-toolbar label:first-child,.wix-directory-toolbar button{grid-column:1/-1}}';
  document.head.append(style);
}

function createDirectory(panel, target, mode) {
  const section = document.createElement('section');
  section.className = 'wix-directory';
  const isMappings = mode === 'mappings';
  const title = isMappings ? 'Gespeicherte Zuordnungen' : 'Letzte Importe';
  const description = isMappings ? 'Durchsuche, filtere und sortiere alle aktiven und pausierten Wix-Angebote.' : 'Durchsuche, filtere und sortiere die letzten Wix-Importe.';
  section.innerHTML = '<h3>' + title + '</h3><p class="stat-meta">' + description + '</p><div class="wix-directory-toolbar" aria-label="' + title + ' filtern und sortieren"><label><span>Suche</span><input type="search" data-directory-search placeholder="Name, ID oder Meldung"></label><label><span>' + (isMappings ? 'Status' : 'Importstatus') + '</span><select data-directory-status><option value="all">Alle Status</option></select></label><label><span>Sortierung</span><select data-directory-sort><option value="primary">' + (isMappings ? 'Name A–Z' : 'Neueste zuerst') + '</option><option value="status">Status</option><option value="secondary">' + (isMappings ? 'Typ' : 'Vorgang') + '</option></select></label><button type="button" class="ghost" data-directory-reset>Filter zurücksetzen</button></div><p class="stat-meta wix-directory-result" data-directory-result aria-live="polite"></p>';
  target.before(section);

  const search = section.querySelector('[data-directory-search]');
  const status = section.querySelector('[data-directory-status]');
  const sort = section.querySelector('[data-directory-sort]');
  const result = section.querySelector('[data-directory-result]');
  let rows = [];

  const readCards = () => Array.from(target.children).filter((element) => element.matches('article.stat-card')).map((card, index) => {
    const paragraphs = Array.from(card.querySelectorAll('p')).map((paragraph) => paragraph.textContent.trim());
    const heading = card.querySelector('h3')?.textContent.trim() || '–';
    if (isMappings) {
      const button = card.querySelector('[data-wix-toggle]');
      const [kind, ...season] = (paragraphs[0] || '').split(' · ');
      return { id: button?.dataset.wixToggle || String(index), primary: heading, secondary: kind, season: season.join(' · ') || '–', detail: paragraphs[1] || '–', offerId: (paragraphs[2] || '').replace(/^Wix-ID:\s*/, ''), status: button?.textContent.includes('pausieren') ? 'Aktiv' : 'Pausiert', button: button?.outerHTML || '' };
    }
    const button = card.querySelector('[data-wix-retry]');
    const [importStatus, ...kindParts] = heading.split(' · ');
    return { id: button?.dataset.wixRetry || String(index), primary: importStatus || '–', secondary: kindParts.join(' · ') || '–', detail: paragraphs[0] || '–', offerId: (paragraphs[1] || '').replace(/^Angebots-ID:\s*/, ''), externalId: (paragraphs[2] || '').replace(/^Buchungs-ID:\s*/, ''), date: paragraphs[3] || '–', status: importStatus || '–', button: button?.outerHTML || '' };
  });

  const syncStatusOptions = () => {
    const selected = status.value || 'all';
    const values = [...new Set(rows.map((row) => row.status).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
    status.innerHTML = '<option value="all">Alle Status</option>' + values.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>').join('');
    status.value = values.includes(selected) ? selected : 'all';
  };

  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase('de');
    let visible = rows.filter((row) => {
      const haystack = Object.values(row).filter((value) => typeof value === 'string').join(' ').toLocaleLowerCase('de');
      return (!query || haystack.includes(query)) && (status.value === 'all' || row.status === status.value);
    });
    visible = visible.slice().sort((a, b) => {
      if (sort.value === 'status') return a.status.localeCompare(b.status, 'de') || a.primary.localeCompare(b.primary, 'de');
      if (sort.value === 'secondary') return a.secondary.localeCompare(b.secondary, 'de') || a.primary.localeCompare(b.primary, 'de');
      return isMappings ? a.primary.localeCompare(b.primary, 'de') : b.date.localeCompare(a.date, 'de');
    });
    result.textContent = visible.length === rows.length ? rows.length + ' Einträge' : visible.length + ' von ' + rows.length + ' Einträgen';
    if (!rows.length) return;
    const head = isMappings ? '<tr><th>Angebot</th><th>Typ</th><th>Season</th><th>Kurse</th><th>Status</th><th>Wix-ID</th><th>Aktion</th></tr>' : '<tr><th>Status</th><th>Vorgang</th><th>Meldung</th><th>Angebots-ID</th><th>Buchungs-ID</th><th>Zeitpunkt</th><th>Aktion</th></tr>';
    const body = visible.length ? visible.map((row) => isMappings ? '<tr><td><strong>' + escapeHtml(row.primary) + '</strong></td><td>' + escapeHtml(row.secondary) + '</td><td>' + escapeHtml(row.season) + '</td><td>' + escapeHtml(row.detail) + '</td><td><span class="status-pill ' + (row.status === 'Aktiv' ? 'status-pill-success' : 'status-pill-warn') + '">' + escapeHtml(row.status) + '</span></td><td><code>' + escapeHtml(row.offerId) + '</code></td><td>' + row.button + '</td></tr>' : '<tr><td><strong>' + escapeHtml(row.primary) + '</strong></td><td>' + escapeHtml(row.secondary) + '</td><td>' + escapeHtml(row.detail) + '</td><td><code>' + escapeHtml(row.offerId) + '</code></td><td><code>' + escapeHtml(row.externalId) + '</code></td><td>' + escapeHtml(row.date) + '</td><td>' + row.button + '</td></tr>').join('') : '<tr><td colspan="7" class="stat-meta">Keine Einträge für diese Filter.</td></tr>';
    target.innerHTML = '<div class="wix-directory-table-wrap"><table class="wix-directory-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  };

  const update = () => {
    const cards = readCards();
    if (!cards.length) {
      if (target.querySelector('.wix-directory-table-wrap')) return;
      rows = [];
      result.textContent = 'Noch keine Einträge.';
      return;
    }
    rows = cards;
    syncStatusOptions();
    draw();
  };

  search.addEventListener('input', draw);
  status.addEventListener('change', draw);
  sort.addEventListener('change', draw);
  section.querySelector('[data-directory-reset]').addEventListener('click', () => { search.value = ''; status.value = 'all'; sort.value = 'primary'; draw(); });
  new MutationObserver(update).observe(target, { childList: true });
  update();
}

function boot() {
  const panel = document.querySelector('#wixPanel');
  const mappings = panel?.querySelector('[data-wix-mappings]');
  const imports = panel?.querySelector('[data-wix-imports]');
  if (!panel || !mappings || !imports || panel.dataset.wixDirectoryReady) return false;
  panel.dataset.wixDirectoryReady = 'true';
  addStyles();
  createDirectory(panel, mappings, 'mappings');
  createDirectory(panel, imports, 'imports');
  return true;
}

if (!boot()) {
  const timer = window.setInterval(() => { if (boot()) window.clearInterval(timer); }, 250);
}
