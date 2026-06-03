const NOTION_VERSION = "2022-06-28";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Nur POST ist erlaubt." });
  }

  const {
    NOTION_TOKEN,
    NOTION_EXERCISE_DATABASE_ID,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    NOTION_EXERCISE_TITLE_FIELD,
    NOTION_EXERCISE_BODY_REGION_FIELD,
    NOTION_EXERCISE_MOVEMENT_FAMILY_FIELD,
    NOTION_EXERCISE_MOVEMENT_PATTERNS_FIELD,
    NOTION_EXERCISE_MUSCLE_GROUPS_FIELD,
    NOTION_EXERCISE_LOAD_PROFILE_FIELD,
    NOTION_EXERCISE_COACHABILITY_FIELD,
    NOTION_EXERCISE_USAGE_CONTEXT_FIELD,
    NOTION_EXERCISE_FAVORITE_FIELD,
    NOTION_EXERCISE_JOINT_LOAD_FIELD,
    NOTION_EXERCISE_TESTED_FIELD,
    NOTION_EXERCISE_EASIER_VARIANT_FIELD,
    NOTION_EXERCISE_HARDER_VARIANT_FIELD,
    NOTION_EXERCISE_DIFFICULTY_FIELD,
    NOTION_EXERCISE_SETUP_EFFORT_FIELD,
    NOTION_EXERCISE_CONTRAINDICATIONS_FIELD,
    NOTION_EXERCISE_OUTDOOR_FIELD,
    NOTION_EXERCISE_CATEGORY_FIELD,
    NOTION_EXERCISE_FOCUS_FIELD,
    NOTION_EXERCISE_LEVEL_FIELD,
    NOTION_EXERCISE_EQUIPMENT_FIELD,
    NOTION_EXERCISE_COACHING_FIELD,
    NOTION_EXERCISE_TECHNIQUE_FIELD,
    NOTION_EXERCISE_PROGRESSION_FIELD,
    NOTION_EXERCISE_REGRESSION_FIELD,
    NOTION_EXERCISE_COMMON_ERRORS_FIELD,
    NOTION_EXERCISE_CORRECTION_FIELD,
    NOTION_EXERCISE_VARIANTS_FIELD,
    NOTION_EXERCISE_DESCRIPTION_FIELD,
    NOTION_EXERCISE_VIDEO_FIELD,
    NOTION_EXERCISE_SOURCE_FIELD,
    NOTION_EXERCISE_TAGS_FIELD,
  } = process.env;

  const notionDatabaseId = normalizeNotionDatabaseId(NOTION_EXERCISE_DATABASE_ID);

  if (!NOTION_TOKEN || !notionDatabaseId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return res.status(500).json({
      error: "Fuer den Uebungs-Sync fehlen noch Umgebungsvariablen in Vercel.",
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
      title: splitFieldNames(NOTION_EXERCISE_TITLE_FIELD, ["Uebung", "Exercise", "Name", "Titel"]),
      bodyRegion: splitFieldNames(NOTION_EXERCISE_BODY_REGION_FIELD, ["Koerperbereich", "Körperbereich", "Body Region"]),
      movementFamily: splitFieldNames(NOTION_EXERCISE_MOVEMENT_FAMILY_FIELD, ["Bewegungsmuster", "Movement Pattern"]),
      movementPatterns: splitFieldNames(NOTION_EXERCISE_MOVEMENT_PATTERNS_FIELD, ["Bewegungsmuster ", "Movement Patterns", "Patterns"]),
      muscleGroups: splitFieldNames(NOTION_EXERCISE_MUSCLE_GROUPS_FIELD, ["Muskelgruppe", "Muscle Group"]),
      loadProfile: splitFieldNames(NOTION_EXERCISE_LOAD_PROFILE_FIELD, ["Belastung", "Load Profile"]),
      coachability: splitFieldNames(NOTION_EXERCISE_COACHABILITY_FIELD, ["Coachbarkeit", "Coachability"]),
      usageContext: splitFieldNames(NOTION_EXERCISE_USAGE_CONTEXT_FIELD, ["Einsatzbereich", "Usage Context"]),
      notionFavorite: splitFieldNames(NOTION_EXERCISE_FAVORITE_FIELD, ["Favorit", "Favorite"]),
      jointLoad: splitFieldNames(NOTION_EXERCISE_JOINT_LOAD_FIELD, ["Gelenkbelastung", "Joint Load"]),
      tested: splitFieldNames(NOTION_EXERCISE_TESTED_FIELD, ["Getestet", "Tested"]),
      easierVariant: splitFieldNames(NOTION_EXERCISE_EASIER_VARIANT_FIELD, ["Leichtere Variante", "Easier Variant"]),
      harderVariant: splitFieldNames(NOTION_EXERCISE_HARDER_VARIANT_FIELD, ["Schwerere Variante", "Harder Variant"]),
      difficulty: splitFieldNames(NOTION_EXERCISE_DIFFICULTY_FIELD, ["Schwierigkeit", "Difficulty"]),
      setupEffort: splitFieldNames(NOTION_EXERCISE_SETUP_EFFORT_FIELD, ["Setup-Aufwand", "Setup Aufwand", "Setup Effort"]),
      contraindications: splitFieldNames(NOTION_EXERCISE_CONTRAINDICATIONS_FIELD, ["Nicht geeignet bei", "Contraindications"]),
      outdoor: splitFieldNames(NOTION_EXERCISE_OUTDOOR_FIELD, ["Outdoor-Fit", "Outdoor Fit", "Outdoor"]),
      category: splitFieldNames(NOTION_EXERCISE_CATEGORY_FIELD, ["Kategorie", "Category", "Typ"]),
      focus: splitFieldNames(NOTION_EXERCISE_FOCUS_FIELD, ["Fokus", "Focus", "Ziel", "Muskelgruppe", "Bereich"]),
      level: splitFieldNames(NOTION_EXERCISE_LEVEL_FIELD, ["Level", "Niveau", "Stufe"]),
      equipment: splitFieldNames(NOTION_EXERCISE_EQUIPMENT_FIELD, ["Equipment", "Geraet", "Gerät", "Material", "Ausrüstung", "Ausruestung"]),
      coaching: splitFieldNames(NOTION_EXERCISE_COACHING_FIELD, ["Coach-Cues", "Coaching", "Coaching Cues", "Hinweise", "Cues"]),
      technique: splitFieldNames(NOTION_EXERCISE_TECHNIQUE_FIELD, ["Technik Cues", "Technik-Cues", "Technique Cues"]),
      progression: splitFieldNames(NOTION_EXERCISE_PROGRESSION_FIELD, ["Progression"]),
      regression: splitFieldNames(NOTION_EXERCISE_REGRESSION_FIELD, ["Regression"]),
      commonErrors: splitFieldNames(NOTION_EXERCISE_COMMON_ERRORS_FIELD, ["Haeufige Fehler", "Häufige Fehler", "Common Errors"]),
      correction: splitFieldNames(NOTION_EXERCISE_CORRECTION_FIELD, ["Korrektur-Cues", "Korrektur", "Correction"]),
      variants: splitFieldNames(NOTION_EXERCISE_VARIANTS_FIELD, ["Varianten", "Variants"]),
      description: splitFieldNames(NOTION_EXERCISE_DESCRIPTION_FIELD, ["Text", "Beschreibung", "Description", "Details", "Notizen"]),
      video: splitFieldNames(NOTION_EXERCISE_VIDEO_FIELD, ["Video", "Video URL", "Video-Link", "Video Link"]),
      source: splitFieldNames(NOTION_EXERCISE_SOURCE_FIELD, ["Link", "URL", "Quelle", "Source"]),
      tags: splitFieldNames(NOTION_EXERCISE_TAGS_FIELD, ["Tags", "Schlagwoerter", "Schlagwörter"]),
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
      message: `${exercises.length} Uebungen wurden mit Notion synchronisiert.`,
    });
  } catch (error) {
    console.error("Exercise sync failed", error);
    return res.status(500).json({
      error: error.message || "Der Uebungs-Sync ist fehlgeschlagen.",
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
    throw new Error(`Der Supabase-Login konnte fuer den Uebungs-Sync nicht verifiziert werden (${response.status}): ${payload || response.statusText}`);
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
    throw new Error("Das Profil fuer den Uebungs-Sync konnte nicht geladen werden.");
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

  const urlMatch = value.match(/[0-9a-fA-F]{32}(?=\?|$)/);
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

function mapNotionPageToExercise(page, fieldMap, nowIso) {
  const properties = page.properties || {};
  const titleProperty = findProperty(properties, fieldMap.title) || findFirstPropertyByType(properties, "title");
  const title = getPropertyText(titleProperty).trim();
  const bodyRegions = getPropertyArray(findPropertyWithTypes(properties, fieldMap.bodyRegion, ["multi_select", "select"]));
  const movementPatterns = getPropertyArray(
    findPropertyWithTypes(properties, fieldMap.movementPatterns, ["multi_select"])
      || findPropertyWithTypes(properties, fieldMap.focus, ["multi_select"])
  );
  const movementFamily = getPropertyText(
    findPropertyWithTypes(properties, fieldMap.movementFamily, ["select"])
      || findPropertyWithTypes(properties, fieldMap.focus, ["select"])
  ).trim() || null;
  const muscleGroups = getPropertyArray(findPropertyWithTypes(properties, fieldMap.muscleGroups, ["multi_select", "select"]));
  const loadProfile = getPropertyArray(findPropertyWithTypes(properties, fieldMap.loadProfile, ["multi_select", "select"]));
  const usageContext = getPropertyArray(findPropertyWithTypes(properties, fieldMap.usageContext, ["multi_select", "select"]));
  const jointLoad = getPropertyArray(findPropertyWithTypes(properties, fieldMap.jointLoad, ["multi_select", "select"]));
  const contraindications = getPropertyArray(findPropertyWithTypes(properties, fieldMap.contraindications, ["multi_select", "select"]));
  const outdoorFit = getPropertyArray(findPropertyWithTypes(properties, fieldMap.outdoor, ["multi_select", "select"]));
  const equipmentItems = getPropertyArray(findPropertyWithTypes(properties, fieldMap.equipment, ["multi_select", "select"]));
  const category = bodyRegions.join(", ") || getPropertyText(findProperty(properties, fieldMap.category)) || null;
  const focus = movementPatterns.join(", ") || movementFamily || getPropertyText(findProperty(properties, fieldMap.focus)) || null;
  const level = muscleGroups.join(", ") || getPropertyText(findProperty(properties, fieldMap.level)) || null;

  return {
    notion_page_id: page.id,
    title: title || "Ohne Titel",
    body_regions: bodyRegions,
    movement_family: movementFamily,
    movement_patterns: movementPatterns,
    muscle_groups: muscleGroups,
    load_profile: loadProfile,
    coachability: getPropertyText(findProperty(properties, fieldMap.coachability)) || null,
    usage_context: usageContext,
    notion_favorite: getPropertyBoolean(findProperty(properties, fieldMap.notionFavorite)),
    joint_load: jointLoad,
    tested: getPropertyBoolean(findProperty(properties, fieldMap.tested)),
    easier_variant: getPropertyText(findProperty(properties, fieldMap.easierVariant)) || null,
    harder_variant: getPropertyText(findProperty(properties, fieldMap.harderVariant)) || null,
    difficulty: getPropertyText(findProperty(properties, fieldMap.difficulty)) || null,
    setup_effort: getPropertyText(findProperty(properties, fieldMap.setupEffort)) || null,
    contraindications,
    outdoor_fit: outdoorFit,
    category,
    focus,
    level,
    equipment: equipmentItems.join(", ") || null,
    equipment_items: equipmentItems,
    coaching_cues: getPropertyText(findProperty(properties, fieldMap.coaching)) || null,
    technique_cues: getPropertyText(findProperty(properties, fieldMap.technique)) || null,
    progression: getPropertyText(findProperty(properties, fieldMap.progression)) || null,
    regression: getPropertyText(findProperty(properties, fieldMap.regression)) || null,
    common_errors: getPropertyText(findProperty(properties, fieldMap.commonErrors)) || null,
    correction: getPropertyText(findProperty(properties, fieldMap.correction)) || null,
    variants: getPropertyText(findProperty(properties, fieldMap.variants)) || null,
    description: getPropertyText(findProperty(properties, fieldMap.description)) || null,
    video_url: getPropertyUrl(findProperty(properties, fieldMap.video)) || null,
    source_url: getPropertyUrl(findProperty(properties, fieldMap.source)) || page.url || null,
    tags: mergeTags(getPropertyArray(findProperty(properties, fieldMap.tags)), loadProfile, usageContext, outdoorFit),
    notion_last_edited_at: page.last_edited_time || null,
    notion_archived: Boolean(page.archived || page.in_trash),
    sync_source: "notion",
    raw_properties: properties,
    synced_at: nowIso,
  };
}

function findProperty(properties, candidateNames) {
  const entries = Object.entries(properties || {});
  for (const candidate of candidateNames || []) {
    const normalizedCandidate = String(candidate).trim().toLowerCase();
    const match = entries.find(([name]) => String(name).trim().toLowerCase() === normalizedCandidate);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function findPropertyWithTypes(properties, candidateNames, types) {
  const entries = Object.entries(properties || {});
  const normalizedTypes = Array.isArray(types) ? types : [];

  for (const candidate of candidateNames || []) {
    const normalizedCandidate = String(candidate).trim().toLowerCase();
    const match = entries.find(([name, property]) => {
      if (String(name).trim().toLowerCase() !== normalizedCandidate) {
        return false;
      }
      if (!normalizedTypes.length) {
        return true;
      }
      return normalizedTypes.includes(property?.type);
    });
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

function getPropertyBoolean(property) {
  if (!property) {
    return false;
  }

  if (property.type === "checkbox") {
    return Boolean(property.checkbox);
  }

  const value = getPropertyText(property).trim().toLowerCase();
  return ["ja", "yes", "true", "1", "x"].includes(value);
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

function mergeTags(...tagGroups) {
  return Array.from(
    new Set(
      tagGroups
        .flat()
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
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
    throw new Error(buildRemoteServiceError("Supabase-Uebungen", response.status, payload));
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
      throw new Error(buildRemoteServiceError("Uebungsarchiv", response.status, payload));
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
    throw new Error(buildRemoteServiceError("Supabase-Sync", response.status, payload));
  }
}

function buildRemoteServiceError(label, status, payload, context = "") {
  const raw = String(payload || "").trim();
  const prefix = context ? `${label} (${context})` : label;

  if (!raw) {
    return `${prefix} Fehler ${status}`;
  }

  try {
    const parsed = JSON.parse(raw);
    const message = parsed?.message || parsed?.error_description || parsed?.error || raw;
    return `${prefix}: ${message}`;
  } catch (error) {
    return `${prefix}: ${raw}`;
  }
}
