const NOTION_VERSION = "2022-06-28";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Nur POST ist erlaubt." });
  }

  const {
    NOTION_TOKEN,
    NOTION_EXERCISE_DATABASE_ID,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    NOTION_EXERCISE_TITLE_FIELD,
    NOTION_EXERCISE_CATEGORY_FIELD,
    NOTION_EXERCISE_FOCUS_FIELD,
    NOTION_EXERCISE_LEVEL_FIELD,
    NOTION_EXERCISE_EQUIPMENT_FIELD,
    NOTION_EXERCISE_COACHING_FIELD,
    NOTION_EXERCISE_DESCRIPTION_FIELD,
    NOTION_EXERCISE_VIDEO_FIELD,
    NOTION_EXERCISE_SOURCE_FIELD,
    NOTION_EXERCISE_TAGS_FIELD,
  } = process.env;

  if (!NOTION_TOKEN || !NOTION_EXERCISE_DATABASE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: "Für den Übungs-Sync fehlen noch Umgebungsvariablen in Vercel.",
    });
  }

  try {
    const accessToken = getBearerToken(req.headers.authorization);
    if (!accessToken) {
      return res.status(401).json({ error: "Kein gültiger Login-Token übergeben." });
    }

    const user = await getSupabaseUser(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, accessToken);
    const profile = await getSupabaseProfile(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, user.id);
    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Nur Admins dürfen den Notion-Sync auslösen." });
    }

    const pages = await fetchAllNotionPages(NOTION_TOKEN, NOTION_EXERCISE_DATABASE_ID);
    const fieldMap = {
      title: splitFieldNames(NOTION_EXERCISE_TITLE_FIELD, ["Übung", "Uebung", "Exercise", "Name", "Titel"]),
      category: splitFieldNames(NOTION_EXERCISE_CATEGORY_FIELD, ["Kategorie", "Category", "Typ"]),
      focus: splitFieldNames(NOTION_EXERCISE_FOCUS_FIELD, ["Fokus", "Focus", "Ziel", "Muskelgruppe", "Bereich"]),
      level: splitFieldNames(NOTION_EXERCISE_LEVEL_FIELD, ["Level", "Niveau", "Stufe"]),
      equipment: splitFieldNames(NOTION_EXERCISE_EQUIPMENT_FIELD, ["Equipment", "Gerät", "Geraet", "Material"]),
      coaching: splitFieldNames(NOTION_EXERCISE_COACHING_FIELD, ["Coaching", "Coaching Cues", "Hinweise", "Cues"]),
      description: splitFieldNames(NOTION_EXERCISE_DESCRIPTION_FIELD, ["Beschreibung", "Description", "Details", "Notizen"]),
      video: splitFieldNames(NOTION_EXERCISE_VIDEO_FIELD, ["Video", "Video URL", "Video-Link", "Video Link"]),
      source: splitFieldNames(NOTION_EXERCISE_SOURCE_FIELD, ["Link", "URL", "Quelle", "Source"]),
      tags: splitFieldNames(NOTION_EXERCISE_TAGS_FIELD, ["Tags", "Schlagwörter", "Schlagwoerter"]),
    };

    const nowIso = new Date().toISOString();
    const exercises = pages
      .map((page) => mapNotionPageToExercise(page, fieldMap, nowIso))
      .filter((exercise) => exercise.title);

    const existingPageIds = await fetchExistingExercisePageIds(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (exercises.length) {
      await upsertExercises(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, exercises);
    }
    await archiveMissingExercises(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      existingPageIds,
      exercises.map((exercise) => exercise.notion_page_id),
      nowIso,
    );

    return res.status(200).json({
      synced: exercises.length,
      message: `${exercises.length} Übungen wurden mit Notion synchronisiert.`,
    });
  } catch (error) {
    console.error("Exercise sync failed", error);
    return res.status(500).json({
      error: error.message || "Der Übungs-Sync ist fehlgeschlagen.",
    });
  }
};

function getBearerToken(headerValue) {
  const value = String(headerValue || "");
  if (!value.startsWith("Bearer ")) {
    return null;
  }
  return value.slice(7).trim() || null;
}

async function getSupabaseUser(supabaseUrl, serviceRoleKey, accessToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Der Supabase-Login konnte für den Übungs-Sync nicht verifiziert werden.");
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
    throw new Error("Das Profil für den Übungs-Sync konnte nicht geladen werden.");
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
      throw new Error(`Notion-Datenbank konnte nicht geladen werden: ${payload}`);
    }

    const payload = await response.json();
    pages.push(...(payload.results || []));
    cursor = payload.has_more ? payload.next_cursor : null;
  } while (cursor);

  return pages;
}

function splitFieldNames(customValue, defaults) {
  const custom = String(customValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return custom.length ? custom : defaults;
}

function mapNotionPageToExercise(page, fieldMap, nowIso) {
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
      return (property.multi_select || []).map((entry) => entry.name).join(", ");
    case "status":
      return property.status?.name || "";
    case "url":
      return property.url || "";
    case "email":
      return property.email || "";
    case "phone_number":
      return property.phone_number || "";
    case "number":
      return property.number === null || property.number === undefined ? "" : String(property.number);
    case "checkbox":
      return property.checkbox ? "Ja" : "Nein";
    case "date":
      return property.date?.start || "";
    default:
      return "";
  }
}

function getPropertyArray(property) {
  if (!property) {
    return [];
  }

  if (property.type === "multi_select") {
    return (property.multi_select || []).map((entry) => entry.name).filter(Boolean);
  }

  const value = getPropertyText(property);
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getPropertyUrl(property) {
  if (!property) {
    return "";
  }

  if (property.type === "url") {
    return property.url || "";
  }

  const textValue = getPropertyText(property).trim();
  if (/^https?:\/\//i.test(textValue)) {
    return textValue;
  }

  return "";
}

function joinRichText(items) {
  return (items || [])
    .map((item) => item?.plain_text || "")
    .join("")
    .trim();
}

async function fetchExistingExercisePageIds(supabaseUrl, serviceRoleKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/exercise_library?select=notion_page_id&sync_source=eq.notion`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Bestehende Übungen konnten nicht geladen werden: ${payload}`);
  }

  const rows = await response.json();
  return rows.map((row) => row.notion_page_id).filter(Boolean);
}

async function archiveMissingExercises(supabaseUrl, serviceRoleKey, existingPageIds, syncedPageIds, syncedAt) {
  const missingIds = (existingPageIds || []).filter((pageId) => !(syncedPageIds || []).includes(pageId));
  if (!missingIds.length) {
    return;
  }

  const chunks = [];
  for (let index = 0; index < missingIds.length; index += 50) {
    chunks.push(missingIds.slice(index, index + 50));
  }

  for (const chunk of chunks) {
    const inFilter = chunk.map((value) => `"${String(value).replace(/"/g, '\\"')}"`).join(",");
    const response = await fetch(`${supabaseUrl}/rest/v1/exercise_library?notion_page_id=in.(${encodeURIComponent(inFilter)})`, {
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
      const payload = await response.text();
      throw new Error(`Nicht mehr vorhandene Übungen konnten nicht archiviert werden: ${payload}`);
    }
  }
}

async function upsertExercises(supabaseUrl, serviceRoleKey, exercises) {
  const response = await fetch(`${supabaseUrl}/rest/v1/exercise_library?on_conflict=notion_page_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(exercises),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Übungen konnten nicht in Supabase synchronisiert werden: ${payload}`);
  }
}
