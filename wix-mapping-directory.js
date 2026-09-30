const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function addStyles() {
  if (document.querySelector('#wix-mapping-directory-styles')) return;
  const style = document.createElement('style');
  style.id = 'wix-mapping-directory-styles';
  style.textContent =     '.wix-mapping-directory{margin-top:28px}.wix-mapping-toolbar{display:grid;grid-template-columns:minmax(180px,1.7fr) repeat(3,minmax(130px,1fr)) auto;gap:10px;align-items:end;margin:16px 0 10px;padding:14px;background:var(--panel-strong);border:1px solid var(--line);border-radius:12px}.wix-mapping-toolbar label{display:grid;gap:6px}.wix-mapping-toolbar label span{color:var(--muted);font-size:.72rem;font-weight:700}.wix-mapping-toolbar button{white-space:nowrap}.wix-mapping-result{margin:0 0 12px}.wix-mapping-table-wrap{overflow-x:auto}.wix-mapping-table{width:100%;min-width:850px;border-collapse:collapse}.wix-mapping-table th,.wix-mapping-table td{padding:14px 16px;vertical-align:middle;border-bottom:1px solid var(--line)}.wix-mapping-table th{text-align:left}.wix-mapping-table td:nth-child(1){min-width:180px}.wix-mapping-table td:nth-child(4){min-width:180px}.wix-mapping-table td:nth-child(6){text-align:right}.wix-mapping-table code{display:inline-block;max-width:190px;overflow:hidden;text-overflow:ellipsis;vertical-align:middle;color:inherit}@media(max-width:980px){.wix-mapping-toolbar{grid-template-columns:repeat(2,minmax(0,1fr))}.wix-mapping-toolbar label:first-child,.wix-mapping-toolbar button{grid-column:1/-1}}';
  document.head.append(style);
}

function init() {
  const panel = document.querySelector('#wixPanel');
  const target = panel?.querySelector('[data-wix-mappings]');
  if (!panel || !target || panel.dataset.wixDirectoryReady) return;
  panel.dataset.wixDirectoryReady = 'true';
  addStyles();

  const section = document.createElement('section');
  section.className = 'wix-mapping-directory';
  section.innerHTML =     '<h3>Gespeicherte Zuordnungen</h3><p class="stat-meta">Durchsuche, filtere und sortiere alle aktiven und pausierten Wix-Angebote.</p><div class="wix-mapping-toolbar" aria-label="Zuordnungen filtern und sortieren"><label><span>Suche</span><input type="search" data-wix-directory-search placeholder="Name oder Wix-ID"></label><label><span>Typ</span><select data-wix-directory-kind><option value="all">Alle Typen</option><option value="season">Season-Pakete</option><option value="single">Einzelbuchungen</option></select></label><label><span>Status</span><select data-wix-directory-status><option value="all">Alle Status</option><option value="active">Aktiv</option><option value="paused">Pausiert</option></select></label><label><span>Sortierung</span><select data-wix-directory-sort><option value="label">Name A–Z</option><option value="type">Typ</option><option value="status">Status</option></select></label><button type="button" class="ghost" data-wix-directory-reset>Filter zurücksetzen</button></div><p class="stat-meta wix-mapping-result" data-wix-directory-result aria-live="polite"></p>';
  target.before(section);

  const search = section.querySelector('[data-wix-directory-search]');
  const kind = section.querySelector('[data-wix-directory-kind]');
  const status = section.querySelector('[data-wix-directory-status]');
  const sort = section.querySelector('[data-wix-directory-sort]');
  const result = section.querySelector('[data-wix-directory-result]');
  let mappings = [];

  const readMappings = () => Array.from(target.children).filter((element) => element.matches('article.stat-card')).map((card, index) => {
    const paragraphs = Array.from(card.querySelectorAll('p')).map((paragraph) => paragraph.textContent.trim());
    const button = card.querySelector('[data-wix-toggle]');
    const detail = paragraphs[0] || '';
    const [type, ...seasonParts] = detail.split(' · ');
    return { id: button?.dataset.wixToggle || String(index), label: card.querySelector('h3')?.textContent.trim() || 'Ohne Bezeichnung', type, season: seasonParts.join(' · '), courses: paragraphs[1] || '–', offerId: (paragraphs[2] || '').replace(/^Wix-ID:\s*/, ''), active: button?.textContent.includes('pausieren') || false };
  });

  const paint = () => {
    const needle = search.value.trim().toLowerCase();
    const rows = mappings.filter((mapping) => {
      const searchText = [mapping.label, mapping.type, mapping.season, mapping.courses, mapping.offerId].join(' ').toLowerCase();
      return (!needle || searchText.includes(needle))
        && (kind.value === 'all' || (kind.value === 'season' ? mapping.type.includes('Season') : !mapping.type.includes('Season')))
        && (status.value === 'all' || (status.value === 'active' ? mapping.active : !mapping.active));
    }).sort((left, right) => {
      if (sort.value === 'type') return left.type.localeCompare(right.type, 'de') || left.label.localeCompare(right.label, 'de');
      if (sort.value === 'status') return Number(right.active) - Number(left.active) || left.label.localeCompare(right.label, 'de');
      return left.label.localeCompare(right.label, 'de');
    });
    result.textContent = mappings.length ?       rows.length + ' von ' + mappings.length + ' Zuordnungen angezeigt.' : '';
    target.innerHTML = rows.length ?       '<div class="table-wrap wix-mapping-table-wrap"><table class="wix-mapping-table"><thead><tr><th>Angebot</th><th>Typ</th><th>Season</th><th>Kurse</th><th>Status</th><th>Wix-ID</th><th>Aktion</th></tr></thead><tbody>' + rows.map((mapping) =>         '<tr><td><strong>' + escapeHtml(mapping.label) + '</strong></td><td>' + escapeHtml(mapping.type) + '</td><td>' + escapeHtml(mapping.season || '–') + '</td><td>' + escapeHtml(mapping.courses) + '</td><td><span class="status-pill ' + (mapping.active ? 'status-pill-success' : 'status-pill-warn') + '">' + (mapping.active ? 'Aktiv' : 'Pausiert') + '</span></td><td><code>' + escapeHtml(mapping.offerId) + '</code></td><td><button type="button" class="ghost" data-wix-toggle="' + escapeHtml(mapping.id) + '">' + (mapping.active ? 'Pausieren' : 'Aktivieren') + '</button></td></tr>'
      ).join('') + '</tbody></table></div>' : '<div class="empty-state"><p>Keine Zuordnung entspricht den gewählten Filtern.</p></div>';
  };

  const refresh = () => {
    if (target.querySelector('.wix-mapping-table')) return;
    const cards = readMappings();
    if (!cards.length) return;
    mappings = cards;
    paint();
  };

  [search, kind, status, sort].forEach((control) => control.addEventListener(control === search ? 'input' : 'change', paint));
  section.querySelector('[data-wix-directory-reset]').addEventListener('click', () => {
    search.value = ''; kind.value = 'all'; status.value = 'all'; sort.value = 'label'; paint();
  });
  new MutationObserver(refresh).observe(target, { childList: true });
  refresh();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
