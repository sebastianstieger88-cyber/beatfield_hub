const NOTION_VERSION = "2022-06-28";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Nur POST ist erlaubt." });
  }

  const {
    NOTION_TOKEN,
    NOTION_WARMUP_DATABASE_ID,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    NOTION_WARMUP_TITLE_FIELD,
    NOTION_WARMUP_CATEGORY_FIELD,
    NOTION_WARMUP_FOCUS_FIELD,
    NOTION_WARMUP_LEVEL_FIELD,
    NOTION_WARMUP_EQUIPMENT_FIELD,
    NOTION_WARMUP_COACHING_FIELD,
    NOTION_WARMUP_DESCRIPTION_FIELD,
    NOTION_WARMUP_VIDEO_FIELD,
    NOTION_WARMUP_SOURCE_FIELD,
    NOTION_WARMUP_TAGS_FIELD,
  } = process.env;

  const notionDatabaseId = normalizeNotionDatabaseId(NOTION_WARMUP_DATABASE_ID);

  if (!NOTION_TOKEN || !notionDatabaseId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: "Fuer den Warm-Up-Sync fehlen noch Umgebungsvariablen in Vercel.",
    });
  }

  try {
    const accessToken = getBearerToken(req.headers.authorization);
    if (!accessToken) {
      return res.status(401).json({ error: "Kein gueltiger Login-Token uebergeben." });
    }

    const user = await getSupabaseUser(SUPABASE_URL, SUPABASE_ANON_KEY, accessToken);
    const profile = await getSupabaseProfile(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id);
    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Nur Admins duerfen den Notion-Sync ausloesen." });
    }

    const pages = await fetchAllNotionPages(NOTION_TOKEN, notionDatabaseId);
    const fieldMap = {
      title: splitFieldNames(NOTION_WARMUP_TITLE_FIELD, ["Warm-Up", "Warmup", "Name", "Titel"]),
      category: splitFieldNames(NOTION_WARMUP_CATEGORY_FIELD, ["Kategorie", "Category", "Typ", "Uebungstyp"]),
      focus: splitFieldNames(NOTION_WARMUP_FOCUS_FIELD, ["Fokus", "Focus", "Intensitaet"]),
      level: splitFieldNames(NOTION_WARMUP_LEVEL_FIELD, ["Level", "Niveau", "Stufe", "Dauer (Min)"]),
      equipment: splitFieldNames(NOTION_WARMUP_EQUIPMENT_FIELD, ["Equipment", "Geraet", "Material", "Ausruestung"]),
      coaching: splitFieldNames(NOTION_WARMUP_COACHING_FIELD, ["Coaching", "Coaching Cues", "Hinweise", "Cues"]),
      description: splitFieldNames(NOTION_WARMUP_DESCRIPTION_FIELD, ["Beschreibung", "Description", "Details", "Notizen"]),
      video: splitFieldNames(NOTION_WARMUP_VIDEO_FIELD, ["Video", "Video URL", "Video-Link", "Video Link"]),
      source: splitFieldNames(NOTION_WARMUP_SOURCE_FIELD, ["Link", "URL", "Quelle", "Source"]),
      tags: splitFieldNames(NOTION_WARMUP_TAGS_FIELD, ["Tags", "Schlagwoerter"]),
    };

    const nowIso = new Date().toISOString();
    const warmups = pages
      .map((page) => mapNotionPageToWarmup(page, fieldMap, nowIso))
      .filter((warmup) => warmup.title);

    const existingPageIds = await fetchExistingWarmupPageIds(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (warmups.length) {
      await upsertWarmups(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, warmups);
    }

    await archiveMissingWarmups(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      existingPageIds,
      warmups.map((warmup) => warmup.notion_page_id),
      nowIso,
    );

    return res.status(200).json({
      synced: warmups.length,
      message: `${warmups.length} Warm-Ups wurden mit Notion synchronisiert.`,
    });
  } catch (error) {
    console.error("Warmup sync failed", error);
    return res.status(500).json({
      error: error.message || "Der Warm-Up-Sync ist fehlgeschlagen.",
    });
  }
}

function getBearerToken(headerValue) {
  const value = String(headerValue || "");
  if (!value.startsWith("Bearer ")) {
    return null;
  }
  return value.slice(7).trim() || null;
}

async function getSupabaseUser(supabaseUrl, anonKey, accessToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Der Supabase-Login konnte fuer den Warm-Up-Sync nicht verifiziert werden (${response.status}): ${payload || response.statusText}`);
  }

  return response.json();
}

async function getSupabaseProfile(supabaseUrl, serviceRoleKey, userId) {
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,role,full_name`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Das Profil fuer den Warm-Up-Sync konnte nicht geladen werden.");
  }

  const profiles = await response.json();
  return profiles[0] || null;
}

async function fetchAllNotionPages(notionToken, databaseId) {
  const pages = [];
  let cursor = null;

  do {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(buildRemoteServiceError("Notion-Datenbank", response.status, payload, maskIdentifier(databaseId)));
    }

    const payload = await response.json();
    pages.push(...(payload.results || []));
    cursor = payload.has_more ? payload.next_cursor : null;
  } while (cursor);

  return pages;
}

function normalizeNotionDatabaseId(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }

  const urlMatch = value.match(/[0-9a-fA-F]{32}(?=\\?|$)/);
  if (urlMatch) {
    return urlMatch[0];
  }

  const compact = value.replace(/-/g, "");
  if (/^[0-9a-fA-F]{32}$/.test(compact)) {
    return compact;
  }

  return value;
}

function maskIdentifier(value) {
  const raw = String(value || "");
  if (raw.length <= 8) {
    return raw || "leer";
  }
  return `${raw.slice(0, 4)}...${raw.slice(-4)}`;
}

function splitFieldNames(customValue, defaults) {
  const custom = String(customValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return custom.length ? custom : defaults;
}

function mapNotionPageToWarmup(page, fieldMap, nowIso) {
  const properties = page.properties || {};
  const titleProperty = findProperty(properties, fieldMap.title) || findFirstPropertyByType(properties, "title");
  const title = getPropertyText(titleProperty).trim();

  return {
    notion_page_id: page.id,
    title: title || "Ohne Titel",
    category: getPropertyText(findProperty(properties, fieldMap.category)) || null,
    focus: getPropertyText(findProperty(properties, fieldMap.focus)) || null,
    level: getPropertyText(findProperty(properties, fieldMap.level)) || null,
    equipment: getPropertyText(findProperty(properties, fieldMap.equipment)) || null,
    coaching_cues: getPropertyText(findProperty(properties, fieldMap.coaching)) || null,
    description: getPropertyText(findProperty(properties, fieldMap.description)) || null,
    video_url: getPropertyUrl(findProperty(properties, fieldMap.video)) || null,
    source_url: getPropertyUrl(findProperty(properties, fieldMap.source)) || page.url || null,
    tags: getPropertyArray(findProperty(properties, fieldMap.tags)),
    notion_last_edited_at: page.last_edited_time || null,
    notion_archived: Boolean(page.archived || page.in_trash),
    sync_source: "notion",
    raw_properties: properties,
    synced_at: nowIso,
  };
}

function findProperty(properties, candidateNames) {
  const entries = Object.entries(properties || {});
  for (const candidate of candidateNames) {
    const match = entries.find(([name]) => name.toLowerCase() === String(candidate).toLowerCase());
    if (match) {
      return match[1];
    }
  }
  return null;
}

function findFirstPropertyByType(properties, targetType) {
  const entry = Object.values(properties || {}).find((property) => property?.type === targetType);
  return entry || null;
}

function getPropertyText(property) {
  if (!property) {
    return "";
  }

  switch (property.type) {
    case "title":
      return joinRichText(property.title);
    case "rich_text":
      return joinRichText(property.rich_text);
    case "select":
      return property.select?.name || "";
    case "multi_select":
      return (property.multi_select || []).map((item) => item.name).join(", ");
    case "status":
      return property.status?.name || "";
    case "number":
      return property.number === null || property.number === undefined ? "" : String(property.number);
    case "url":
      return property.url || "";
    case "people":
      return (property.people || []).map((person) => person.name || person.id).join(", ");
    case "relation":
      return (property.relation || []).map((relation) => relation.id).join(", ");
    case "checkbox":
      return property.checkbox ? "Ja" : "Nein";
    default:
      return "";
  }
}

function getPropertyUrl(property) {
  if (!property) {
    return "";
  }

  if (property.type === "url") {
    return property.url || "";
  }

  const text = getPropertyText(property).trim();
  return /^https?:\\/\\//i.test(text) ? text : "";
}

function getPropertyArray(property) {
  if (!property) {
    return [];
  }

  if (property.type === "multi_select") {
    return (property.multi_select || []).map((item) => item.name).filter(Boolean);
  }

  const text = getPropertyText(property);
  return text
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function joinRichText(items) {
  return (items || [])
    .map((item) => item?.plain_text || "")
    .join("")
    .trim();
}

async function fetchExistingWarmupPageIds(supabaseUrl, serviceRoleKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/warmup_library?select=notion_page_id&sync_source=eq.notion`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Bestehende Warm-Ups konnten nicht aus Supabase geladen werden.");
  }

  const rows = await response.json();
  return (rows || []).map((row) => row.notion_page_id).filter(Boolean);
}

async function archiveMissingWarmups(supabaseUrl, serviceRoleKey, existingPageIds, syncedPageIds, syncedAt) {
  const syncedSet = new Set((syncedPageIds || []).filter(Boolean));
  const missingPageIds = (existingPageIds || []).filter((pageId) => !syncedSet.has(pageId));

  if (!missingPageIds.length) {
    return;
  }

  const inFilter = missingPageIds.map((pageId) => `"${pageId}"`).join(",");
  const response = await fetch(`${supabaseUrl}/rest/v1/warmup_library?notion_page_id=in.(${encodeURIComponent(inFilter)})`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      notion_archived: true,
      synced_at: syncedAt,
    }),
  });

  if (!response.ok) {
    throw new Error("Nicht mehr vorhandene Warm-Ups konnten nicht archiviert werden.");
  }
}

async function upsertWarmups(supabaseUrl, serviceRoleKey, warmups) {
  const response = await fetch(`${supabaseUrl}/rest/v1/warmup_library?on_conflict=notion_page_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(warmups),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Supabase-Sync: ${payload || response.statusText}`);
  }
}

function buildRemoteServiceError(label, status, payload, identifier) {
  const normalizedPayload = String(payload || "").trim();
  if (status === 502 || status === 503 || status === 504) {
    return `${label} ist gerade voruebergehend nicht erreichbar (${status}, ${identifier}). Bitte in ein paar Minuten erneut versuchen.`;
  }
  return `${label} konnte nicht geladen werden (${identifier}): ${normalizedPayload || `Status ${status}`}`;
}
