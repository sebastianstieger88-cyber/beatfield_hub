import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.APP_CONFIG || {};
const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.siteUrl);
const ENABLE_OFFLINE_MODE = false;
const OFFLINE_CACHE_KEY = "beatfield-offline-cache-v2";
const OFFLINE_QUEUE_KEY = "beatfield-offline-queue-v2";

const state = {
  supabase: null,
  session: null,
  profile: null,
  courses: [],
  seasons: [],
  seasonDraftDates: [],
  seasonBookings: [],
  sessionOverrides: [],
  trainers: [],
  trainerDirectory: [],
  invites: [],
  participants: [],
  trialRequests: [],
  dropInBookings: [],
  sessions: [],
  records: [],
  beatOutEntries: [],
  selectedCourseId: null,
  selectedSeasonId: null,
  attendanceSeasonId: null,
  seasonFilter: "all",
  activeSection: null,
  editingBookingId: null,
  moveParticipantContext: null,
  selectedParticipantId: null,
  participantSearch: "",
  isOffline: !navigator.onLine,
  pendingActions: loadOfflineQueue(),
  optimisticVisibilityUntil: {
    courses: 0,
    trainerDirectory: 0,
    invites: 0,
    seasonBookings: 0,
    participants: 0,
    records: 0,
    beatOutEntries: 0,
  },
  acceptEmptyFetch: {
    courses: false,
    trainerDirectory: false,
    invites: false,
    seasonBookings: false,
    participants: false,
    records: false,
    beatOutEntries: false,
  },
};

const setupNotice = document.querySelector("#setupNotice");
const authPanel = document.querySelector("#authPanel");
const sessionPanel = document.querySelector("#sessionPanel");
const adminPanel = document.querySelector("#adminPanel");
const trialsPanel = document.querySelector("#trialsPanel");
const coursePanel = document.querySelector("#coursePanel");
const seasonPanel = document.querySelector("#seasonPanel");
const bookingPanel = document.querySelector("#bookingPanel");
const todayPanel = document.querySelector("#todayPanel");
const courseListPanel = document.querySelector("#courseListPanel");
const planningPanel = document.querySelector("#planningPanel");
const attendancePanel = document.querySelector("#attendancePanel");
const monthlyPanel = document.querySelector("#monthlyPanel");
const statsPanel = document.querySelector("#statsPanel");
const businessPanel = document.querySelector("#businessPanel");
const reportsPanel = document.querySelector("#reportsPanel");
const mainGrid = document.querySelector(".grid");
const appNav = document.querySelector(".app-nav");
const navToggleBtn = document.querySelector("#navToggleBtn");
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const navGroups = Array.from(document.querySelectorAll(".nav-group"));
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const resetForm = document.querySelector("#resetForm");
const updatePasswordForm = document.querySelector("#updatePasswordForm");
const logoutBtn = document.querySelector("#logoutBtn");
const inviteForm = document.querySelector("#inviteForm");
const trainerDirectoryForm = document.querySelector("#trainerDirectoryForm");
const courseForm = document.querySelector("#courseForm");
const seasonForm = document.querySelector("#seasonForm");
const generateSeasonDatesBtn = document.querySelector("#generateSeasonDatesBtn");
const clearSeasonDatesBtn = document.querySelector("#clearSeasonDatesBtn");
const addSeasonDateBtn = document.querySelector("#addSeasonDateBtn");
const seasonDateDraftInput = document.querySelector("#seasonDateDraftInput");
const seasonDatePreview = document.querySelector("#seasonDatePreview");
const seasonBookingForm = document.querySelector("#seasonBookingForm");
const saveBookingBtn = document.querySelector("#saveBookingBtn");
const cancelBookingEditBtn = document.querySelector("#cancelBookingEditBtn");
const participantForm = document.querySelector("#participantForm");
const participantFormNotice = document.querySelector("#participantFormNotice");
const openBookingPanelBtn = document.querySelector("#openBookingPanelBtn");
const trialForm = document.querySelector("#trialForm");
const dropInForm = document.querySelector("#dropInForm");
const inviteOutput = document.querySelector("#inviteOutput");
const inviteOutputCode = document.querySelector("#inviteOutputCode");
const inviteOutputLink = document.querySelector("#inviteOutputLink");
const copyInviteLinkBtn = document.querySelector("#copyInviteLinkBtn");
const attendanceDate = document.querySelector("#attendanceDate");
const attendanceSessionPicker = document.querySelector("#attendanceSessionPicker");
const attendanceSessionSelect = document.querySelector("#attendanceSessionSelect");
const monthPicker = document.querySelector("#monthPicker");
const participantSearch = document.querySelector("#participantSearch");
const trainerSelect = document.querySelector("#trainerSelect");
const deleteCourseBtn = document.querySelector("#deleteCourseBtn");
const bookingSeasonSelect = document.querySelector("#bookingSeasonSelect");
const bookingPackageSelect = document.querySelector("#bookingPackageSelect");
const attendanceSeasonSelect = document.querySelector("#attendanceSeasonSelect");
const trainerDirectoryList = document.querySelector("#trainerDirectoryList");
const seasonList = document.querySelector("#seasonList");
const bookingList = document.querySelector("#bookingList");
const seasonFilterAllBtn = document.querySelector("#seasonFilterAllBtn");
const seasonFilterPlannedBtn = document.querySelector("#seasonFilterPlannedBtn");
const seasonFilterActiveBtn = document.querySelector("#seasonFilterActiveBtn");
const seasonFilterClosedBtn = document.querySelector("#seasonFilterClosedBtn");
const moveParticipantModal = document.querySelector("#moveParticipantModal");
const moveParticipantForm = document.querySelector("#moveParticipantForm");
const moveParticipantText = document.querySelector("#moveParticipantText");
const moveParticipantTitle = document.querySelector("#moveParticipantTitle");
const moveParticipantTargetLabel = document.querySelector("#moveParticipantTargetLabel");
const moveParticipantTargetCourse = document.querySelector("#moveParticipantTargetCourse");
const moveParticipantSubmitBtn = document.querySelector("#moveParticipantSubmitBtn");
const closeMoveParticipantModalBtn = document.querySelector("#closeMoveParticipantModalBtn");
const cancelMoveParticipantBtn = document.querySelector("#cancelMoveParticipantBtn");
const trialCourseSelect = document.querySelector("#trialCourseSelect");
const dropInSessionSelect = document.querySelector("#dropInSessionSelect");
const inviteList = document.querySelector("#inviteList");
const courseList = document.querySelector("#courseList");
const trialCards = document.querySelector("#trialCards");
const dropInCards = document.querySelector("#dropInCards");
const planningPreview = document.querySelector("#planningPreview");
const planNextBtn = document.querySelector("#planNextBtn");
const planMonthBtn = document.querySelector("#planMonthBtn");
const todayCards = document.querySelector("#todayCards");
const todayInsights = document.querySelector("#todayInsights");
const jumpToTodayBtn = document.querySelector("#jumpToTodayBtn");
const focusNextCourseBtn = document.querySelector("#focusNextCourseBtn");
const participantTableBody = document.querySelector("#participantTableBody");
const participantCards = document.querySelector("#participantCards");
const participantSectionTitle = document.querySelector("#participantSectionTitle");
const courseActions = document.querySelector("#courseActions");
const monthlyCards = document.querySelector("#monthlyCards");
const statsCards = document.querySelector("#statsCards");
const businessCards = document.querySelector("#businessCards");
const businessInsights = document.querySelector("#businessInsights");
const reportPreview = document.querySelector("#reportPreview");
const mobileTodayBtn = document.querySelector("#mobileTodayBtn");
const mobileMonthBtn = document.querySelector("#mobileMonthBtn");
const mobileReportsBtn = document.querySelector("#mobileReportsBtn");
const mobileSessionSummary = document.querySelector("#mobileSessionSummary");
const statusHeadline = document.querySelector("#statusHeadline");
const statusText = document.querySelector("#statusText");
const statusMeta = document.querySelector("#statusMeta");
const offlineStatus = document.querySelector("#offlineStatus");
const backendStatus = document.querySelector("#backendStatus");
const userStatus = document.querySelector("#userStatus");
const sessionName = document.querySelector("#sessionName");
const sessionRole = document.querySelector("#sessionRole");
const sessionMode = document.querySelector("#sessionMode");
const markAllPresentBtn = document.querySelector("#markAllPresentBtn");
const markAllAbsentBtn = document.querySelector("#markAllAbsentBtn");
const exportBtn = document.querySelector("#exportBtn");
const exportMonthlyBtn = document.querySelector("#exportMonthlyBtn");
const exportLeaderboardBtn = document.querySelector("#exportLeaderboardBtn");
const exportTrainerReportBtn = document.querySelector("#exportTrainerReportBtn");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");
const participantProfileModal = document.querySelector("#participantProfileModal");
const participantProfileTitle = document.querySelector("#participantProfileTitle");
const participantProfileBody = document.querySelector("#participantProfileBody");
const closeParticipantProfileModalBtn = document.querySelector("#closeParticipantProfileModalBtn");
const contentPanels = [
  authPanel,
  sessionPanel,
  adminPanel,
  coursePanel,
  seasonPanel,
  bookingPanel,
  todayPanel,
  trialsPanel,
  courseListPanel,
  planningPanel,
  attendancePanel,
  monthlyPanel,
  statsPanel,
  businessPanel,
  reportsPanel,
].filter(Boolean);

if (attendanceDate) {
  attendanceDate.value = getToday();
}

if (monthPicker) {
  monthPicker.value = getCurrentMonth();
}

loginForm?.addEventListener("submit", handleLogin);
signupForm?.addEventListener("submit", handleSignup);
resetForm?.addEventListener("submit", handleReset);
updatePasswordForm?.addEventListener("submit", handleUpdatePassword);
logoutBtn?.addEventListener("click", handleLogout);
inviteForm?.addEventListener("submit", handleInviteCreate);
trainerDirectoryForm?.addEventListener("submit", handleTrainerDirectoryCreate);
courseForm?.addEventListener("submit", handleCourseCreate);
seasonForm?.addEventListener("submit", handleSeasonCreate);
generateSeasonDatesBtn?.addEventListener("click", handleGenerateSeasonDates);
clearSeasonDatesBtn?.addEventListener("click", () => {
  state.seasonDraftDates = [];
  renderSeasonDateEditor();
});
addSeasonDateBtn?.addEventListener("click", handleAddSeasonDraftDate);
seasonBookingForm?.addEventListener("submit", handleSeasonBookingCreate);
cancelBookingEditBtn?.addEventListener("click", resetBookingForm);
deleteCourseBtn?.addEventListener("click", handleCourseDelete);
participantForm?.addEventListener("submit", handleParticipantCreate);
openBookingPanelBtn?.addEventListener("click", () => {
  state.activeSection = "#bookingPanel";
  render();
});
trialForm?.addEventListener("submit", handleTrialCreate);
dropInForm?.addEventListener("submit", handleDropInCreate);
moveParticipantForm?.addEventListener("submit", handleMoveParticipantSubmit);
closeMoveParticipantModalBtn?.addEventListener("click", closeMoveParticipantModal);
cancelMoveParticipantBtn?.addEventListener("click", closeMoveParticipantModal);
closeParticipantProfileModalBtn?.addEventListener("click", closeParticipantProfileModal);
participantProfileModal?.addEventListener("click", (event) => {
  if (event.target === participantProfileModal) {
    closeParticipantProfileModal();
  }
});
seasonFilterAllBtn?.addEventListener("click", () => setSeasonFilter("all"));
seasonFilterPlannedBtn?.addEventListener("click", () => setSeasonFilter("geplant"));
seasonFilterActiveBtn?.addEventListener("click", () => setSeasonFilter("aktiv"));
seasonFilterClosedBtn?.addEventListener("click", () => setSeasonFilter("abgeschlossen"));
attendanceDate?.addEventListener("change", render);
attendanceSessionSelect?.addEventListener("change", () => {
  if (!attendanceDate) {
    return;
  }
  attendanceDate.value = attendanceSessionSelect.value || getToday();
  render();
});
monthPicker?.addEventListener("change", render);
attendanceSeasonSelect?.addEventListener("change", () => {
  state.attendanceSeasonId = normalizeOptionalId(attendanceSeasonSelect.value);
  syncAttendanceDateWithSeasonSessions();
  render();
});
bookingPackageSelect?.addEventListener("change", syncBookingDayInputs);
seasonBookingForm?.addEventListener("change", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.name === "selectedDays") {
    syncBookingDayInputs();
  }
});
participantSearch?.addEventListener("input", () => {
  state.participantSearch = participantSearch.value.trim().toLowerCase();
  renderParticipants();
  renderReportPreview();
});
markAllPresentBtn?.addEventListener("click", () => setAttendanceForAll(true));
markAllAbsentBtn?.addEventListener("click", () => setAttendanceForAll(false));
exportBtn?.addEventListener("click", exportSelectedCourseCsv);
exportMonthlyBtn?.addEventListener("click", exportMonthlyReportCsv);
exportLeaderboardBtn?.addEventListener("click", exportLeaderboardCsv);
exportTrainerReportBtn?.addEventListener("click", exportTrainerReportCsv);
planNextBtn?.addEventListener("click", () => createPlannedSessions("next"));
planMonthBtn?.addEventListener("click", () => createPlannedSessions("month"));
jumpToTodayBtn?.addEventListener("click", handleJumpToToday);
focusNextCourseBtn?.addEventListener("click", handleFocusNextCourse);
copyInviteLinkBtn?.addEventListener("click", handleCopyInviteLink);
navToggleBtn?.addEventListener("click", toggleMobileNav);
mobileTodayBtn?.addEventListener("click", () => setActiveSection("#attendancePanel"));
mobileMonthBtn?.addEventListener("click", () => setActiveSection("#monthlyPanel"));
mobileReportsBtn?.addEventListener("click", () => setActiveSection("#reportsPanel"));
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveSection(link.getAttribute("href"));
    closeNavGroups();
    closeMobileNav();
  });
});
navGroups.forEach((group) => {
  group.addEventListener("toggle", () => {
    if (!group.open) {
      return;
    }

    navGroups.forEach((otherGroup) => {
      if (otherGroup !== group) {
        otherGroup.open = false;
      }
    });
  });
});
window.addEventListener("online", handleConnectivityChange);
window.addEventListener("offline", handleConnectivityChange);

initialize();

async function initialize() {
  if (ENABLE_OFFLINE_MODE) {
    registerServiceWorker();
  } else {
    await clearLegacyOfflineState();
  }

  if (!hasConfig) {
    setupNotice.classList.remove("hidden");
    statusHeadline.textContent = "Setup erforderlich";
    statusText.textContent = "Bitte zuerst Supabase in config.js konfigurieren.";
    backendStatus.textContent = "config.js unvollstaendig";
    render();
    return;
  }

  applyInviteCodeFromUrl();

  state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const sessionResult = await state.supabase.auth.getSession();
  state.session = sessionResult.data.session;

  state.supabase.auth.onAuthStateChange(async (event, session) => {
    state.session = session;
    if (event === "TOKEN_REFRESHED") {
      render();
      updateActiveNavLink();
      return;
    }
    await loadProtectedData();
    await flushOfflineQueue();
    render();
    applyRoleLanding();
  });

  await loadProtectedData();
  await flushOfflineQueue();
  render();
  applyRoleLanding();
  updateActiveNavLink();
}

async function loadProtectedData() {
  if (!state.session || !state.supabase) {
    resetProtectedState();
    return;
  }

  if (ENABLE_OFFLINE_MODE) {
    hydrateFromOfflineCache();
  }
  state.selectedSeasonId = null;
  state.attendanceSeasonId = null;
  if (state.courses.length) {
    markOptimisticVisibility("courses", 60000);
  }
  if (state.trainerDirectory.length) {
    markOptimisticVisibility("trainerDirectory", 60000);
  }
  if (state.invites.length) {
    markOptimisticVisibility("invites", 60000);
  }

    if (state.isOffline) {
      notify("Offline-Modus aktiv. Letzte geladene Daten werden verwendet.");
      return;
    }

  await fetchProfile();
  await fetchVisibleCourses();
  await fetchSupportData();
  persistOfflineCache();
}

async function fetchProfile() {
  const { data, error } = await state.supabase
    .from("profiles")
    .select("user_id, full_name, role")
    .eq("user_id", state.session.user.id)
    .single();

  if (error) {
    notify(error.message, true);
    state.profile = null;
    return;
  }

  state.profile = data;
}

async function fetchVisibleCourses() {
  let query = state.supabase
    .from("courses")
    .select("id, name, location, weekday, time, trainer_id, trainer_directory_id")
    .order("weekday")
    .order("time");

  if (state.profile?.role === "trainer") {
    query = query.eq("trainer_id", state.session.user.id);
  }

  const { data, error } = await query;
  if (error) {
    notify(error.message, true);
    return;
  }

  const mappedCourses = (data || []).map((course) => ({
    ...course,
    weekday: normalizeWeekdayLabel(course.weekday),
  }));

  if (shouldPreserveFetchedList("courses", state.courses, mappedCourses)) {
    return;
  }

  state.courses = mappedCourses;
  state.acceptEmptyFetch.courses = false;

  if (!state.selectedCourseId || !state.courses.some((course) => course.id === state.selectedCourseId)) {
    state.selectedCourseId = state.courses[0]?.id || null;
  }
}

async function fetchSupportData() {
  state.attendanceSeasonId = state.seasons.some((season) => season.id === state.attendanceSeasonId)
    ? state.attendanceSeasonId
    : null;
  const courseIds = state.courses.map((course) => course.id);
  const seasonsQuery = state.supabase
    .from("seasons")
    .select("id, name, start_date, end_date, status, created_at")
    .order("start_date", { ascending: false });

  const seasonBookingsQuery = state.supabase
    .from("season_bookings")
    .select("id, season_id, full_name, phone, package_type, selected_days, created_at")
    .order("created_at", { ascending: false });

  const trainerQuery = state.supabase
    .from("profiles")
    .select("user_id, full_name, role")
    .in("role", ["admin", "trainer"])
    .order("full_name");

  const trainerDirectoryQuery = state.supabase
    .from("trainer_directory")
    .select("id, full_name, email, phone, linked_user_id")
    .order("full_name");

  const inviteQuery = isAdmin()
    ? state.supabase
      .from("invite_codes")
      .select("id, code, role, active, used_at, created_at, invited_email, trainer_directory_id")
      .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const participantsQuery = courseIds.length
    ? state.supabase
      .from("participants")
      .select("id, course_id, full_name, phone, created_at, season_id, season_booking_id")
      .in("course_id", courseIds)
      .order("full_name")
    : Promise.resolve({ data: [], error: null });

  const sessionsQuery = courseIds.length
    ? state.supabase
      .from("attendance_sessions")
      .select("id, course_id, session_date, season_id")
      .in("course_id", courseIds)
      .order("session_date")
    : Promise.resolve({ data: [], error: null });

  const trialsQuery = courseIds.length
    ? state.supabase
      .from("trial_requests")
      .select("id, course_id, attendance_session_id, full_name, email, phone, status, notes, created_at, converted_participant_id")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const dropInQuery = courseIds.length
    ? state.supabase
      .from("drop_in_bookings")
      .select("id, course_id, attendance_session_id, full_name, email, phone, status, notes, created_at")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const [seasonResult, seasonBookingResult, trainerResult, trainerDirectoryResult, inviteResult, participantResult, sessionResult, trialResult, dropInResult] = await Promise.all([
    seasonsQuery,
    seasonBookingsQuery,
    trainerQuery,
    trainerDirectoryQuery,
    inviteQuery,
    participantsQuery,
    sessionsQuery,
    trialsQuery,
    dropInQuery,
  ]);

  if (seasonResult.error) {
    notify(getFriendlySupabaseMessage(seasonResult.error, "Seasons konnten nicht geladen werden."), true);
  }
  if (seasonBookingResult.error) {
    notify(getFriendlySupabaseMessage(seasonBookingResult.error, "Buchungen konnten nicht geladen werden."), true);
  }
  if (trainerResult.error) {
    notify(trainerResult.error.message, true);
  }
  if (trainerDirectoryResult.error) {
    notify(getFriendlySupabaseMessage(trainerDirectoryResult.error, "Trainerverzeichnis konnte nicht geladen werden."), true);
  }
  if (inviteResult.error) {
    notify(getFriendlySupabaseMessage(inviteResult.error, "Einladungen konnten nicht geladen werden."), true);
  }
  if (participantResult.error) {
    notify(participantResult.error.message, true);
  }
  if (sessionResult.error) {
    notify(sessionResult.error.message, true);
  }
  if (trialResult.error) {
    notify(trialResult.error.message, true);
  }
  if (dropInResult.error) {
    notify(dropInResult.error.message, true);
  }

  if (!seasonResult.error) {
    state.seasons = seasonResult.data || [];
  }
  if (!seasonBookingResult.error) {
    const nextSeasonBookings = seasonBookingResult.data || [];
    if ((state.optimisticVisibilityUntil.seasonBookings || 0) > Date.now()) {
      state.seasonBookings = mergeOptimisticItems(state.seasonBookings, nextSeasonBookings);
      state.acceptEmptyFetch.seasonBookings = false;
    } else if (!shouldPreserveFetchedList("seasonBookings", state.seasonBookings, nextSeasonBookings)) {
      state.seasonBookings = nextSeasonBookings;
      state.acceptEmptyFetch.seasonBookings = false;
    }
  }
  if (!trainerResult.error) {
    state.trainers = trainerResult.data || [];
  }
  if (!trainerDirectoryResult.error) {
    const nextTrainerDirectory = trainerDirectoryResult.data || [];
    if (!shouldPreserveFetchedList("trainerDirectory", state.trainerDirectory, nextTrainerDirectory)) {
      state.trainerDirectory = nextTrainerDirectory;
      state.acceptEmptyFetch.trainerDirectory = false;
    }
  }
  if (!inviteResult.error) {
    const nextInvites = inviteResult.data || [];
    if (!shouldPreserveFetchedList("invites", state.invites, nextInvites)) {
      state.invites = nextInvites;
      state.acceptEmptyFetch.invites = false;
    }
  }
  if (!participantResult.error) {
    const nextParticipants = participantResult.data || [];
    if ((state.optimisticVisibilityUntil.participants || 0) > Date.now()) {
      state.participants = mergeOptimisticItems(state.participants, nextParticipants);
      state.acceptEmptyFetch.participants = false;
    } else if (!shouldPreserveFetchedList("participants", state.participants, nextParticipants)) {
      state.participants = nextParticipants;
      state.acceptEmptyFetch.participants = false;
    }
  }
  if (!sessionResult.error) {
    state.sessions = sessionResult.data || [];
  }
  if (!trialResult.error) {
    state.trialRequests = trialResult.data || [];
  }
  if (!dropInResult.error) {
    state.dropInBookings = dropInResult.data || [];
  }

  const bookingIds = state.seasonBookings.map((booking) => booking.id);
  const sessionOverrideResult = bookingIds.length
    ? await state.supabase
      .from("session_overrides")
      .select("id, season_booking_id, participant_id, source_session_id, target_session_id, created_at")
      .in("season_booking_id", bookingIds)
      .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (sessionOverrideResult.error) {
    notify(getFriendlySupabaseMessage(sessionOverrideResult.error, "Termin-Umbuchungen konnten nicht geladen werden."), true);
  } else {
    state.sessionOverrides = sessionOverrideResult.data || [];
  }

  if (state.selectedSeasonId && !state.seasons.some((season) => season.id === state.selectedSeasonId)) {
    state.selectedSeasonId = null;
  }

  const sessionIds = state.sessions.map((session) => session.id);
  if (!sessionIds.length) {
    state.records = [];
    state.beatOutEntries = [];
    return;
  }

  const recordResult = await state.supabase
    .from("attendance_records")
    .select("session_id, participant_id, present")
    .in("session_id", sessionIds);

  if (recordResult.error) {
    notify(recordResult.error.message, true);
    return;
  }

  const nextRecords = recordResult.data || [];
  if ((state.optimisticVisibilityUntil.records || 0) > Date.now()) {
    state.records = mergeAttendanceRecords(state.records, nextRecords);
    state.acceptEmptyFetch.records = false;
  } else if (!shouldPreserveFetchedList("records", state.records, nextRecords)) {
    state.records = nextRecords;
    state.acceptEmptyFetch.records = false;
  }

  const beatOutResult = await state.supabase
    .from("beat_out_entries")
    .select("id, session_id, participant_id, season_booking_id, created_at")
    .in("session_id", sessionIds);

  if (beatOutResult.error) {
    notify(getFriendlySupabaseMessage(beatOutResult.error, "BEAT-OUTs konnten nicht geladen werden."), true);
    state.beatOutEntries = [];
  } else {
    const nextBeatOutEntries = beatOutResult.data || [];
    if ((state.optimisticVisibilityUntil.beatOutEntries || 0) > Date.now()) {
      state.beatOutEntries = mergeBeatOutEntries(state.beatOutEntries, nextBeatOutEntries);
      state.acceptEmptyFetch.beatOutEntries = false;
    } else if (!shouldPreserveFetchedList("beatOutEntries", state.beatOutEntries, nextBeatOutEntries)) {
      state.beatOutEntries = nextBeatOutEntries;
      state.acceptEmptyFetch.beatOutEntries = false;
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!state.supabase) {
    return;
  }

  const formData = new FormData(loginForm);
  const { error } = await state.supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });

  if (error) {
    notify(error.message, true);
    return;
  }

  loginForm.reset();
  notify("Login erfolgreich.");
}

async function handleSignup(event) {
  event.preventDefault();

  if (!state.supabase) {
    return;
  }

  const formData = new FormData(signupForm);
  const { error } = await state.supabase.auth.signUp({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
    options: {
      emailRedirectTo: config.siteUrl,
      data: {
        full_name: String(formData.get("fullName")).trim(),
        invite_code: String(formData.get("inviteCode")).trim(),
      },
    },
  });

  if (error) {
    notify(error.message, true);
    return;
  }

  signupForm.reset();
  notify("Konto angelegt. Bitte E-Mail bestaetigen, falls Supabase Confirmation aktiv ist.");
}

async function handleReset(event) {
  event.preventDefault();

  if (!state.supabase) {
    return;
  }

  const formData = new FormData(resetForm);
  const email = String(formData.get("email")).trim();
  const { error } = await state.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: config.siteUrl,
  });

  if (error) {
    notify(error.message, true);
    return;
  }

  resetForm.reset();
  notify("Reset-Mail wurde versendet.");
}

async function handleLogout() {
  if (!state.supabase) {
    return;
  }

  await state.supabase.auth.signOut();
  notify("Du wurdest ausgeloggt.");
}

async function handleUpdatePassword(event) {
  event.preventDefault();

  if (!state.supabase || !state.session) {
    return;
  }

  const formData = new FormData(updatePasswordForm);
  const { error } = await state.supabase.auth.updateUser({
    password: String(formData.get("password")),
  });

  if (error) {
    notify(error.message, true);
    return;
  }

  updatePasswordForm.reset();
  window.history.replaceState({}, "", config.siteUrl);
  notify("Passwort wurde aktualisiert.");
  render();
}

async function handleInviteCreate(event) {
  event.preventDefault();

  if (!isAdmin()) {
    return;
  }

  const formData = new FormData(inviteForm);
  const code = String(formData.get("code")).trim() || generateInviteCode();
  const role = String(formData.get("role"));

  const inviteInsertResult = await state.supabase
    .from("invite_codes")
    .insert({
      code,
      role,
      created_by: state.session.user.id,
    })
    .select("id, code, role, active, used_at, created_at, invited_email, trainer_directory_id")
    .single();

  if (inviteInsertResult.error) {
    notify(inviteInsertResult.error.message, true);
    return;
  }

  state.invites = [
    inviteInsertResult.data,
    ...state.invites.filter((invite) => invite.id !== inviteInsertResult.data.id),
  ].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
  markOptimisticVisibility("invites");
  state.acceptEmptyFetch.invites = false;

  inviteForm.reset();
  showInviteOutput(code);
  renderInvites();
  persistOfflineCache();
  render();
  notify(`Einladungscode ${code} wurde erstellt.`);

  try {
    await refreshVisibleData({ context: "Invite refresh" });
  } catch {}
}

async function handleTrainerDirectoryCreate(event) {
  event.preventDefault();

  try {
    if (!isAdmin()) {
      return;
    }

    const formData = new FormData(trainerDirectoryForm);
    const fullName = String(formData.get("fullName")).trim();
    const email = String(formData.get("email")).trim().toLowerCase();
    const phone = String(formData.get("phone")).trim();
    const prepareLogin = formData.get("prepareLogin") === "on";

    if (prepareLogin && !email) {
      notify("Bitte eine E-Mail eintragen, wenn direkt ein Trainerzugang vorbereitet werden soll.", true);
      return;
    }

    const trainerInsertResult = await state.supabase
      .from("trainer_directory")
      .insert({
        full_name: fullName,
        email: email || null,
        phone: phone || null,
      })
      .select("id, full_name, email, phone, linked_user_id")
      .single();

    if (trainerInsertResult.error) {
      notify(getFriendlySupabaseMessage(trainerInsertResult.error, "Trainer konnte nicht angelegt werden."), true);
      return;
    }

    const trainerDirectoryId = trainerInsertResult.data.id;
    state.trainerDirectory = [
      trainerInsertResult.data,
      ...state.trainerDirectory.filter((entry) => entry.id !== trainerDirectoryId),
    ].sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));
    markOptimisticVisibility("trainerDirectory");
    state.acceptEmptyFetch.trainerDirectory = false;

    let inviteCode = null;
    if (prepareLogin) {
      inviteCode = generateInviteCode();
      const inviteResult = await state.supabase
        .from("invite_codes")
        .insert({
          code: inviteCode,
          role: "trainer",
          created_by: state.session.user.id,
          invited_email: email,
          trainer_directory_id: trainerDirectoryId,
        });

      if (inviteResult.error) {
        notify(`Trainer wurde eingetragen, aber der Zugangscode konnte nicht erstellt werden: ${getFriendlySupabaseMessage(inviteResult.error, inviteResult.error.message)}`, true);
        await refreshVisibleData({ context: "Trainer partial refresh", silent: true });
        return;
      }

      state.invites = [
        {
          id: `local-invite:${inviteCode}`,
          code: inviteCode,
          role: "trainer",
          active: true,
          used_at: null,
          created_at: new Date().toISOString(),
          invited_email: email,
          trainer_directory_id: trainerDirectoryId,
        },
        ...state.invites.filter((invite) => invite.code !== inviteCode),
      ].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
      markOptimisticVisibility("invites");
      state.acceptEmptyFetch.invites = false;
    }

    trainerDirectoryForm.reset();
    renderTrainerSelect();
    renderTrainerDirectory();
    persistOfflineCache();
    setActiveSection("#adminPanel");
    if (inviteCode) {
      showInviteOutput(inviteCode);
    }
    render();
    notify(inviteCode
      ? `Trainer eingetragen und Zugang vorbereitet fuer ${email}.`
      : "Trainer wurde eingetragen.");

    await refreshVisibleData({ context: "Trainer refresh", silent: true });
  } catch (error) {
    console.error("Trainer creation failed", error);
    notify(`Trainer konnte nicht angelegt werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function handleTrainerInviteRegenerate(entry) {
  if (!isAdmin() || !entry?.email) {
    return;
  }

  const inviteCode = generateInviteCode();
  const inviteResult = await state.supabase
    .from("invite_codes")
    .insert({
      code: inviteCode,
      role: "trainer",
      created_by: state.session.user.id,
      invited_email: String(entry.email).trim().toLowerCase(),
      trainer_directory_id: entry.id,
    });

  if (inviteResult.error) {
    notify(getFriendlySupabaseMessage(inviteResult.error, "Trainerzugang konnte nicht vorbereitet werden."), true);
    return;
  }

  await fetchSupportData();
  showInviteOutput(inviteCode);
  render();
  notify(`Neuer Trainerzugang fuer ${entry.email} wurde vorbereitet.`);
}

async function handleCourseCreate(event) {
  event.preventDefault();

  try {
    if (!isAdmin()) {
      return;
    }

    const formData = new FormData(courseForm);
    const trainerSelection = parseTrainerSelection(formData.get("trainerId"));
    const { data, error } = await state.supabase
      .from("courses")
      .insert({
        name: String(formData.get("name")).trim(),
        location: String(formData.get("location")).trim(),
        weekday: normalizeWeekdayLabel(formData.get("weekday")),
        time: String(formData.get("time")).trim() || null,
        trainer_id: trainerSelection.trainerId,
        trainer_directory_id: trainerSelection.directoryId,
      })
      .select("id, name, location, weekday, time, trainer_id, trainer_directory_id")
      .single();

    if (error) {
      notify(getFriendlySupabaseMessage(error, "Kurs konnte nicht gespeichert werden."), true);
      return;
    }

    state.courses = [
      {
        ...data,
        weekday: normalizeWeekdayLabel(data.weekday),
      },
      ...state.courses.filter((course) => course.id !== data.id),
    ].sort((left, right) => {
      const weekdayCompare = String(left.weekday || "").localeCompare(String(right.weekday || ""));
      if (weekdayCompare !== 0) {
        return weekdayCompare;
      }
      return String(left.time || "").localeCompare(String(right.time || ""));
    });
    markOptimisticVisibility("courses");
    state.acceptEmptyFetch.courses = false;
    state.selectedCourseId = data.id;
    courseForm.reset();
    renderCourseList();
    renderPlanning();
    renderParticipants();
    persistOfflineCache();
    setActiveSection("#courseListPanel");
    render();
    notify("Kurs gespeichert.");

    await refreshVisibleData({ includeCourses: true, context: "Course refresh", silent: true });
  } catch (error) {
    console.error("Course creation failed", error);
    notify(`Kurs konnte nicht gespeichert werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function handleSeasonCreate(event) {
  event.preventDefault();

  if (!isAdmin()) {
    return;
  }

  const formData = new FormData(seasonForm);
  const name = String(formData.get("name")).trim();
  const startDate = String(formData.get("startDate")).trim();
  const status = String(formData.get("status")).trim() || "geplant";
  const seasonDatesInput = state.seasonDraftDates.join(", ");
  const explicitSeasonDates = parseSeasonDateEntries(seasonDatesInput);
  const endDate = calculateSeasonEndDate(startDate);

  if (seasonDatesInput && !explicitSeasonDates.length) {
    notify("Bitte gueltige Season-Termine eingeben, z. B. 04.04.2026, 06.04.2026, 08.04.2026.", true);
    return;
  }

  const unmappedDates = getSeasonDatesWithoutMatchingCourse(explicitSeasonDates);
  if (unmappedDates.length) {
    notify(`Fuer diese Season-Termine fehlt noch ein passender Kurs: ${unmappedDates.map((date) => formatDateLabel(date)).join(", ")}.`, true);
    return;
  }

  const { data, error } = await state.supabase
    .from("seasons")
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .select("id")
    .single();

  if (error) {
    notify(getFriendlySupabaseMessage(error, "Season konnte nicht angelegt werden."), true);
    return;
  }

  const sessionPayload = buildSeasonSessionPayload(startDate, endDate, data.id, explicitSeasonDates);
  if (sessionPayload.length) {
    const sessionResult = await state.supabase
      .from("attendance_sessions")
      .insert(sessionPayload);

    if (sessionResult.error && !String(sessionResult.error.message).toLowerCase().includes("duplicate")) {
      notify(getFriendlySupabaseMessage(sessionResult.error, "Season wurde angelegt, aber die Termine konnten nicht vollstaendig erzeugt werden."), true);
    }
  }

  state.selectedSeasonId = data.id;
  state.attendanceSeasonId = data.id;
  seasonForm.reset();
  state.seasonDraftDates = [];
  await fetchSupportData();
  render();
  notify(`Season "${name}" wurde mit ${sessionPayload.length} Terminen angelegt.`);
}

async function handleSeasonBookingCreate(event) {
  event.preventDefault();

  try {
    if (!isAdmin()) {
      return;
    }

    const formData = new FormData(seasonBookingForm);
    const bookingId = normalizeOptionalId(formData.get("bookingId"));
    const seasonId = normalizeOptionalId(formData.get("seasonId"));
    const fullName = String(formData.get("fullName")).trim();
    const phone = String(formData.get("phone")).trim();
    const packageType = String(formData.get("packageType")).trim();
    const selectedDays = packageType === "3x REPEAT"
      ? ["Montag", "Mittwoch", "Samstag"]
      : formData.getAll("selectedDays").map((value) => String(value));

    if (!seasonId) {
      notify("Bitte zuerst eine Season auswaehlen.", true);
      return;
    }

    const expectedCount = getExpectedDayCount(packageType);
    if (selectedDays.length !== expectedCount) {
      notify(`Fuer ${packageType} muessen genau ${expectedCount} Trainingstage gewaehlt werden.`, true);
      return;
    }

    const relevantCourses = resolveRelevantCoursesForDays(selectedDays);
    if (!relevantCourses.ok) {
      notify(relevantCourses.message, true);
      return;
    }

    let savedBookingId = bookingId;
    let optimisticBooking = null;
    if (bookingId) {
      const bookingUpdateResult = await state.supabase
        .from("season_bookings")
        .update({
          season_id: seasonId,
          full_name: fullName,
          phone: phone || null,
          package_type: packageType,
          selected_days: selectedDays,
        })
        .eq("id", bookingId);

      if (bookingUpdateResult.error) {
        notify(getFriendlySupabaseMessage(bookingUpdateResult.error, "Buchung konnte nicht aktualisiert werden."), true);
        return;
      }

      optimisticBooking = {
        id: bookingId,
        season_id: seasonId,
        full_name: fullName,
        phone: phone || null,
        package_type: packageType,
        selected_days: selectedDays,
        created_at: state.seasonBookings.find((entry) => entry.id === bookingId)?.created_at || new Date().toISOString(),
      };
    } else {
      const bookingInsertResult = await state.supabase
        .from("season_bookings")
        .insert({
          season_id: seasonId,
          full_name: fullName,
          phone: phone || null,
          package_type: packageType,
          selected_days: selectedDays,
        })
        .select("id, season_id, full_name, phone, package_type, selected_days, created_at")
        .single();

      if (bookingInsertResult.error) {
        notify(getFriendlySupabaseMessage(bookingInsertResult.error, "Buchung konnte nicht gespeichert werden."), true);
        return;
      }

      savedBookingId = bookingInsertResult.data.id;
      optimisticBooking = bookingInsertResult.data;
    }

    const participantSyncResult = await syncSeasonBookingParticipants({
      bookingId: savedBookingId,
      seasonId,
      fullName,
      phone,
      selectedDays,
      relevantCourses: relevantCourses.data,
    });

    if (!participantSyncResult.ok) {
      notify(participantSyncResult.message, true);
      await refreshVisibleData({ context: "Booking participant sync refresh", silent: true });
      return;
    }

    state.selectedSeasonId = seasonId;
    if (optimisticBooking) {
      state.seasonBookings = [
        optimisticBooking,
        ...state.seasonBookings.filter((entry) => entry.id !== savedBookingId),
      ].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
      markOptimisticVisibility("seasonBookings", 60000);
      state.acceptEmptyFetch.seasonBookings = false;
    }
    resetBookingForm();
    persistOfflineCache();
    render();
    await refreshVisibleData({ context: "Booking refresh", silent: true });
    notify(bookingId
      ? `${fullName} wurde in der Buchung aktualisiert.`
      : `${fullName} wurde fuer ${packageType} eingebucht.`);
  } catch (error) {
    console.error("Season booking save failed", error);
    notify(`Buchung konnte nicht gespeichert werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function handleCourseDelete() {
  try {
    if (!isAdmin()) {
      return;
    }

    const course = getSelectedCourse();
    if (!course) {
      notify("Bitte zuerst einen Kurs auswaehlen.", true);
      return;
    }

    if (state.isOffline) {
      notify("Kurse koennen nur online geloescht werden.", true);
      return;
    }

    const confirmed = window.confirm(`Soll der Kurs "${course.name}" wirklich geloescht werden? Teilnehmer, Termine und Anwesenheiten dieses Kurses gehen dabei verloren.`);
    if (!confirmed) {
      return;
    }

    const linkedParticipantIds = state.participants
      .filter((participant) => participant.course_id === course.id)
      .map((participant) => participant.id);
    const linkedSessionIds = state.sessions
      .filter((session) => session.course_id === course.id)
      .map((session) => session.id);

    if (linkedSessionIds.length) {
      const beatOutDeleteResult = await state.supabase
        .from("beat_out_entries")
        .delete()
        .in("session_id", linkedSessionIds);

      if (beatOutDeleteResult.error) {
        notify(getFriendlySupabaseMessage(beatOutDeleteResult.error, "BEAT-OUTs des Kurses konnten nicht geloescht werden."), true);
        return;
      }
    }

    const deleteResult = await state.supabase
      .from("courses")
      .delete()
      .eq("id", course.id);

    if (deleteResult.error) {
      notify(getFriendlySupabaseMessage(deleteResult.error, "Kurs konnte nicht geloescht werden."), true);
      return;
    }

    state.courses = state.courses.filter((entry) => entry.id !== course.id);
    state.participants = state.participants.filter((participant) => participant.course_id !== course.id);
    state.sessions = state.sessions.filter((session) => session.course_id !== course.id);
    state.records = state.records.filter((record) => !linkedParticipantIds.includes(record.participant_id) && !linkedSessionIds.includes(record.session_id));
    state.trialRequests = state.trialRequests.filter((trial) => trial.course_id !== course.id);
    state.dropInBookings = state.dropInBookings.filter((entry) => entry.course_id !== course.id);
    state.beatOutEntries = state.beatOutEntries.filter((entry) => !linkedSessionIds.includes(entry.session_id) && !linkedParticipantIds.includes(entry.participant_id));
    if (state.selectedCourseId === course.id) {
      state.selectedCourseId = state.courses[0]?.id || null;
    }
    renderCourseList();
    renderPlanning();
    renderParticipants();
    persistOfflineCache();
    render();

    clearOptimisticVisibility("courses");
    clearOptimisticVisibility("participants");
    state.acceptEmptyFetch.courses = true;
    state.acceptEmptyFetch.participants = true;
    await refreshVisibleData({ includeCourses: true, context: "Course delete refresh", silent: true });
    notify(`Kurs "${course.name}" wurde geloescht.`);
  } catch (error) {
    console.error("Course delete failed", error);
    notify(`Kurs konnte nicht geloescht werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function handleSeasonDuplicate(sourceSeason, carryOverBookings = false) {
  if (!isAdmin() || !sourceSeason) {
    return null;
  }

  const nextStartDate = getNextSeasonStartDate(sourceSeason.end_date);
  const nextEndDate = calculateSeasonEndDate(nextStartDate);
  const duplicateName = `${sourceSeason.name} Folge`;

  const seasonResult = await state.supabase
    .from("seasons")
    .insert({
      name: duplicateName,
      start_date: nextStartDate,
      end_date: nextEndDate,
      status: "geplant",
    })
    .select("id")
    .single();

  if (seasonResult.error) {
    notify(getFriendlySupabaseMessage(seasonResult.error, "Season konnte nicht dupliziert werden."), true);
    return null;
  }

  const newSeasonId = seasonResult.data.id;
  const sourceSeasonDates = getSeasonTrainingDates(sourceSeason.id);
  const shiftedSeasonDates = sourceSeasonDates.map((date) => addDaysToDate(date, 28));
  const sessionPayload = buildSeasonSessionPayload(nextStartDate, nextEndDate, newSeasonId, shiftedSeasonDates);
  if (sessionPayload.length) {
    const sessionResult = await state.supabase
      .from("attendance_sessions")
      .insert(sessionPayload);

    if (sessionResult.error && !String(sessionResult.error.message).toLowerCase().includes("duplicate")) {
      notify(getFriendlySupabaseMessage(sessionResult.error, "Season wurde dupliziert, aber die Termine konnten nicht vollstaendig erzeugt werden."), true);
    }
  }

  if (carryOverBookings) {
    const sourceBookings = state.seasonBookings.filter((booking) => booking.season_id === sourceSeason.id);
    for (const booking of sourceBookings) {
      const bookingInsertResult = await state.supabase
        .from("season_bookings")
        .insert({
          season_id: newSeasonId,
          full_name: booking.full_name,
          phone: booking.phone || null,
          package_type: booking.package_type,
          selected_days: booking.selected_days,
        })
        .select("id")
        .single();

      if (bookingInsertResult.error) {
        notify(getFriendlySupabaseMessage(bookingInsertResult.error, `Season wurde dupliziert, aber ${booking.full_name} konnte nicht uebernommen werden.`), true);
        continue;
      }

      const relevantCourses = resolveRelevantCoursesForDays(booking.selected_days);
      if (!relevantCourses.ok) {
        notify(relevantCourses.message, true);
        continue;
      }

      const participantSyncResult = await syncSeasonBookingParticipants({
        bookingId: bookingInsertResult.data.id,
        seasonId: newSeasonId,
        fullName: booking.full_name,
        phone: booking.phone || "",
        selectedDays: booking.selected_days,
        relevantCourses: relevantCourses.data,
      });

      if (!participantSyncResult.ok) {
        notify(participantSyncResult.message, true);
      }
    }
  }

  state.selectedSeasonId = newSeasonId;
  await fetchSupportData();
  render();
  notify(carryOverBookings
    ? `Season "${duplicateName}" wurde inklusive Teilnehmern angelegt.`
    : `Season "${duplicateName}" wurde dupliziert.`);

  return newSeasonId;
}

async function handleSeasonStatusUpdate(season, status) {
  if (!isAdmin() || !season) {
    return;
  }

  const labels = {
    aktiv: "aktivieren",
    abgeschlossen: "abschliessen",
    geplant: "zur Planung zuruecksetzen",
  };

  const confirmed = window.confirm(`Soll die Season "${season.name}" wirklich auf "${status}" gesetzt werden?`);
  if (!confirmed) {
    return;
  }

  const { error } = await state.supabase
    .from("seasons")
    .update({ status })
    .eq("id", season.id);

  if (error) {
    notify(getFriendlySupabaseMessage(error, `Season konnte nicht ${labels[status] || "aktualisiert"} werden.`), true);
    return;
  }

  await fetchSupportData();
  render();
  notify(`Season "${season.name}" ist jetzt ${status}.`);
}

async function handleSeasonArchive(season) {
  await handleSeasonStatusUpdate(season, "abgeschlossen");
}

async function handleSeasonDelete(season) {
  if (!isAdmin() || !season) {
    return;
  }

  const confirmed = window.confirm(`Soll die Season "${season.name}" wirklich komplett geloescht werden? Alle Buchungen, verknuepften Teilnehmer und Season-Termine werden dabei entfernt.`);
  if (!confirmed) {
    return;
  }

  const bookingIds = state.seasonBookings
    .filter((booking) => booking.season_id === season.id)
    .map((booking) => booking.id);
  const participantIds = state.participants
    .filter((participant) => participant.season_id === season.id)
    .map((participant) => participant.id);
  const sessionIds = getSeasonSessions(season.id).map((session) => session.id);

  if (sessionIds.length) {
    const sessionDeleteResult = await state.supabase
      .from("attendance_sessions")
      .delete()
      .in("id", sessionIds);

    if (sessionDeleteResult.error) {
      notify(getFriendlySupabaseMessage(sessionDeleteResult.error, "Season-Termine konnten nicht geloescht werden."), true);
      return;
    }
  }

  const seasonDeleteResult = await state.supabase
    .from("seasons")
    .delete()
    .eq("id", season.id);

  if (seasonDeleteResult.error) {
    notify(getFriendlySupabaseMessage(seasonDeleteResult.error, "Season konnte nicht geloescht werden."), true);
    return;
  }

  state.seasons = state.seasons.filter((entry) => entry.id !== season.id);
  state.seasonBookings = state.seasonBookings.filter((entry) => entry.season_id !== season.id);
  state.participants = state.participants.filter((entry) => entry.season_id !== season.id);
  state.sessions = state.sessions.filter((entry) => !sessionIds.includes(entry.id) && entry.season_id !== season.id);
  state.records = state.records.filter((entry) => !sessionIds.includes(entry.session_id) && !participantIds.includes(entry.participant_id));
  state.beatOutEntries = state.beatOutEntries.filter((entry) => !sessionIds.includes(entry.session_id) && !participantIds.includes(entry.participant_id) && !bookingIds.includes(entry.season_booking_id));
  state.sessionOverrides = state.sessionOverrides.filter((entry) => !sessionIds.includes(entry.source_session_id) && !sessionIds.includes(entry.target_session_id) && !participantIds.includes(entry.participant_id) && !bookingIds.includes(entry.season_booking_id));

  if (state.selectedSeasonId === season.id) {
    state.selectedSeasonId = null;
  }
  if (state.attendanceSeasonId === season.id) {
    state.attendanceSeasonId = null;
  }

  clearOptimisticVisibility("seasonBookings");
  clearOptimisticVisibility("participants");
  clearOptimisticVisibility("records");
  clearOptimisticVisibility("beatOutEntries");
  state.acceptEmptyFetch.seasonBookings = true;
  state.acceptEmptyFetch.participants = true;
  state.acceptEmptyFetch.records = true;
  state.acceptEmptyFetch.beatOutEntries = true;

  render();
  notify(`Season "${season.name}" wurde geloescht.`);
  await refreshVisibleData({ context: "Season delete refresh", silent: true });
}

async function ensureFollowUpSeason(sourceSeason) {
  const existing = getNextSeasonForRenewal(sourceSeason);
  if (existing) {
    return existing;
  }

  const newSeasonId = await handleSeasonDuplicate(sourceSeason, false);
  if (!newSeasonId) {
    return null;
  }

  await fetchSupportData();
  return state.seasons.find((entry) => entry.id === newSeasonId) || null;
}

async function cloneBookingIntoSeason(booking, targetSeason) {
  if (!booking || !targetSeason) {
    return { ok: false, message: "Ziel-Season fehlt." };
  }

  const duplicate = state.seasonBookings.find((entry) => {
    return entry.season_id === targetSeason.id
      && entry.full_name === booking.full_name
      && entry.package_type === booking.package_type
      && JSON.stringify(entry.selected_days || []) === JSON.stringify(booking.selected_days || []);
  });

  if (duplicate) {
    return { ok: false, message: `${booking.full_name} ist in ${targetSeason.name} bereits vorhanden.` };
  }

  const bookingInsertResult = await state.supabase
    .from("season_bookings")
    .insert({
      season_id: targetSeason.id,
      full_name: booking.full_name,
      phone: booking.phone || null,
      package_type: booking.package_type,
      selected_days: booking.selected_days,
    })
    .select("id")
    .single();

  if (bookingInsertResult.error) {
    return {
      ok: false,
      message: getFriendlySupabaseMessage(bookingInsertResult.error, `${booking.full_name} konnte nicht in die Folge-Season uebernommen werden.`),
    };
  }

  const relevantCourses = resolveRelevantCoursesForDays(booking.selected_days);
  if (!relevantCourses.ok) {
    return { ok: false, message: relevantCourses.message };
  }

  const participantSyncResult = await syncSeasonBookingParticipants({
    bookingId: bookingInsertResult.data.id,
    seasonId: targetSeason.id,
    fullName: booking.full_name,
    phone: booking.phone || "",
    selectedDays: booking.selected_days,
    relevantCourses: relevantCourses.data,
  });

  if (!participantSyncResult.ok) {
    return { ok: false, message: participantSyncResult.message };
  }

  return { ok: true };
}

async function handleCarryOverBookingToNextSeason(booking, sourceSeason) {
  if (!isAdmin() || !booking || !sourceSeason) {
    return;
  }

  const targetSeason = await ensureFollowUpSeason(sourceSeason);
  if (!targetSeason) {
    return;
  }

  const result = await cloneBookingIntoSeason(booking, targetSeason);
  if (!result.ok) {
    notify(result.message, true);
    return;
  }

  state.selectedSeasonId = targetSeason.id;
  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`${booking.full_name} wurde in ${targetSeason.name} uebernommen.`);
}

async function handleBookingDelete(booking) {
  if (!isAdmin() || !booking) {
    return;
  }

  const confirmed = window.confirm(`Soll die Buchung von "${booking.full_name}" wirklich geloescht werden? Alle zugehoerigen Season-Teilnehmer werden dabei entfernt.`);
  if (!confirmed) {
    return;
  }

  const linkedParticipants = state.participants.filter((participant) => participant.season_booking_id === booking.id);
  const linkedParticipantIds = linkedParticipants.map((participant) => participant.id);

  if (linkedParticipantIds.length) {
    const beatOutDeleteResult = await state.supabase
      .from("beat_out_entries")
      .delete()
      .eq("season_booking_id", booking.id);

    if (beatOutDeleteResult.error) {
      notify(getFriendlySupabaseMessage(beatOutDeleteResult.error, "BEAT-OUTs der Buchung konnten nicht geloescht werden."), true);
      return;
    }
  }

  const participantDeleteResult = await state.supabase
    .from("participants")
    .delete()
    .eq("season_booking_id", booking.id);

  if (participantDeleteResult.error) {
    notify(getFriendlySupabaseMessage(participantDeleteResult.error, "Season-Teilnehmer konnten nicht geloescht werden."), true);
    return;
  }

  const bookingDeleteResult = await state.supabase
    .from("season_bookings")
    .delete()
    .eq("id", booking.id);

  if (bookingDeleteResult.error) {
    notify(getFriendlySupabaseMessage(bookingDeleteResult.error, "Buchung konnte nicht geloescht werden."), true);
    return;
  }

  if (state.editingBookingId === booking.id) {
    resetBookingForm();
  }

  if (linkedParticipantIds.length) {
    state.participants = state.participants.filter((participant) => !linkedParticipantIds.includes(participant.id));
    state.records = state.records.filter((record) => !linkedParticipantIds.includes(record.participant_id));
    state.beatOutEntries = state.beatOutEntries.filter((entry) => !linkedParticipantIds.includes(entry.participant_id) && entry.season_booking_id !== booking.id);
  }
  state.seasonBookings = state.seasonBookings.filter((entry) => entry.id !== booking.id);
  clearOptimisticVisibility("seasonBookings");
  clearOptimisticVisibility("participants");
  clearOptimisticVisibility("records");
  clearOptimisticVisibility("beatOutEntries");
  state.acceptEmptyFetch.seasonBookings = true;
  state.acceptEmptyFetch.participants = true;
  state.acceptEmptyFetch.records = true;
  state.acceptEmptyFetch.beatOutEntries = true;
  persistOfflineCache();
  render();

  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`Buchung von ${booking.full_name} wurde geloescht.`);
}

async function handleTrainerDirectoryDelete(entry) {
  try {
    if (!isAdmin() || !entry || entry.linked_user_id) {
      return;
    }

    if (state.isOffline) {
      notify("Trainer koennen nur online geloescht werden.", true);
      return;
    }

    const confirmed = window.confirm(`Soll der Trainer "${entry.full_name}" wirklich geloescht werden? Kurszuweisungen dieses manuellen Eintrags werden dabei entfernt.`);
    if (!confirmed) {
      return;
    }

    const courseUnassignResult = await state.supabase
      .from("courses")
      .update({ trainer_directory_id: null })
      .eq("trainer_directory_id", entry.id);

    if (courseUnassignResult.error) {
      notify(getFriendlySupabaseMessage(courseUnassignResult.error, "Trainer konnte nicht aus den Kursen geloest werden."), true);
      return;
    }

    const inviteDeleteResult = await state.supabase
      .from("invite_codes")
      .delete()
      .eq("trainer_directory_id", entry.id);

    if (inviteDeleteResult.error) {
      notify(getFriendlySupabaseMessage(inviteDeleteResult.error, "Trainer-Einladungen konnten nicht geloescht werden."), true);
      return;
    }

    const deleteResult = await state.supabase
      .from("trainer_directory")
      .delete()
      .eq("id", entry.id);

    if (deleteResult.error) {
      notify(getFriendlySupabaseMessage(deleteResult.error, "Trainer konnte nicht geloescht werden."), true);
      return;
    }

    state.courses = state.courses.map((course) => {
      if (course.trainer_directory_id !== entry.id) {
        return course;
      }

      return {
        ...course,
        trainer_directory_id: null,
      };
    });
    state.trainerDirectory = state.trainerDirectory.filter((trainer) => trainer.id !== entry.id);
    state.invites = state.invites.filter((invite) => invite.trainer_directory_id !== entry.id);
    renderTrainerSelect();
    renderTrainerDirectory();
    renderCourseList();
    persistOfflineCache();
    render();

    clearOptimisticVisibility("trainerDirectory");
    clearOptimisticVisibility("invites");
    clearOptimisticVisibility("courses");
    state.acceptEmptyFetch.trainerDirectory = true;
    state.acceptEmptyFetch.invites = true;
    state.acceptEmptyFetch.courses = true;
    await refreshVisibleData({ includeCourses: true, context: "Trainer delete refresh", silent: true });
    notify(`Trainer "${entry.full_name}" wurde geloescht.`);
  } catch (error) {
    console.error("Trainer delete failed", error);
    notify(`Trainer konnte nicht geloescht werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function handleParticipantCreate(event) {
  event.preventDefault();

  try {
    const course = getSelectedCourse();
    if (!course || !canEditCourse(course)) {
      return;
    }

      const formData = new FormData(participantForm);
      const fullName = String(formData.get("fullName")).trim();
      const phone = String(formData.get("phone")).trim();
      if (!fullName) {
        notify("Bitte einen Teilnehmernamen eingeben.", true);
        return;
      }
      const preferredSeasonId = state.attendanceSeasonId || getDefaultSeasonId();
      const selectedDay = normalizeWeekdayLabel(course.weekday);

      if (!preferredSeasonId) {
        notify("Bitte zuerst eine Season anlegen, damit Teilnehmer sauber als TRAIN, BEAT oder REPEAT gebucht werden koennen.", true);
        state.activeSection = "#seasonPanel";
        render();
        return;
      }

      const bookingInsertResult = await state.supabase
        .from("season_bookings")
        .insert({
          full_name: fullName,
          phone: phone || null,
          season_id: preferredSeasonId,
          package_type: "1x TRAIN",
          selected_days: [selectedDay],
        })
        .select("id, season_id, full_name, phone, package_type, selected_days, created_at")
        .single();

      if (bookingInsertResult.error) {
        notify(getFriendlySupabaseMessage(bookingInsertResult.error, "Teilnehmer konnte nicht als Buchung angelegt werden."), true);
        return;
      }

      const optimisticBooking = bookingInsertResult.data;
      state.seasonBookings = [
        optimisticBooking,
        ...state.seasonBookings.filter((entry) => entry.id !== optimisticBooking.id),
      ].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
      markOptimisticVisibility("seasonBookings", 60000);
      state.acceptEmptyFetch.seasonBookings = false;

      const participantSyncResult = await syncSeasonBookingParticipants({
        bookingId: optimisticBooking.id,
        seasonId: preferredSeasonId,
        fullName,
        phone,
        selectedDays: [selectedDay],
        relevantCourses: [{ weekday: selectedDay, course }],
      });

      if (!participantSyncResult.ok) {
        notify(participantSyncResult.message, true);
        await refreshVisibleData({ context: "Participant booking create refresh", silent: true });
        return;
      }

      const hadSeasonFilter = Boolean(state.attendanceSeasonId);
      const refreshOk = await refreshVisibleData({ context: "Participant booking refresh", silent: false });
      const bookingPersisted = state.seasonBookings.some((entry) => entry.id === optimisticBooking.id);
      const participantPersisted = state.participants.some((entry) => entry.season_booking_id === optimisticBooking.id);

      if (!refreshOk || !bookingPersisted || !participantPersisted) {
        notify("Teilnehmer konnte nicht dauerhaft in Supabase bestaetigt werden. Bitte Buchungen und Teilnehmerliste pruefen.", true);
        return;
      }

      if (state.attendanceSeasonId) {
        state.attendanceSeasonId = null;
      }
      state.selectedSeasonId = null;
      participantForm.reset();
      persistOfflineCache();
      render();
      notify(hadSeasonFilter
        ? "Teilnehmer als 1x TRAIN eingebucht. Ansicht wurde auf Alle Seasons umgestellt."
        : "Teilnehmer als 1x TRAIN eingebucht.");
    } catch (error) {
      console.error("Participant create failed", error);
      notify(`Teilnehmer konnte nicht gespeichert werden: ${error?.message || "Unerwarteter Fehler"}`, true);
    }
  }

async function handleParticipantDelete(participant, course) {
  try {
    if (!participant || !course || !canEditCourse(course)) {
      return;
    }

    if (state.isOffline) {
      notify("Teilnehmer koennen nur online geloescht werden.", true);
      return;
    }

    const booking = getParticipantSeasonBooking(participant);
    if (booking) {
      const weekdayToRemove = normalizeWeekdayLabel(course.weekday);
      const remainingDays = (booking.selected_days || []).filter((day) => normalizeWeekdayLabel(day) !== weekdayToRemove);

      if (!remainingDays.length) {
        const confirmedDeleteBooking = window.confirm(
          `${participant.full_name} ist ueber eine Season-Buchung in diesem Kurs. Soll die gesamte Buchung geloescht werden?`,
        );
        if (!confirmedDeleteBooking) {
          return;
        }
        await handleBookingDelete(booking);
        return;
      }

      const nextPackageType = getPackageTypeForDayCount(remainingDays.length);
      if (!nextPackageType) {
        notify("Die Season-Buchung konnte nicht auf ein gueltiges Paket umgestellt werden.", true);
        return;
      }

      const confirmedUpdateBooking = window.confirm(
        `${participant.full_name} aus ${course.name} entfernen und die Buchung auf ${nextPackageType} umstellen?`,
      );
      if (!confirmedUpdateBooking) {
        return;
      }

      const updateResult = await state.supabase
        .from("season_bookings")
        .update({
          package_type: nextPackageType,
          selected_days: remainingDays,
        })
        .eq("id", booking.id);

      if (updateResult.error) {
        notify(getFriendlySupabaseMessage(updateResult.error, "Season-Buchung konnte nicht angepasst werden."), true);
        return;
      }

      state.seasonBookings = state.seasonBookings.map((entry) => {
        if (entry.id !== booking.id) {
          return entry;
        }
        return {
          ...entry,
          package_type: nextPackageType,
          selected_days: remainingDays,
        };
      });
      markOptimisticVisibility("seasonBookings", 60000);
      state.acceptEmptyFetch.seasonBookings = false;

      const relevantCourses = resolveRelevantCoursesForDays(remainingDays);
      if (!relevantCourses.ok) {
        notify(relevantCourses.message, true);
        return;
      }

      const syncResult = await syncSeasonBookingParticipants({
        bookingId: booking.id,
        seasonId: booking.season_id,
        fullName: booking.full_name,
        phone: booking.phone,
        selectedDays: remainingDays,
        relevantCourses: relevantCourses.data,
      });

      if (!syncResult.ok) {
        notify(syncResult.message, true);
        return;
      }

        persistOfflineCache();
        render();
        notify(`${participant.full_name} wurde aus ${course.name} entfernt.`);
        await refreshVisibleData({ context: "Participant booking delete refresh", silent: true });
        return;
    }

    const confirmed = window.confirm(`Soll ${participant.full_name} wirklich aus ${course.name} geloescht werden?`);
    if (!confirmed) {
      return;
    }

    const beatOutDeleteResult = await state.supabase
      .from("beat_out_entries")
      .delete()
      .eq("participant_id", participant.id);

    if (beatOutDeleteResult.error) {
      notify(getFriendlySupabaseMessage(beatOutDeleteResult.error, "BEAT-OUTs des Teilnehmers konnten nicht geloescht werden."), true);
      return;
    }

    const recordDeleteResult = await state.supabase
      .from("attendance_records")
      .delete()
      .eq("participant_id", participant.id);

    if (recordDeleteResult.error) {
      notify(getFriendlySupabaseMessage(recordDeleteResult.error, "Anwesenheiten des Teilnehmers konnten nicht geloescht werden."), true);
      return;
    }

    const participantDeleteResult = await state.supabase
      .from("participants")
      .delete()
      .eq("id", participant.id);

    if (participantDeleteResult.error) {
      notify(getFriendlySupabaseMessage(participantDeleteResult.error, "Teilnehmer konnte nicht geloescht werden."), true);
      return;
    }

      state.participants = state.participants.filter((entry) => entry.id !== participant.id);
      state.records = state.records.filter((entry) => entry.participant_id !== participant.id);
      state.beatOutEntries = state.beatOutEntries.filter((entry) => entry.participant_id !== participant.id);
      clearOptimisticVisibility("participants");
      clearOptimisticVisibility("records");
      clearOptimisticVisibility("beatOutEntries");
      state.acceptEmptyFetch.participants = true;
      state.acceptEmptyFetch.records = true;
      state.acceptEmptyFetch.beatOutEntries = true;
      persistOfflineCache();
      render();
      notify(`${participant.full_name} wurde geloescht.`);
      await refreshVisibleData({ context: "Participant delete refresh", silent: true });
  } catch (error) {
    console.error("Participant delete failed", error);
    notify(`Teilnehmer konnte nicht geloescht werden: ${error?.message || "Unerwarteter Fehler"}`, true);
  }
}

async function syncSeasonBookingParticipants({ bookingId, seasonId, fullName, phone, selectedDays, relevantCourses }) {
  const existingParticipants = state.participants.filter((participant) => participant.season_booking_id === bookingId);
  const existingByWeekday = new Map(
    existingParticipants
      .map((participant) => {
        const course = state.courses.find((entry) => entry.id === participant.course_id);
        return course ? [normalizeWeekdayLabel(course.weekday), participant] : null;
      })
      .filter(Boolean),
  );

  const desiredByWeekday = new Map(relevantCourses.map((entry) => [normalizeWeekdayLabel(entry.weekday), entry.course]));

  for (const participant of existingParticipants) {
    const course = state.courses.find((entry) => entry.id === participant.course_id);
    if (!course || !desiredByWeekday.has(normalizeWeekdayLabel(course.weekday))) {
      const deleteResult = await state.supabase
        .from("participants")
        .delete()
        .eq("id", participant.id);

      if (deleteResult.error) {
        return {
          ok: false,
          message: getFriendlySupabaseMessage(deleteResult.error, "Teilnehmer konnten nicht aus der alten Buchung entfernt werden."),
        };
      }

      state.participants = state.participants.filter((entry) => entry.id !== participant.id);
    }
  }

  for (const [weekday, course] of desiredByWeekday.entries()) {
    const existing = existingByWeekday.get(weekday);
      if (existing) {
        const updateResult = await state.supabase
          .from("participants")
          .update({
            course_id: course.id,
            full_name: fullName,
            phone: phone || null,
            season_id: seasonId,
            season_booking_id: bookingId,
          })
          .select("id, course_id, full_name, phone, created_at, season_id, season_booking_id")
          .eq("id", existing.id);

      if (updateResult.error) {
        return {
          ok: false,
          message: getFriendlySupabaseMessage(updateResult.error, "Teilnehmer konnten nicht aktualisiert werden."),
        };
      }

      const updatedParticipant = Array.isArray(updateResult.data) ? updateResult.data[0] : null;
      if (updatedParticipant) {
        state.participants = [
          updatedParticipant,
          ...state.participants.filter((entry) => entry.id !== updatedParticipant.id),
        ].sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));
      }
    } else {
      const insertResult = await state.supabase
        .from("participants")
        .insert({
          course_id: course.id,
          full_name: fullName,
          phone: phone || null,
          season_id: seasonId,
          season_booking_id: bookingId,
        })
        .select("id, course_id, full_name, phone, created_at, season_id, season_booking_id")
        .single();

      if (insertResult.error) {
        return {
          ok: false,
          message: getFriendlySupabaseMessage(insertResult.error, "Teilnehmer konnten nicht fuer die Buchung angelegt werden."),
        };
      }

      state.participants = [
        insertResult.data,
        ...state.participants.filter((entry) => entry.id !== insertResult.data.id),
      ].sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));
    }
  }

  markOptimisticVisibility("participants", 60000);
  state.acceptEmptyFetch.participants = false;
  return { ok: true };
}

function openBookingEdit(booking) {
  if (!seasonBookingForm || !booking) {
    return;
  }

  state.editingBookingId = booking.id;
  seasonBookingForm.querySelector('input[name="bookingId"]').value = booking.id;
  bookingSeasonSelect.value = booking.season_id;
  seasonBookingForm.querySelector('input[name="fullName"]').value = booking.full_name;
  seasonBookingForm.querySelector('input[name="phone"]').value = booking.phone || "";
  bookingPackageSelect.value = booking.package_type;

  Array.from(seasonBookingForm.querySelectorAll('input[name="selectedDays"]')).forEach((input) => {
    input.checked = Array.isArray(booking.selected_days) && booking.selected_days.includes(input.value);
  });

  syncBookingDayInputs();
  if (saveBookingBtn) {
    saveBookingBtn.textContent = "Buchung aktualisieren";
  }
  cancelBookingEditBtn?.classList.remove("hidden");
  scrollToSection("#bookingPanel");
}

function resetBookingForm() {
  if (!seasonBookingForm) {
    return;
  }

  state.editingBookingId = null;
  seasonBookingForm.reset();
  seasonBookingForm.querySelector('input[name="bookingId"]').value = "";
  if (bookingSeasonSelect && state.selectedSeasonId) {
    bookingSeasonSelect.value = state.selectedSeasonId;
  }
  if (saveBookingBtn) {
    saveBookingBtn.textContent = "Buchung speichern";
  }
  cancelBookingEditBtn?.classList.add("hidden");
  syncBookingDayInputs();
}

async function handleParticipantMove(participant, currentCourse) {
  if (!participant || !currentCourse || !canEditCourse(currentCourse)) {
    return;
  }

  if (state.isOffline) {
    notify("Umbuchungen sind nur online moeglich.", true);
    return;
  }

  if (!moveParticipantModal || !moveParticipantTargetCourse || !moveParticipantText) {
    notify("Umbuchungsfenster konnte nicht geoeffnet werden.", true);
    return;
  }

  const sessionDate = getEffectiveAttendanceDate();
  const booking = getParticipantSeasonBooking(participant);
  const activeSession = booking ? getSessionForCourseAndDate(currentCourse.id, sessionDate) : null;
  const incomingOverride = activeSession ? getSessionOverrideForTarget(participant.id, activeSession.id) : null;

  if (incomingOverride) {
    const removeConfirmed = window.confirm(`Soll die Einzeltermin-Umbuchung fuer ${participant.full_name} wieder aufgehoben werden?`);
    if (!removeConfirmed) {
      return;
    }
    await removeSessionOverride(incomingOverride, participant.full_name);
    return;
  }

  if (booking) {
    const bookingSeason = state.seasons.find((entry) => entry.id === booking.season_id);
    if (bookingSeason && (sessionDate < bookingSeason.start_date || sessionDate > bookingSeason.end_date)) {
      notify(`Termin-Umbuchungen sind nur innerhalb der Season ${bookingSeason.name} moeglich.`, true);
      return;
    }

    let sourceSessionId = activeSession?.id || null;
    if (!sourceSessionId) {
      try {
        sourceSessionId = await ensureSession(currentCourse.id, sessionDate);
      } catch (error) {
        notify(error.message, true);
        return;
      }
    }

    const availableSessions = getAvailableSessionMoveTargets(participant, booking, sourceSessionId);
    if (!availableSessions.length) {
      notify("Fuer diese Buchung gibt es in der Season aktuell keinen passenden Ausweichtermin auf einem anderen Trainingstag.", true);
      return;
    }

    state.moveParticipantContext = {
      mode: "session",
      participantId: participant.id,
      bookingId: booking.id,
      currentCourseId: currentCourse.id,
      sourceSessionId,
      availableTargetSessionIds: availableSessions.map((entry) => entry.session.id),
    };

    if (moveParticipantTitle) {
      moveParticipantTitle.textContent = "Einzeltermin umbuchen";
    }
    if (moveParticipantTargetLabel) {
      moveParticipantTargetLabel.textContent = "Zieltermin";
    }
    if (moveParticipantSubmitBtn) {
      moveParticipantSubmitBtn.textContent = "Termin-Umbuchung speichern";
    }
    moveParticipantText.textContent = `${participant.full_name} wird nur fuer den Termin am ${formatDateLabel(sessionDate)} auf einen konkreten Ersatztermin umgebucht. Die Season-Buchung bleibt dabei unveraendert.`;
    moveParticipantTargetCourse.innerHTML = "";
    availableSessions.forEach(({ session, course }) => {
      const option = document.createElement("option");
      option.value = session.id;
      option.textContent = `${formatDateLabel(session.session_date)} | ${course.name} (${course.weekday}${course.time ? `, ${course.time} Uhr` : ""})`;
      moveParticipantTargetCourse.appendChild(option);
    });
    moveParticipantModal.classList.remove("hidden");
    return;
  }

  const availableCourses = state.courses.filter((course) => course.id !== currentCourse.id);
  if (!availableCourses.length) {
    notify("Es gibt keinen anderen Kurs zum Umbuchen.", true);
    return;
  }

  state.moveParticipantContext = {
    mode: "permanent",
    participantId: participant.id,
    currentCourseId: currentCourse.id,
    availableCourseIds: availableCourses.map((course) => course.id),
  };

  if (moveParticipantTitle) {
    moveParticipantTitle.textContent = "Teilnehmer umbuchen";
  }
  if (moveParticipantTargetLabel) {
    moveParticipantTargetLabel.textContent = "Zielkurs";
  }
  if (moveParticipantSubmitBtn) {
    moveParticipantSubmitBtn.textContent = "Umbuchung speichern";
  }
  moveParticipantText.textContent = `${participant.full_name} von ${currentCourse.name} in einen anderen Kurs verschieben.`;
  moveParticipantTargetCourse.innerHTML = "";
  availableCourses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.name} (${course.weekday}${course.time ? `, ${course.time} Uhr` : ""})`;
    moveParticipantTargetCourse.appendChild(option);
  });
  moveParticipantModal.classList.remove("hidden");
}

async function handleMoveParticipantSubmit(event) {
  event.preventDefault();

  const context = state.moveParticipantContext;
  if (!context) {
    return;
  }

  const participant = state.participants.find((entry) => entry.id === context.participantId);
  const currentCourse = state.courses.find((entry) => entry.id === context.currentCourseId);
  if (!participant || !currentCourse) {
    notify("Umbuchung konnte nicht vorbereitet werden.", true);
    closeMoveParticipantModal();
    return;
  }

  if (context.mode === "session") {
    const booking = state.seasonBookings.find((entry) => entry.id === context.bookingId);
    const targetSession = state.sessions.find((entry) => entry.id === moveParticipantTargetCourse.value);
    const sourceSession = state.sessions.find((entry) => entry.id === context.sourceSessionId);
    const targetCourse = targetSession ? state.courses.find((entry) => entry.id === targetSession.course_id) : null;

    if (!booking || !targetSession || !sourceSession || !targetCourse) {
      notify("Der Zieltermin konnte nicht aufgeloest werden.", true);
      closeMoveParticipantModal();
      return;
    }

    const existingOverride = getSessionOverrideForSource(participant.id, sourceSession.id);
    if (existingOverride) {
      const removeResult = await state.supabase
        .from("session_overrides")
        .delete()
        .eq("id", existingOverride.id);

      if (removeResult.error) {
        notify(getFriendlySupabaseMessage(removeResult.error, "Vorherige Termin-Umbuchung konnte nicht ersetzt werden."), true);
        return;
      }
    }

    const overrideResult = await state.supabase
      .from("session_overrides")
      .insert({
        season_booking_id: booking.id,
        participant_id: participant.id,
        source_session_id: sourceSession.id,
        target_session_id: targetSession.id,
      })
      .select("id, season_booking_id, participant_id, source_session_id, target_session_id, created_at")
      .single();

    if (overrideResult.error) {
      notify(getFriendlySupabaseMessage(overrideResult.error, "Einzeltermin-Umbuchung konnte nicht gespeichert werden."), true);
      return;
    }

    state.sessionOverrides = [
      overrideResult.data,
      ...state.sessionOverrides.filter((entry) => entry.id !== overrideResult.data.id && !(entry.participant_id === participant.id && entry.source_session_id === sourceSession.id)),
    ];
    if (attendanceDate) {
      attendanceDate.value = targetSession.session_date;
    }
    state.selectedCourseId = targetCourse.id;
    closeMoveParticipantModal();
    render();
    notify(`${participant.full_name} wurde fuer ${formatDateLabel(targetSession.session_date)} nach ${targetCourse.name} umgebucht.`);
    await refreshVisibleData({ context: "Session override refresh", silent: true });
    return;
  }

  const targetCourse = state.courses.find((entry) => entry.id === moveParticipantTargetCourse.value);
  if (!targetCourse) {
    notify("Umbuchung konnte nicht vorbereitet werden.", true);
    closeMoveParticipantModal();
    return;
  }

  if (participant.season_booking_id) {
    const booking = state.seasonBookings.find((entry) => entry.id === participant.season_booking_id);
    if (booking) {
      const currentWeekday = currentCourse.weekday;
      const nextWeekday = targetCourse.weekday;
      const alreadyIncluded = booking.selected_days.includes(nextWeekday) && nextWeekday !== currentWeekday;

      if (alreadyIncluded) {
        notify(`Der Zieltag ${nextWeekday} ist in dieser Season-Buchung bereits enthalten.`, true);
        return;
      }

      const updatedDays = booking.selected_days.map((day) => day === currentWeekday ? nextWeekday : day);
      const bookingResult = await state.supabase
        .from("season_bookings")
        .update({ selected_days: updatedDays })
        .eq("id", booking.id);

      if (bookingResult.error) {
        notify(getFriendlySupabaseMessage(bookingResult.error, "Season-Buchung konnte nicht angepasst werden."), true);
        return;
      }
    }
  }

  const participantResult = await state.supabase
    .from("participants")
    .update({ course_id: targetCourse.id })
    .eq("id", participant.id);

  if (participantResult.error) {
    notify(getFriendlySupabaseMessage(participantResult.error, "Teilnehmer konnte nicht umgebucht werden."), true);
    return;
  }

  closeMoveParticipantModal();
  await fetchVisibleCourses();
  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`${participant.full_name} wurde nach ${targetCourse.name} umgebucht.`);
}

function closeMoveParticipantModal() {
  state.moveParticipantContext = null;
  moveParticipantModal?.classList.add("hidden");
  moveParticipantForm?.reset();
}

async function handleTrialCreate(event) {
  event.preventDefault();

  if (!state.supabase) {
    return;
  }

  const formData = new FormData(trialForm);
  const sessionId = normalizeOptionalId(formData.get("sessionId"));
  const selectedSession = sessionId ? state.sessions.find((entry) => entry.id === sessionId) : null;
  if (!selectedSession) {
    notify("Bitte zuerst einen gueltigen Season-Termin fuer das Probetraining auswaehlen.", true);
    return;
  }
  const { error } = await state.supabase
    .from("trial_requests")
    .insert({
      course_id: selectedSession.course_id,
      attendance_session_id: selectedSession.id,
      full_name: String(formData.get("fullName")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      status: "angefragt",
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  trialForm.reset();
  await fetchSupportData();
  render();
  notify("Probetraining angelegt.");
}

async function handleDropInCreate(event) {
  event.preventDefault();

  if (!state.supabase) {
    return;
  }

  const formData = new FormData(dropInForm);
  const sessionId = normalizeOptionalId(formData.get("sessionId"));
  const selectedSession = sessionId ? state.sessions.find((entry) => entry.id === sessionId) : null;
  if (!selectedSession) {
    notify("Bitte zuerst einen gueltigen Season-Termin fuer den DROP-IN auswaehlen.", true);
    return;
  }

  const { error } = await state.supabase
    .from("drop_in_bookings")
    .insert({
      course_id: selectedSession.course_id,
      attendance_session_id: selectedSession.id,
      full_name: String(formData.get("fullName")).trim(),
      email: String(formData.get("email")).trim(),
      phone: String(formData.get("phone")).trim(),
      status: "gebucht",
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  dropInForm.reset();
  await fetchSupportData();
  render();
  notify("DROP-IN angelegt.");
}

function render() {
  const connected = Boolean(state.supabase);
  const loggedIn = Boolean(state.session && state.profile);
  const appUnlocked = loggedIn && (state.profile.role === "admin" || state.profile.role === "trainer");
  const recoveryMode = isRecoveryMode();
  const availableSections = getAvailableSections({ connected, loggedIn, appUnlocked });
  ensureActiveSection(availableSections, { connected, loggedIn, appUnlocked });

  contentPanels.forEach((panel) => {
    const panelId = `#${panel.id}`;
    const shouldShow = availableSections.includes(panelId) && state.activeSection === panelId;
    panel.classList.toggle("hidden", !shouldShow);
  });

  updatePasswordForm.classList.toggle("hidden", !loggedIn || !recoveryMode || state.activeSection !== "#sessionPanel");

  statusHeadline.textContent = loggedIn
    ? state.profile.role === "pending"
      ? "Freigabe ausstehend"
      : recoveryMode
        ? "Passwort aktualisieren"
        : "Bereit fuer den Einsatz"
    : connected
      ? "Bitte anmelden"
      : "Setup erforderlich";
  statusText.textContent = loggedIn
    ? state.profile.role === "pending"
      ? "Konto angelegt, aber noch ohne gueltige Einladung freigeschaltet."
      : `${state.profile.full_name} ist angemeldet`
    : connected
      ? "Supabase ist verbunden. Bitte einloggen oder Konto anlegen."
      : "Bitte config.js und Supabase-Schema einrichten.";
  if (statusMeta && !statusMeta.dataset.locked) {
    statusMeta.textContent = loggedIn
      ? "Bereit fuer den Tagesbetrieb"
      : connected
        ? "Warte auf Anmeldung"
        : "Setup offen";
  }
  backendStatus.textContent = connected ? "Supabase verbunden" : "Nicht verbunden";
  offlineStatus.textContent = "Live-Daten aktiv";
  userStatus.textContent = loggedIn ? state.profile.full_name : "Niemand angemeldet";
  sessionName.textContent = state.profile?.full_name || "-";
  sessionRole.textContent = state.profile?.role || "-";
  sessionMode.textContent = state.profile?.role === "trainer" ? "Heute zuerst" : state.profile?.role === "admin" ? "Dashboard zuerst" : "-";
  if (deleteCourseBtn) {
    deleteCourseBtn.disabled = !isAdmin() || !state.selectedCourseId;
  }

  renderSeasonSelects();
  renderSeasonDateEditor();
  renderSeasons();
  renderSeasonBookings();
  renderTrainerSelect();
  renderTrainerDirectory();
  renderTrialCourseSelect();
  renderDropInSessionSelect();
  renderInvites();
  renderTrials();
  renderDropIns();
  renderTodayDashboard();
  renderCourseList();
  renderPlanning();
  renderParticipants();
  renderAttendanceSessionOptions();
  renderMonthlyOverview();
  renderStats();
  renderBusinessDashboard();
  renderReportPreview();
  renderMobileSessionSummary();
  renderParticipantProfile();
  updateActiveNavLink();
}

function applyRoleLanding() {
  if (!state.profile) {
    return;
  }

  if (state.profile.role === "trainer") {
    setTimeout(() => {
      setActiveSection("#todayPanel");
    }, 0);
    return;
  }

  if (state.profile.role === "admin") {
    setTimeout(() => {
      setActiveSection("#todayPanel");
    }, 0);
  }
}

function renderTodayDashboard() {
  todayCards.innerHTML = "";
  if (todayInsights) {
    todayInsights.innerHTML = "";
  }

  if (!state.courses.length) {
    todayCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const today = getToday();
  const todaySessions = state.sessions.filter((session) => session.session_date === today);
  const todaySessionIds = new Set(todaySessions.map((session) => session.id));
  const todayRecords = state.records.filter((record) => todaySessionIds.has(record.session_id));
  const nextCourse = getNextCourseForToday();
  const openTrialRequests = getOpenTrialRequests();
  const nextOpenTrial = openTrialRequests[0] || null;

  const items = [
    {
      title: "Heute geplante Sessions",
      value: todaySessions.length,
      meta: formatDateLabel(today),
    },
    {
      title: "Heutige Check-ins",
      value: todayRecords.filter((record) => record.present).length,
      meta: "aktuell anwesend markiert",
    },
    {
      title: "Offene Probetrainings",
      value: openTrialRequests.length,
      meta: nextOpenTrial ? formatTrialSessionLabel(nextOpenTrial) : "aktuell keine offenen Probetrainings",
      action: nextOpenTrial
        ? () => {
            openTrialInAttendance(nextOpenTrial);
          }
        : null,
    },
    {
      title: "Naechster Fokus",
      value: nextCourse ? nextCourse.name : "Kein weiterer Kurs heute",
      meta: nextCourse?.time ? `${nextCourse.time} Uhr` : "kein Termin geplant",
    },
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    if (item.action) {
      card.classList.add("stat-card-clickable");
      card.role = "button";
      card.tabIndex = 0;
      card.addEventListener("click", item.action);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.action();
        }
      });
    }
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    todayCards.appendChild(card);
  });

  if (!todayInsights) {
    return;
  }

  const activeSeason = getSelectedSeason() || state.seasons.find((season) => season.status === "aktiv") || null;
  if (!activeSeason) {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>Season-Fokus</h3>
      <p class="stat-meta">Noch keine aktive Season vorhanden.</p>
    `;
    todayInsights.appendChild(card);
    return;
  }

  const activeBookings = state.seasonBookings.filter((booking) => booking.season_id === activeSeason.id);
  const renewalCandidates = getRenewalCandidates(activeSeason.id);
  const rewardSummary = activeBookings.reduce((sum, booking) => sum + getFreeSeasonRewardStatus(booking).achievedRewards, 0);
  const rewardReadyCount = activeBookings.filter((booking) => getFreeSeasonRewardStatus(booking).achievedRewards > 0).length;
  const rewardNearCount = activeBookings.filter((booking) => {
    const reward = getFreeSeasonRewardStatus(booking);
    return reward.achievedRewards === 0 && reward.remainingToNext > 0 && reward.remainingToNext <= 1;
  }).length;
  const packageSummary = [
    { label: "1x TRAIN", count: activeBookings.filter((booking) => booking.package_type === "1x TRAIN").length },
    { label: "2x BEAT", count: activeBookings.filter((booking) => booking.package_type === "2x BEAT").length },
    { label: "3x REPEAT", count: activeBookings.filter((booking) => booking.package_type === "3x REPEAT").length },
  ];

  const nextSeason = getNextSeasonForRenewal(activeSeason);
  const insightCards = [
    {
      title: "Aktive Season",
      value: activeSeason.name,
      meta: `${activeSeason.start_date} bis ${activeSeason.end_date}`,
      tone: "ok",
    },
    {
      title: "Verlaengerung",
      value: nextSeason ? nextSeason.name : "Noch keine Folge-Season",
      meta: nextSeason ? "Verlaengerung moeglich" : "am besten jetzt duplizieren",
      tone: nextSeason ? "ok" : "warn",
    },
    {
      title: "Paketmix",
      value: packageSummary.map((entry) => `${entry.label}: ${entry.count}`).join(" | "),
      meta: `${activeBookings.length} aktive Buchungen`,
      tone: "neutral",
    },
    {
      title: "Rueckhol-Kandidaten",
      value: renewalCandidates.length,
      meta: "unter 60% Teilnahme in aktiver Season",
      tone: renewalCandidates.length ? "critical" : "ok",
    },
    {
      title: "Gratis-Seasons",
      value: rewardSummary,
      meta: rewardReadyCount
        ? `${rewardReadyCount} Teilnehmer mit freier Season`
        : rewardNearCount
          ? `${rewardNearCount} Teilnehmer kurz vor der Freistufe`
          : "noch keine freigeschaltete Gratis-Season",
      tone: rewardSummary || rewardNearCount ? "warn" : "neutral",
    },
  ];

  insightCards.forEach((item) => {
    const card = document.createElement("article");
    card.className = `stat-card dashboard-card dashboard-card-${item.tone || "neutral"}`;
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    todayInsights.appendChild(card);
  });

  const renewalCard = document.createElement("article");
  renewalCard.className = `stat-card dashboard-card ${nextSeason ? "dashboard-card-ok" : "dashboard-card-warn"}`;
  renewalCard.innerHTML = `
    <h3>Naechste Verlaengerungen</h3>
    <p class="stat-meta">${escapeHtml(activeSeason.name)} laeuft bis ${escapeHtml(formatDateLabel(activeSeason.end_date))}</p>
  `;
  const renewalActions = document.createElement("div");
  renewalActions.className = "stat-card-actions mini-actions";
  const prepareNextSeasonBtn = document.createElement("button");
  prepareNextSeasonBtn.type = "button";
  prepareNextSeasonBtn.className = "ghost";
  prepareNextSeasonBtn.textContent = nextSeason ? "Folge-Season oeffnen" : "Folge-Season vorbereiten";
  prepareNextSeasonBtn.addEventListener("click", async () => {
    if (nextSeason) {
      state.selectedSeasonId = nextSeason.id;
      setActiveSection("#seasonPanel");
      return;
    }

    const createdSeasonId = await handleSeasonDuplicate(activeSeason, false);
    if (!createdSeasonId) {
      return;
    }

    state.selectedSeasonId = createdSeasonId;
    setActiveSection("#seasonPanel");
  });
  renewalActions.appendChild(prepareNextSeasonBtn);
  renewalCard.appendChild(renewalActions);
  const renewalList = document.createElement("div");
  renewalList.className = "stack";
  if (activeBookings.length) {
    activeBookings.slice(0, 5).forEach((booking) => {
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(booking.full_name)}</strong>
          <div class="stat-meta">${escapeHtml(booking.package_type)} | ${escapeHtml(formatSelectedDays(booking.selected_days))}</div>
        </div>
      `;
      const rowActions = document.createElement("div");
      rowActions.className = "mini-actions";
      const carryBtn = document.createElement("button");
      carryBtn.type = "button";
      carryBtn.className = "ghost";
      carryBtn.textContent = "In Folge-Season";
      carryBtn.addEventListener("click", async () => {
        await handleCarryOverBookingToNextSeason(booking, activeSeason);
      });
      rowActions.appendChild(carryBtn);
      row.appendChild(rowActions);
      renewalList.appendChild(row);
    });
  } else {
    renewalList.innerHTML = '<p class="stat-meta">Noch keine Buchungen in dieser Season.</p>';
  }
  renewalCard.appendChild(renewalList);
  todayInsights.appendChild(renewalCard);

  const recoveryCard = document.createElement("article");
  recoveryCard.className = `stat-card dashboard-card ${renewalCandidates.length ? "dashboard-card-critical" : "dashboard-card-ok"}`;
  recoveryCard.innerHTML = `
    <h3>Rueckhol-Workflow</h3>
    <p class="stat-meta">Personen mit Luft nach oben fuer die naechste Season.</p>
  `;
  const recoveryList = document.createElement("div");
  recoveryList.className = "stack";
  if (renewalCandidates.length) {
    renewalCandidates.slice(0, 5).forEach((candidate) => {
      const row = document.createElement("div");
      const severity = getRecoverySeverity(candidate.rate);
      row.className = `list-row recovery-row recovery-row-${severity}`;
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(candidate.full_name)}</strong>
          <div class="stat-meta">${escapeHtml(candidate.package_type)} | ${candidate.rate}% Teilnahme</div>
        </div>
      `;
      const severityBadge = document.createElement("span");
      severityBadge.className = `status-pill status-pill-${severity}`;
      severityBadge.textContent = severity === "critical" ? "kritisch" : "beobachten";
      const rowActions = document.createElement("div");
      rowActions.className = "mini-actions";
      rowActions.appendChild(severityBadge);
      const profileBtn = document.createElement("button");
      profileBtn.type = "button";
      profileBtn.className = "ghost";
      profileBtn.textContent = "Profil";
      profileBtn.addEventListener("click", () => {
        openParticipantProfile(candidate.participantId, candidate.id);
      });
      rowActions.appendChild(profileBtn);
      const carryBtn = document.createElement("button");
      carryBtn.type = "button";
      carryBtn.className = "primary";
      carryBtn.textContent = "Verlaengern";
      carryBtn.addEventListener("click", async () => {
        await handleCarryOverBookingToNextSeason(candidate, activeSeason);
      });
      rowActions.appendChild(carryBtn);
      row.appendChild(rowActions);
      recoveryList.appendChild(row);
    });
  } else {
    recoveryList.innerHTML = '<p class="stat-meta">Aktuell keine Rueckhol-Kandidaten unter 60%.</p>';
  }
  recoveryCard.appendChild(recoveryList);
  todayInsights.appendChild(recoveryCard);

  const beatOutCard = document.createElement("article");
  const bookingsWithBeatOutPressure = activeBookings
    .map((booking) => {
      const usage = getBeatOutUsageForBooking(booking.id);
      const reward = getFreeSeasonRewardStatus(booking);
      return {
        booking,
        usage,
        reward,
      };
    })
    .filter((entry) => entry.usage.limit > 0)
    .sort((left, right) => {
      const rewardCompare = right.reward.achievedRewards - left.reward.achievedRewards;
      if (rewardCompare !== 0) {
        return rewardCompare;
      }
      if (left.reward.remainingToNext !== right.reward.remainingToNext) {
        return left.reward.remainingToNext - right.reward.remainingToNext;
      }
      return right.usage.used - left.usage.used;
    });

  beatOutCard.className = `stat-card dashboard-card ${bookingsWithBeatOutPressure.some((entry) => entry.reward.achievedRewards > 0 || entry.reward.remainingToNext <= 1) ? "dashboard-card-warn" : "dashboard-card-ok"}`;
  beatOutCard.innerHTML = `
    <h3>BEAT-OUT & Gratis-Seasons</h3>
    <p class="stat-meta">Wer viel gesammelt hat, kurz vor der naechsten Freistufe steht oder bereits eine Gratis-Season erreicht hat.</p>
  `;
  const beatOutList = document.createElement("div");
  beatOutList.className = "stack";
  if (bookingsWithBeatOutPressure.length) {
    bookingsWithBeatOutPressure.slice(0, 5).forEach((entry) => {
      const nextRewardMeta = entry.reward.achievedRewards > 0
        ? `${entry.reward.total} BEAT-OUTs gesamt | ${entry.reward.achievedRewards} Gratis-Season${entry.reward.achievedRewards > 1 ? "s" : ""} freigeschaltet`
        : entry.reward.nextMilestone
          ? `${entry.reward.total} BEAT-OUTs gesamt | noch ${entry.reward.remainingToNext} bis ${entry.reward.nextMilestone}`
          : `${entry.reward.total} BEAT-OUTs gesamt | hoechste Freistufe erreicht`;
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(entry.booking.full_name)}</strong>
          <div class="stat-meta">${escapeHtml(entry.booking.package_type)} | ${entry.usage.used}/${entry.usage.limit} BEAT-OUTs in dieser Season</div>
          <div class="stat-meta dashboard-detail-line">${escapeHtml(nextRewardMeta)}</div>
        </div>
      `;
      const rowActions = document.createElement("div");
      rowActions.className = "mini-actions";
      const usagePill = document.createElement("span");
      usagePill.className = `status-pill ${entry.usage.used >= entry.usage.limit ? "status-pill-warn" : "status-pill-info"}`;
      usagePill.textContent = `Season ${entry.usage.used}/${entry.usage.limit}`;
      rowActions.appendChild(usagePill);
      if (entry.reward.achievedRewards > 0) {
        const rewardPill = document.createElement("span");
        rewardPill.className = "status-pill status-pill-warn";
        rewardPill.textContent = `${entry.reward.achievedRewards} Gratis`;
        rowActions.appendChild(rewardPill);
      } else if (entry.reward.nextMilestone) {
        const nextPill = document.createElement("span");
        nextPill.className = "status-pill status-pill-info";
        nextPill.textContent = `noch ${entry.reward.remainingToNext}`;
        rowActions.appendChild(nextPill);
      }
      row.appendChild(rowActions);
      beatOutList.appendChild(row);
    });
  } else {
    beatOutList.innerHTML = '<p class="stat-meta">Noch keine BEAT-OUT-Dynamik in der aktiven Season.</p>';
  }
  beatOutCard.appendChild(beatOutList);
  todayInsights.appendChild(beatOutCard);

  const trialReminderCard = document.createElement("article");
  trialReminderCard.className = `stat-card dashboard-card ${openTrialRequests.length ? "dashboard-card-warn" : "dashboard-card-ok"}`;
  trialReminderCard.innerHTML = `
    <h3>Probetraining im Blick</h3>
    <p class="stat-meta">Offene Probetrainings und anstehende Conversion-Faelle.</p>
  `;
  const trialReminderActions = document.createElement("div");
  trialReminderActions.className = "stat-card-actions mini-actions";
  const openTrialsBtn = document.createElement("button");
  openTrialsBtn.type = "button";
  openTrialsBtn.className = "ghost";
  openTrialsBtn.textContent = "Probetrainings oeffnen";
  openTrialsBtn.addEventListener("click", () => {
    setActiveSection("#trialsPanel");
  });
  trialReminderActions.appendChild(openTrialsBtn);
  trialReminderCard.appendChild(trialReminderActions);
  const trialReminderList = document.createElement("div");
  trialReminderList.className = "stack";
  if (openTrialRequests.length) {
    openTrialRequests.slice(0, 5).forEach((trial) => {
      const row = document.createElement("div");
      row.className = "list-row trial-reminder-row";
      row.role = "button";
      row.tabIndex = 0;
      const openTrialCourse = () => openTrialInAttendance(trial);
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(trial.full_name)}</strong>
          <div class="stat-meta">${escapeHtml(formatTrialSessionLabel(trial))}</div>
        </div>
      `;
      const rowActions = document.createElement("div");
      rowActions.className = "mini-actions";
      const statusPill = document.createElement("span");
      statusPill.className = `status-pill ${trial.status === "teilgenommen" ? "status-pill-warn" : "status-pill-info"}`;
      statusPill.textContent = trial.status === "teilgenommen" ? "Conversion offen" : escapeHtml(trial.status);
      rowActions.appendChild(statusPill);
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "ghost";
      openBtn.textContent = "Zum Kurs";
      openBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openTrialCourse();
      });
      rowActions.appendChild(openBtn);
      row.appendChild(rowActions);
      row.addEventListener("click", openTrialCourse);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTrialCourse();
        }
      });
      trialReminderList.appendChild(row);
    });
  } else {
    trialReminderList.innerHTML = '<p class="stat-meta">Aktuell keine offenen Probetrainings.</p>';
  }
  trialReminderCard.appendChild(trialReminderList);
  todayInsights.appendChild(trialReminderCard);
}

function openTrialInAttendance(trial) {
  const session = trial?.attendance_session_id
    ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
    : null;
  if (trial?.course_id) {
    state.selectedCourseId = trial.course_id;
  }
  if (session?.season_id) {
    state.attendanceSeasonId = session.season_id;
  }
  if (session?.session_date && attendanceDate) {
    attendanceDate.value = session.session_date;
  }
  setActiveSection("#attendancePanel");
}

function openDropInInAttendance(dropIn) {
  const session = dropIn?.attendance_session_id
    ? state.sessions.find((entry) => entry.id === dropIn.attendance_session_id) || null
    : null;
  if (dropIn?.course_id) {
    state.selectedCourseId = dropIn.course_id;
  }
  if (session?.season_id) {
    state.attendanceSeasonId = session.season_id;
  }
  if (session?.session_date && attendanceDate) {
    attendanceDate.value = session.session_date;
  }
  setActiveSection("#attendancePanel");
}

function renderPlanning() {
  planningPreview.innerHTML = "";

  const course = getSelectedCourse();
  if (!course) {
    planningPreview.appendChild(emptyStateTemplate.content.cloneNode(true));
    planNextBtn.disabled = true;
    planMonthBtn.disabled = true;
    return;
  }

  const canPlan = canEditCourse(course);
  planNextBtn.disabled = !canPlan;
  planMonthBtn.disabled = !canPlan;

  const nextDates = getUpcomingCourseDates(course, 6);
  if (!nextDates.length) {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(course.name)}</h3>
      <p class="stat-meta">Bitte Wochentag im Kurs pflegen, damit Termine geplant werden koennen.</p>
    `;
    planningPreview.appendChild(card);
    return;
  }

  nextDates.forEach((date) => {
    const exists = Boolean(getSessionForCourseAndDate(course.id, date));
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(formatDateLabel(date))}</h3>
      <p class="stat-meta">${escapeHtml(course.name)}</p>
      <p class="stat-meta">${course.time ? `${escapeHtml(course.time)} Uhr` : "Uhrzeit offen"}</p>
      <p class="stat-meta">${exists ? "Bereits geplant" : "Noch nicht angelegt"}</p>
    `;
    planningPreview.appendChild(card);
  });
}

function renderSeasonSelects() {
  if (!attendanceSeasonSelect && !bookingSeasonSelect) {
    return;
  }

  if (attendanceSeasonSelect) {
    attendanceSeasonSelect.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "Alle Seasons";
    attendanceSeasonSelect.appendChild(allOption);

    state.seasons.forEach((season) => {
      const option = document.createElement("option");
      option.value = season.id;
      option.textContent = `${season.name} (${season.start_date} - ${season.end_date})`;
      attendanceSeasonSelect.appendChild(option);
    });

      attendanceSeasonSelect.value = state.attendanceSeasonId || "";
  }

  if (bookingSeasonSelect) {
    bookingSeasonSelect.innerHTML = "";
    state.seasons.forEach((season) => {
      const option = document.createElement("option");
      option.value = season.id;
      option.textContent = `${season.name} (${season.start_date} - ${season.end_date})`;
      bookingSeasonSelect.appendChild(option);
    });

      bookingSeasonSelect.value = state.selectedSeasonId || state.seasons[0]?.id || "";
  }

  syncBookingDayInputs();
}

function renderSeasonDateEditor() {
  if (!seasonForm || !seasonDatePreview) {
    return;
  }

  const seasonDatesInput = seasonForm.querySelector('textarea[name="seasonDates"]');
  if (seasonDatesInput) {
    seasonDatesInput.value = state.seasonDraftDates.join(", ");
  }

  seasonDatePreview.innerHTML = "";
  if (!state.seasonDraftDates.length) {
    const empty = document.createElement("p");
    empty.className = "stat-meta";
    empty.textContent = "Noch keine exakten Season-Termine gepflegt.";
    seasonDatePreview.appendChild(empty);
    return;
  }

  state.seasonDraftDates.forEach((dateValue) => {
    const chip = document.createElement("div");
    chip.className = "season-date-chip";
    chip.innerHTML = `
      <span>${escapeHtml(formatDateLabel(dateValue))}</span>
      <button type="button" class="ghost">Entfernen</button>
    `;
    chip.querySelector("button").addEventListener("click", () => {
      state.seasonDraftDates = state.seasonDraftDates.filter((entry) => entry !== dateValue);
      renderSeasonDateEditor();
    });
    seasonDatePreview.appendChild(chip);
  });
}

function renderAttendanceSessionOptions() {
  if (!attendanceSessionPicker || !attendanceSessionSelect) {
    return;
  }

  const course = getSelectedCourse();
  const season = getSelectedSeason();
  if (!course || !season) {
    attendanceSessionPicker.classList.add("hidden");
    attendanceSessionSelect.innerHTML = "";
    return;
  }

  const sessions = getSeasonSessionsForCourse(season.id, course.id);
  if (!sessions.length) {
    attendanceSessionPicker.classList.add("hidden");
    attendanceSessionSelect.innerHTML = "";
    return;
  }

  attendanceSessionPicker.classList.remove("hidden");
  attendanceSessionSelect.innerHTML = "";
  sessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session.session_date;
    option.textContent = `${formatDateLabel(session.session_date)}${course.time ? ` | ${course.time} Uhr` : ""}`;
    attendanceSessionSelect.appendChild(option);
  });

  syncAttendanceDateWithSeasonSessions();
  attendanceSessionSelect.value = attendanceDate?.value || sessions[0].session_date;
}

function renderSeasons() {
  if (!seasonList) {
    return;
  }

  seasonList.innerHTML = "";

  if (!isAdmin()) {
    return;
  }

  const visibleSeasons = getVisibleSeasons();
  if (!visibleSeasons.length) {
    seasonList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  visibleSeasons.forEach((season) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    const bookings = state.seasonBookings.filter((booking) => booking.season_id === season.id);
    const trainingDates = getSeasonTrainingDates(season.id);
    card.innerHTML = `
      <h3>${escapeHtml(season.name)}</h3>
      <p class="stat-meta">${escapeHtml(season.start_date)} bis ${escapeHtml(season.end_date)}</p>
      <p class="stat-meta">Status: ${escapeHtml(season.status)}</p>
      <p class="stat-meta">${bookings.length} Buchungen</p>
    `;

    const schedule = renderSeasonTrainingSchedule(trainingDates);
    card.appendChild(schedule);

    const actions = document.createElement("div");
    actions.className = "stat-card-actions";
    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "ghost";
    selectBtn.textContent = "Als aktive Season nutzen";
    selectBtn.addEventListener("click", () => {
      state.selectedSeasonId = season.id;
      render();
      scrollToSection("#bookingPanel");
    });
    actions.appendChild(selectBtn);

    const duplicateBtn = document.createElement("button");
    duplicateBtn.type = "button";
    duplicateBtn.className = "ghost";
    duplicateBtn.textContent = "Season duplizieren";
    duplicateBtn.addEventListener("click", async () => {
      await handleSeasonDuplicate(season, false);
    });
    actions.appendChild(duplicateBtn);

    const carryOverBtn = document.createElement("button");
    carryOverBtn.type = "button";
    carryOverBtn.className = "primary";
    carryOverBtn.textContent = "Teilnehmer uebernehmen";
    carryOverBtn.addEventListener("click", async () => {
      await handleSeasonDuplicate(season, true);
    });
    actions.appendChild(carryOverBtn);

    if (season.status !== "aktiv") {
      const activateBtn = document.createElement("button");
      activateBtn.type = "button";
      activateBtn.className = "ghost";
      activateBtn.textContent = "Aktiv setzen";
      activateBtn.addEventListener("click", async () => {
        await handleSeasonStatusUpdate(season, "aktiv");
      });
      actions.appendChild(activateBtn);
    }

    if (season.status !== "abgeschlossen") {
      const archiveBtn = document.createElement("button");
      archiveBtn.type = "button";
      archiveBtn.className = "danger";
      archiveBtn.textContent = "Season abschliessen";
      archiveBtn.addEventListener("click", async () => {
        await handleSeasonArchive(season);
      });
      actions.appendChild(archiveBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Season loeschen";
    deleteBtn.addEventListener("click", async () => {
      await handleSeasonDelete(season);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    seasonList.appendChild(card);
  });
}

function renderSeasonTrainingSchedule(trainingDates) {
  const wrapper = document.createElement("div");
  wrapper.className = "season-schedule";

  if (!trainingDates.length) {
    const empty = document.createElement("p");
    empty.className = "stat-meta";
    empty.textContent = "Noch keine Termine erzeugt";
    wrapper.appendChild(empty);
    return wrapper;
  }

  const groupedByMonth = new Map();
  trainingDates.forEach((dateValue) => {
    const date = new Date(`${dateValue}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groupedByMonth.has(key)) {
      groupedByMonth.set(key, []);
    }
    groupedByMonth.get(key).push(dateValue);
  });

  Array.from(groupedByMonth.entries()).forEach(([monthKey, monthDates]) => {
    wrapper.appendChild(renderSeasonCalendarMonth(monthKey, monthDates));
  });

  return wrapper;
}

function renderSeasonCalendarMonth(monthKey, trainingDates) {
  const [year, month] = monthKey.split("-").map(Number);
  const section = document.createElement("div");
  section.className = "season-calendar";

  const title = document.createElement("strong");
  title.className = "season-calendar-title";
  title.textContent = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  section.appendChild(title);

  const weekdays = document.createElement("div");
  weekdays.className = "season-calendar-weekdays";
  ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].forEach((label) => {
    const weekdayCell = document.createElement("span");
    weekdayCell.textContent = label;
    weekdays.appendChild(weekdayCell);
  });
  section.appendChild(weekdays);

  const grid = document.createElement("div");
  grid.className = "season-calendar-grid";
  const firstDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = (firstDate.getDay() + 6) % 7;
  const trainingSet = new Set(trainingDates);

  for (let index = 0; index < offset; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "season-calendar-day is-empty";
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayCell = document.createElement("span");
    dayCell.className = `season-calendar-day${trainingSet.has(dateValue) ? " is-training" : ""}`;
    dayCell.textContent = String(day);
    if (trainingSet.has(dateValue)) {
      dayCell.title = formatDateLabel(dateValue);
    }
    grid.appendChild(dayCell);
  }

  section.appendChild(grid);

  const chips = document.createElement("div");
  chips.className = "season-schedule-chips";
  trainingDates.forEach((dateValue) => {
    const chip = document.createElement("span");
    chip.className = "season-schedule-chip";
    chip.textContent = `${getWeekdayLabelFromDate(dateValue)}, ${formatCompactDateLabel(dateValue)}`;
    chips.appendChild(chip);
  });
  section.appendChild(chips);

  return section;
}

function setSeasonFilter(filter) {
  state.seasonFilter = filter;
  render();
}

function renderSeasonBookings() {
  if (!bookingList) {
    return;
  }

  bookingList.innerHTML = "";

  if (!isAdmin()) {
    return;
  }

  const visibleBookings = getVisibleSeasonBookings();
  if (!visibleBookings.length) {
    bookingList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  visibleBookings.forEach((booking) => {
    const season = state.seasons.find((entry) => entry.id === booking.season_id);
    const beatOutUsage = getBeatOutUsageForBooking(booking.id);
    const rewardStatus = getFreeSeasonRewardStatus(booking);
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(booking.full_name)}</h3>
      <p class="stat-meta">${season ? escapeHtml(season.name) : "Ohne Season"}</p>
      <p class="stat-meta">Paket: ${escapeHtml(booking.package_type)}</p>
      <p class="stat-meta">Tage: ${escapeHtml(formatSelectedDays(booking.selected_days))}</p>
      <p class="stat-meta">BEAT-OUTS: ${beatOutUsage.used}/${beatOutUsage.limit}</p>
      <p class="stat-meta">Gratis-Season: ${rewardStatus.achievedRewards} erreicht</p>
      <p class="stat-meta">${booking.phone ? escapeHtml(booking.phone) : "Keine Telefonnummer"}</p>
    `;
    const actions = document.createElement("div");
    actions.className = "stat-card-actions";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "ghost";
    editBtn.textContent = "Buchung bearbeiten";
    editBtn.addEventListener("click", () => {
      openBookingEdit(booking);
    });
    actions.appendChild(editBtn);

    const profileBtn = document.createElement("button");
    profileBtn.type = "button";
    profileBtn.className = "ghost";
    profileBtn.textContent = "Profil";
    profileBtn.addEventListener("click", () => {
      const linkedParticipants = state.participants.filter((participant) => participant.season_booking_id === booking.id);
      openParticipantProfile(linkedParticipants[0]?.id || null, booking.id);
    });
    actions.appendChild(profileBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger";
    deleteBtn.textContent = "Buchung loeschen";
    deleteBtn.addEventListener("click", async () => {
      await handleBookingDelete(booking);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    bookingList.appendChild(card);
  });
}

function renderTrainerSelect() {
  trainerSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Nicht zugewiesen";
  trainerSelect.appendChild(emptyOption);

  if (state.trainers.length) {
    const authGroup = document.createElement("optgroup");
    authGroup.label = "Mit Login";

    state.trainers.forEach((trainer) => {
      const option = document.createElement("option");
      option.value = `auth:${trainer.user_id}`;
      option.textContent = `${trainer.full_name} (${trainer.role})`;
      authGroup.appendChild(option);
    });

    trainerSelect.appendChild(authGroup);
  }

  const manualEntries = state.trainerDirectory.filter((entry) => !entry.linked_user_id);
  if (manualEntries.length) {
    const manualGroup = document.createElement("optgroup");
    manualGroup.label = "Manuell eingetragen";

    manualEntries.forEach((entry) => {
      const option = document.createElement("option");
      option.value = `directory:${entry.id}`;
      option.textContent = entry.full_name;
      manualGroup.appendChild(option);
    });

    trainerSelect.appendChild(manualGroup);
  }
}

function renderTrainerDirectory() {
  trainerDirectoryList.innerHTML = "";

  if (!isAdmin()) {
    return;
  }

  if (!state.trainerDirectory.length) {
    trainerDirectoryList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.trainerDirectory.forEach((entry) => {
    const accessState = getTrainerAccessState(entry);
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(entry.full_name)}</h3>
      <p class="stat-meta">${entry.email ? escapeHtml(entry.email) : "Keine E-Mail"}</p>
      <p class="stat-meta">${entry.phone ? escapeHtml(entry.phone) : "Keine Telefonnummer"}</p>
      <p class="stat-meta">Status: ${escapeHtml(accessState.label)}</p>
    `;

    if (!entry.linked_user_id && entry.email) {
      const actions = document.createElement("div");
      actions.className = "stat-card-actions";

      const regenerateBtn = document.createElement("button");
      regenerateBtn.type = "button";
      regenerateBtn.className = "ghost";
      regenerateBtn.textContent = "Zugang neu erzeugen";
      regenerateBtn.addEventListener("click", async () => {
        await handleTrainerInviteRegenerate(entry);
      });

      actions.appendChild(regenerateBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Trainer loeschen";
      deleteBtn.addEventListener("click", async () => {
        await handleTrainerDirectoryDelete(entry);
      });
      actions.appendChild(deleteBtn);
      card.appendChild(actions);
    } else if (!entry.linked_user_id) {
      const actions = document.createElement("div");
      actions.className = "stat-card-actions";
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Trainer loeschen";
      deleteBtn.addEventListener("click", async () => {
        await handleTrainerDirectoryDelete(entry);
      });
      actions.appendChild(deleteBtn);
      card.appendChild(actions);
    }

    trainerDirectoryList.appendChild(card);
  });
}

function renderInvites() {
  inviteList.innerHTML = "";
  inviteOutput.classList.toggle("hidden", !isAdmin() || !copyInviteLinkBtn.dataset.inviteLink);

  if (!isAdmin()) {
    return;
  }

  if (!state.invites.length) {
    inviteList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.invites.forEach((invite) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(invite.code)}</h3>
      <p class="stat-meta">Rolle: ${escapeHtml(invite.role)}</p>
      <p class="stat-meta">${invite.active ? "Aktiv" : "Verwendet"}</p>
    `;
    inviteList.appendChild(card);
  });
}

function renderTrialCourseSelect() {
  renderSingleSessionSelect(trialCourseSelect);
}

function renderDropInSessionSelect() {
  renderSingleSessionSelect(dropInSessionSelect);
}

function renderSingleSessionSelect(selectElement) {
  if (!selectElement) {
    return;
  }
  selectElement.innerHTML = "";
  const preferredSeasonId = getPreferredTrialSeasonId();
  const sessionOptions = preferredSeasonId
    ? getSeasonSessions(preferredSeasonId)
    : getUpcomingTrialSessions();

  if (!sessionOptions.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = preferredSeasonId
      ? "Keine Termine in der gewaehlten Season"
      : "Keine kommenden Termine verfuegbar";
    selectElement.appendChild(option);
    return;
  }

  const groupedSessions = new Map();
  sessionOptions.forEach((session) => {
    const season = session.season_id
      ? state.seasons.find((entry) => entry.id === session.season_id) || null
      : null;
    const key = season?.id || "no-season";
    const label = season?.name || "Weitere Termine";
    if (!groupedSessions.has(key)) {
      groupedSessions.set(key, { label, sessions: [] });
    }
    groupedSessions.get(key).sessions.push(session);
  });

  Array.from(groupedSessions.values()).forEach((group) => {
    const container = document.createElement("optgroup");
    container.label = group.label;

    group.sessions.forEach((session) => {
      const course = state.courses.find((entry) => entry.id === session.course_id);
      if (!course) {
        return;
      }
      const option = document.createElement("option");
      option.value = session.id;
      option.textContent = `${formatDateLabel(session.session_date)} | ${course.name} (${course.weekday}${course.time ? `, ${course.time} Uhr` : ""})`;
      container.appendChild(option);
    });

    if (container.childElementCount) {
      selectElement.appendChild(container);
    }
  });
}

function renderTrials() {
  trialCards.innerHTML = "";

  if (!state.trialRequests.length) {
    trialCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.trialRequests.forEach((trial) => {
    const course = state.courses.find((entry) => entry.id === trial.course_id);
    const session = trial.attendance_session_id
      ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
      : null;
    const season = session?.season_id
      ? state.seasons.find((entry) => entry.id === session.season_id) || null
      : null;
    const trialMeta = session
      ? `${formatDateLabel(session.session_date)} | ${course ? escapeHtml(course.name) : "Kein Kurs"}`
      : course
        ? escapeHtml(course.name)
        : "Kein Termin";
    const pipelineMeta = getTrialPipelineMeta(trial);
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(trial.full_name)}</h3>
      <p class="stat-meta">${trialMeta}</p>
      <p class="stat-meta">${season ? escapeHtml(season.name) : "Ohne Season-Zuordnung"}</p>
      <p class="stat-meta">${trial.email ? escapeHtml(trial.email) : "Keine E-Mail"}</p>
      <p class="stat-meta">${trial.phone ? escapeHtml(trial.phone) : "Keine Telefonnummer"}</p>
      <p class="stat-meta">Status: ${escapeHtml(trial.status)}</p>
      <div class="trial-pipeline">
        <span class="status-pill ${escapeHtml(pipelineMeta.tone)}">${escapeHtml(pipelineMeta.label)}</span>
        <span class="stat-meta">${escapeHtml(pipelineMeta.meta)}</span>
      </div>
      <div class="trial-actions">
        <button type="button" class="ghost" data-trial-action="booked">Gebucht</button>
        <button type="button" class="ghost" data-trial-action="attended">Teilgenommen</button>
        <button type="button" class="primary" data-trial-action="convert">Konvertieren</button>
      </div>
    `;

    card.querySelector('[data-trial-action="booked"]').addEventListener("click", async () => {
      await updateTrialStatus(trial.id, "gebucht");
    });
    card.querySelector('[data-trial-action="attended"]').addEventListener("click", async () => {
      await updateTrialStatus(trial.id, "teilgenommen");
    });
    card.querySelector('[data-trial-action="convert"]').addEventListener("click", async () => {
      await convertTrialToParticipant(trial);
    });

    trialCards.appendChild(card);
  });
}

function renderDropIns() {
  dropInCards.innerHTML = "";

  if (!state.dropInBookings.length) {
    dropInCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.dropInBookings.forEach((dropIn) => {
    const pipelineMeta = getDropInPipelineMeta(dropIn);
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(dropIn.full_name)}</h3>
      <p class="stat-meta">${escapeHtml(formatDropInSessionLabel(dropIn))}</p>
      <p class="stat-meta">${dropIn.email ? escapeHtml(dropIn.email) : "Keine E-Mail"}</p>
      <p class="stat-meta">${dropIn.phone ? escapeHtml(dropIn.phone) : "Keine Telefonnummer"}</p>
      <p class="stat-meta">Status: ${escapeHtml(dropIn.status)}</p>
      <div class="trial-pipeline">
        <span class="status-pill ${escapeHtml(pipelineMeta.tone)}">${escapeHtml(pipelineMeta.label)}</span>
        <span class="stat-meta">${escapeHtml(pipelineMeta.meta)}</span>
      </div>
      <div class="trial-actions">
        <button type="button" class="ghost" data-dropin-action="attended">Teilgenommen</button>
        <button type="button" class="ghost" data-dropin-action="open">Zum Kurs</button>
        <button type="button" class="danger" data-dropin-action="cancel">Stornieren</button>
      </div>
    `;

    card.querySelector('[data-dropin-action="attended"]').addEventListener("click", async () => {
      await updateDropInStatus(dropIn.id, "teilgenommen");
    });
    card.querySelector('[data-dropin-action="open"]').addEventListener("click", () => {
      openDropInInAttendance(dropIn);
    });
    card.querySelector('[data-dropin-action="cancel"]').addEventListener("click", async () => {
      await handleDropInDelete(dropIn);
    });

    dropInCards.appendChild(card);
  });
}

function showInviteOutput(code) {
  const link = buildInviteLink(code);
  inviteOutput.classList.remove("hidden");
  inviteOutputCode.textContent = code;
  inviteOutputLink.textContent = link;
  inviteOutputLink.href = link;
  copyInviteLinkBtn.dataset.inviteLink = link;
}

async function handleCopyInviteLink() {
  const link = copyInviteLinkBtn.dataset.inviteLink;
  if (!link) {
    notify("Es gibt noch keinen Einladunglink zum Kopieren.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    notify("Einladungslink wurde kopiert.");
  } catch (error) {
    notify("Link konnte nicht automatisch kopiert werden.", true);
  }
}

async function updateTrialStatus(trialId, status) {
  const { error } = await state.supabase
    .from("trial_requests")
    .update({ status })
    .eq("id", trialId);

  if (error) {
    notify(error.message, true);
    return;
  }

  await fetchSupportData();
  render();
  notify(`Probetraining auf "${status}" gesetzt.`);
}

async function updateDropInStatus(dropInId, status) {
  const { error } = await state.supabase
    .from("drop_in_bookings")
    .update({ status })
    .eq("id", dropInId);

  if (error) {
    notify(error.message, true);
    return;
  }

  await fetchSupportData();
  render();
  notify(`DROP-IN auf "${status}" gesetzt.`);
}

async function handleDropInDelete(dropIn) {
  if (!dropIn) {
    return;
  }
  const shouldDelete = window.confirm(`DROP-IN von ${dropIn.full_name} wirklich stornieren?`);
  if (!shouldDelete) {
    return;
  }

  const { error } = await state.supabase
    .from("drop_in_bookings")
    .delete()
    .eq("id", dropIn.id);

  if (error) {
    notify(error.message, true);
    return;
  }

  await fetchSupportData();
  render();
  notify("DROP-IN wurde entfernt.");
}

async function convertTrialToParticipant(trial) {
  const session = trial.attendance_session_id
    ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
    : null;
  const course = trial.course_id
    ? state.courses.find((entry) => entry.id === trial.course_id) || null
    : null;

  let convertedParticipantId = null;

  if (session?.season_id && course) {
    const selectedDay = normalizeWeekdayLabel(course.weekday);
    const relevantCourses = resolveRelevantCoursesForDays([selectedDay]);
    if (!relevantCourses.ok) {
      notify(relevantCourses.message, true);
      return;
    }

    const bookingInsertResult = await state.supabase
      .from("season_bookings")
      .insert({
        season_id: session.season_id,
        full_name: trial.full_name,
        phone: trial.phone || null,
        package_type: "1x TRAIN",
        selected_days: [selectedDay],
      })
      .select("id, season_id, full_name, phone, package_type, selected_days, created_at")
      .single();

    if (bookingInsertResult.error) {
      notify(getFriendlySupabaseMessage(bookingInsertResult.error, "Probetraining konnte nicht in eine Buchung uebernommen werden."), true);
      return;
    }

    const participantSyncResult = await syncSeasonBookingParticipants({
      bookingId: bookingInsertResult.data.id,
      seasonId: session.season_id,
      fullName: trial.full_name,
      phone: trial.phone || "",
      selectedDays: [selectedDay],
      relevantCourses: relevantCourses.data,
    });

    if (!participantSyncResult.ok) {
      notify(participantSyncResult.message, true);
      await refreshVisibleData({ context: "Trial convert participant refresh", silent: true });
      return;
    }

    state.seasonBookings = [
      bookingInsertResult.data,
      ...state.seasonBookings.filter((entry) => entry.id !== bookingInsertResult.data.id),
    ].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));

    convertedParticipantId = state.participants.find((entry) => entry.season_booking_id === bookingInsertResult.data.id)?.id || null;
  } else {
    const { data, error } = await state.supabase
      .from("participants")
      .insert({
        course_id: trial.course_id,
        season_id: session?.season_id || null,
        full_name: trial.full_name,
        phone: trial.phone || "",
      })
      .select("id, course_id, full_name, phone, created_at, season_id, season_booking_id")
      .single();

    if (error) {
      notify(getFriendlySupabaseMessage(error, "Probetraining konnte nicht als Teilnehmer angelegt werden."), true);
      return;
    }

    state.participants = [
      data,
      ...state.participants.filter((entry) => entry.id !== data.id),
    ].sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));
    convertedParticipantId = data.id;
  }

  const updateResult = await state.supabase
    .from("trial_requests")
    .update({
      status: "konvertiert",
      converted_participant_id: convertedParticipantId,
    })
    .eq("id", trial.id);

  if (updateResult.error) {
    notify(getFriendlySupabaseMessage(updateResult.error, "Probetraining konnte nicht als konvertiert markiert werden."), true);
    return;
  }

  await fetchSupportData();
  render();
  notify("Probetraining wurde als regulaerer Teilnehmer uebernommen.");
}

function handleJumpToToday() {
  attendanceDate.value = getToday();
  syncAttendanceDateWithSeasonSessions();
  render();
  scrollToSection("#attendancePanel");
}

function handleFocusNextCourse() {
  const nextCourse = getNextCourseForToday();
  if (!nextCourse) {
    notify("Heute ist kein weiterer Kurs mit Terminplanung vorhanden.");
    return;
  }

  state.selectedCourseId = nextCourse.id;
  attendanceDate.value = getToday();
  syncAttendanceDateWithSeasonSessions();
  render();
  scrollToSection("#attendancePanel");
}

function renderCourseList() {
  courseList.innerHTML = "";

  if (!state.courses.length) {
    courseList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.courses.forEach((course) => {
    const trainer = getCourseTrainerName(course);
    const card = document.createElement("article");
    card.className = `course-card${course.id === state.selectedCourseId ? " active" : ""}`;
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="course-card-body">
        <h3>${escapeHtml(course.name)}</h3>
        <p class="course-meta">${escapeHtml(course.weekday)}${course.time ? ` - ${escapeHtml(course.time)} Uhr` : ""}</p>
        <p class="course-meta">${course.location ? escapeHtml(course.location) : "Ort noch nicht eingetragen"}</p>
        <p class="course-meta">Trainer: ${escapeHtml(trainer)}</p>
      </div>
    `;

    const openCourse = () => {
      state.selectedCourseId = course.id;
      render();
      scrollToSection("#attendancePanel");
    };

    card.addEventListener("click", openCourse);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCourse();
      }
    });

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "ghost";
    selectBtn.textContent = "Kurs oeffnen";
    selectBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openCourse();
    });

    const actions = document.createElement("div");
    actions.className = "stat-card-actions";
    actions.appendChild(selectBtn);

    if (isAdmin()) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Kurs loeschen";
      deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        state.selectedCourseId = course.id;
        await handleCourseDelete();
      });
      actions.appendChild(deleteBtn);
    }

    card.appendChild(actions);
    courseList.appendChild(card);
  });
}

function renderParticipants() {
  const course = getSelectedCourse();
  const season = getSelectedSeason();
  participantTableBody.innerHTML = "";
  participantCards.innerHTML = "";

  if (!course) {
    participantSectionTitle.textContent = "Bitte zuerst einen Kurs auswaehlen";
    courseActions.classList.add("hidden");
    return;
  }

  participantSectionTitle.textContent = season
    ? `${course.name} | ${season.name}`
    : `${course.name} verwalten`;
  courseActions.classList.remove("hidden");
  participantForm.classList.toggle("hidden", !canEditCourse(course));
  participantFormNotice?.classList.toggle("hidden", true);
  markAllPresentBtn.disabled = !canEditCourse(course);
  markAllAbsentBtn.disabled = !canEditCourse(course);
  const sessionDate = getEffectiveAttendanceDate();
  const session = getSessionForCourseAndDate(course.id, sessionDate);
  const records = getRecordsForSession(session?.id);
  const sessionParticipants = getFilteredParticipants(course.id, session?.id);

  if (!sessionParticipants.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5"><div class="empty-state"><p>Keine Teilnehmer fuer die aktuelle Suche gefunden.</p></div></td>`;
    participantTableBody.appendChild(row);
    participantCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  sessionParticipants.forEach((participant) => {
    const isTrialParticipant = Boolean(participant.is_trial);
    const isDropInParticipant = Boolean(participant.is_dropin);
    const record = records.find((entry) => entry.participant_id === participant.id);
    const isPresent = isDropInParticipant
      ? participant.drop_in_status === "teilgenommen"
      : Boolean(record?.present);
    const booking = getParticipantSeasonBooking(participant);
    const beatOutEntry = getBeatOutEntryForParticipantSession(participant.id, session?.id);
    const bookingUsage = getBeatOutUsageForBooking(booking?.id);
    const rate = isTrialParticipant
      ? "Probe"
      : isDropInParticipant
        ? "Drop-In"
        : calculateAttendanceRate(course.id, participant.id);
    const rateBadge = isTrialParticipant
      ? "Probe"
      : isDropInParticipant
        ? "Drop-In"
        : `${rate}%`;
    const targetOverride = session?.id ? getSessionOverrideForTarget(participant.id, session.id) : null;
    const overrideMeta = targetOverride ? getSessionOverrideLabel(targetOverride) : "";
    const overrideBadge = targetOverride
      ? `<div class="participant-override"><span class="status-pill status-pill-info">Ersatztermin</span><span class="participant-override-text">${escapeHtml(overrideMeta)}</span></div>`
      : "";
    const trialBadge = isTrialParticipant ? '<div class="participant-override"><span class="status-pill status-pill-info">Probetraining</span></div>' : "";
    const dropInBadge = isDropInParticipant ? '<div class="participant-override"><span class="status-pill status-pill-warn">DROP-IN</span></div>' : "";

    const row = document.createElement("tr");
    row.className = [
      targetOverride ? "participant-row-override" : "",
      isTrialParticipant ? "participant-row-trial" : "",
      isDropInParticipant ? "participant-row-dropin" : "",
    ].filter(Boolean).join(" ");
    row.innerHTML = `
      <td>${isTrialParticipant || isDropInParticipant ? escapeHtml(participant.full_name) : `<button type="button" class="link-button participant-profile-btn">${escapeHtml(participant.full_name)}</button>`}</td>
      <td>
        <div class="participant-meta-stack">
          <div>${participant.phone ? escapeHtml(participant.phone) : '<span class="muted">-</span>'}</div>
          ${booking ? `<div class="stat-meta beatout-meta">BEAT-OUT ${bookingUsage.used}/${bookingUsage.limit}</div>` : ""}
          ${trialBadge}
          ${dropInBadge}
          ${overrideBadge}
        </div>
      </td>
      <td><button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button></td>
      <td><span class="badge">${rateBadge}</span></td>
      <td>
        <div class="mini-actions table-actions">
          <button type="button" class="ghost participant-beatout-btn${beatOutEntry ? " is-active" : ""}">${beatOutEntry ? "BEAT-OUT aktiv" : "BEAT-OUT"}</button>
          <button type="button" class="ghost participant-move-btn">${targetOverride ? "Terminwechsel aufheben" : booking ? "Termin umbuchen" : "Umbuchen"}</button>
          <button type="button" class="danger participant-delete-btn">${booking ? "Entfernen" : "Loeschen"}</button>
        </div>
      </td>
    `;

    const toggleButton = row.querySelector(".attendance-toggle");
    toggleButton.disabled = !canEditCourse(course) || isTrialParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      toggleButton.addEventListener("click", async () => {
        await toggleAttendance(course.id, participant.id);
      });
    } else if (isDropInParticipant) {
      toggleButton.addEventListener("click", async () => {
        await updateDropInStatus(
          participant.drop_in_booking_id,
          participant.drop_in_status === "teilgenommen" ? "gebucht" : "teilgenommen",
        );
      });
    }

    const moveButton = row.querySelector(".participant-move-btn");
    moveButton.disabled = !canEditCourse(course) || isTrialParticipant || isDropInParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      moveButton.addEventListener("click", async () => {
        await handleParticipantMove(participant, course);
      });
    }

    const beatOutButton = row.querySelector(".participant-beatout-btn");
    beatOutButton.disabled = !canEditCourse(course) || !booking || isTrialParticipant || isDropInParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      beatOutButton.addEventListener("click", async () => {
        await toggleBeatOut(course.id, participant.id);
      });
    }

    const deleteButton = row.querySelector(".participant-delete-btn");
    deleteButton.disabled = !canEditCourse(course) || isTrialParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      deleteButton.addEventListener("click", async () => {
        await handleParticipantDelete(participant, course);
      });
      row.querySelector(".participant-profile-btn").addEventListener("click", () => {
        openParticipantProfile(participant.id, booking?.id || participant.season_booking_id);
      });
    } else if (isDropInParticipant) {
      deleteButton.addEventListener("click", async () => {
        const dropIn = state.dropInBookings.find((entry) => entry.id === participant.drop_in_booking_id) || null;
        await handleDropInDelete(dropIn);
      });
    }

    if (isDropInParticipant) {
      moveButton.textContent = "Einzelstunde";
      deleteButton.textContent = "Stornieren";
    }

    participantTableBody.appendChild(row);

    const card = document.createElement("article");
    card.className = `participant-card${targetOverride ? " participant-card-override" : ""}${isTrialParticipant ? " participant-card-trial" : ""}${isDropInParticipant ? " participant-card-dropin" : ""}`;
    card.innerHTML = `
      <div class="participant-card-head">
        <div>
          <h3>${isTrialParticipant || isDropInParticipant ? escapeHtml(participant.full_name) : `<button type="button" class="link-button participant-profile-btn">${escapeHtml(participant.full_name)}</button>`}</h3>
          <p class="stat-meta">${participant.phone ? escapeHtml(participant.phone) : "Keine Telefonnummer"}</p>
          ${booking ? `<p class="stat-meta beatout-meta">BEAT-OUT ${bookingUsage.used}/${bookingUsage.limit}</p>` : ""}
          ${trialBadge}
          ${dropInBadge}
          ${overrideBadge}
        </div>
        <span class="badge">${rateBadge}</span>
      </div>
      <div class="participant-card-actions">
        <button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button>
        <button type="button" class="ghost participant-beatout-btn${beatOutEntry ? " is-active" : ""}">${beatOutEntry ? "BEAT-OUT aktiv" : "BEAT-OUT"}</button>
        <button type="button" class="ghost participant-move-btn">${targetOverride ? "Terminwechsel aufheben" : booking ? "Termin umbuchen" : "Umbuchen"}</button>
        <button type="button" class="danger participant-delete-btn">${booking ? "Entfernen" : "Loeschen"}</button>
      </div>
    `;

    const mobileToggle = card.querySelector(".attendance-toggle");
    mobileToggle.disabled = !canEditCourse(course) || isTrialParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      mobileToggle.addEventListener("click", async () => {
        await toggleAttendance(course.id, participant.id);
      });
    } else if (isDropInParticipant) {
      mobileToggle.addEventListener("click", async () => {
        await updateDropInStatus(
          participant.drop_in_booking_id,
          participant.drop_in_status === "teilgenommen" ? "gebucht" : "teilgenommen",
        );
      });
    }

    const mobileMoveButton = card.querySelector(".participant-move-btn");
    mobileMoveButton.disabled = !canEditCourse(course) || isTrialParticipant || isDropInParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      mobileMoveButton.addEventListener("click", async () => {
        await handleParticipantMove(participant, course);
      });
    }

    const mobileBeatOutButton = card.querySelector(".participant-beatout-btn");
    mobileBeatOutButton.disabled = !canEditCourse(course) || !booking || isTrialParticipant || isDropInParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      mobileBeatOutButton.addEventListener("click", async () => {
        await toggleBeatOut(course.id, participant.id);
      });
    }

    const mobileDeleteButton = card.querySelector(".participant-delete-btn");
    mobileDeleteButton.disabled = !canEditCourse(course) || isTrialParticipant;
    if (!isTrialParticipant && !isDropInParticipant) {
      mobileDeleteButton.addEventListener("click", async () => {
        await handleParticipantDelete(participant, course);
      });
      card.querySelector(".participant-profile-btn").addEventListener("click", () => {
        openParticipantProfile(participant.id, booking?.id || participant.season_booking_id);
      });
    } else if (isDropInParticipant) {
      mobileDeleteButton.addEventListener("click", async () => {
        const dropIn = state.dropInBookings.find((entry) => entry.id === participant.drop_in_booking_id) || null;
        await handleDropInDelete(dropIn);
      });
    }

    if (isDropInParticipant) {
      mobileMoveButton.textContent = "Einzelstunde";
      mobileDeleteButton.textContent = "Stornieren";
    }

    participantCards.appendChild(card);
  });
}

function openParticipantProfile(participantId, bookingId = null) {
  state.selectedParticipantId = participantId || null;
  renderParticipantProfile(bookingId);
}

function closeParticipantProfileModal() {
  state.selectedParticipantId = null;
  participantProfileModal?.classList.add("hidden");
}

function renderParticipantProfile(fallbackBookingId = null) {
  if (!participantProfileModal || !participantProfileBody || !participantProfileTitle) {
    return;
  }

  if (!state.selectedParticipantId && !fallbackBookingId) {
    participantProfileModal.classList.add("hidden");
    return;
  }

  const participant = state.participants.find((entry) => entry.id === state.selectedParticipantId) || null;
  const booking = state.seasonBookings.find((entry) => entry.id === (participant?.season_booking_id || fallbackBookingId)) || null;

  if (!participant && !booking) {
    participantProfileModal.classList.add("hidden");
    return;
  }

  const title = participant?.full_name || booking?.full_name || "Teilnehmerprofil";
  const course = participant ? state.courses.find((entry) => entry.id === participant.course_id) || null : null;
  const season = state.seasons.find((entry) => entry.id === (participant?.season_id || booking?.season_id)) || null;
  const packageType = booking?.package_type || "Keine Buchung";
  const days = booking ? formatSelectedDays(booking.selected_days) : "Nicht hinterlegt";
  const rate = participant ? getParticipantSeasonAttendanceRate(participant, season?.id) : 0;
  const beatOutUsage = booking ? getBeatOutUsageForBooking(booking.id) : { used: 0, limit: 0, remaining: 0 };
  const rewardStatus = getFreeSeasonRewardStatus(booking || participant || {});
  const history = participant ? getParticipantRecentHistory(participant.id, 6) : [];

  participantProfileTitle.textContent = title;
  participantProfileBody.innerHTML = `
    <div class="stats-grid">
      <article class="stat-card">
        <h3>Aktueller Kurs</h3>
        <p class="hero-stat">${escapeHtml(course?.name || "Noch keinem Kurs zugeordnet")}</p>
        <p class="stat-meta">${escapeHtml(course?.weekday || "Ohne festen Wochentag")}</p>
      </article>
      <article class="stat-card">
        <h3>Season & Paket</h3>
        <p class="hero-stat">${escapeHtml(season?.name || "Keine aktive Season")}</p>
        <p class="stat-meta">${escapeHtml(packageType)} | ${escapeHtml(days)}</p>
      </article>
      <article class="stat-card">
        <h3>Anwesenheitsquote</h3>
        <p class="hero-stat">${participant ? `${rate}%` : "-"}</p>
        <p class="stat-meta">${participant?.phone ? escapeHtml(participant.phone) : booking?.phone ? escapeHtml(booking.phone) : "Keine Telefonnummer"}</p>
      </article>
      <article class="stat-card">
        <h3>BEAT-OUTS</h3>
        <p class="hero-stat">${booking ? `${beatOutUsage.used}/${beatOutUsage.limit}` : "-"}</p>
        <p class="stat-meta">${booking ? `${beatOutUsage.remaining} verbleibend in dieser Season` : "Nur bei Season-Buchung verfuegbar"}</p>
      </article>
      <article class="stat-card">
        <h3>Gratis-Season Status</h3>
        <p class="hero-stat">${rewardStatus.achievedRewards}</p>
        <p class="stat-meta">${rewardStatus.nextMilestone ? `Naechste Schwelle bei ${rewardStatus.nextMilestone} BEAT-OUTs` : "12 BEAT-OUTs erreicht"}</p>
      </article>
    </div>
    <article class="stat-card">
      <h3>Verlauf</h3>
      <div class="stack">
        ${history.length
          ? history.map((entry) => `
            <div class="list-row">
              <strong>${escapeHtml(formatDateLabel(entry.date))}</strong>
              <span class="stat-meta">${escapeHtml(entry.courseName)} | ${entry.present ? "anwesend" : entry.beatOut ? "BEAT-OUT" : "abwesend"}</span>
            </div>
          `).join("")
          : '<p class="stat-meta">Noch keine dokumentierte Historie vorhanden.</p>'}
      </div>
    </article>
  `;

  participantProfileModal.classList.remove("hidden");
}

function renderMobileSessionSummary() {
  const course = getSelectedCourse();
  mobileSessionSummary.innerHTML = "";

  if (!course) {
    mobileSessionSummary.classList.add("hidden");
    return;
  }

  const sessionDate = getEffectiveAttendanceDate();
  const session = getSessionForCourseAndDate(course.id, sessionDate);
  const participants = getAttendanceParticipantsForCourse(course.id, session?.id);
  const records = getRecordsForSession(session?.id);
  const presentCount = records.filter((record) => record.present).length;
  const absentCount = Math.max(participants.length - presentCount, 0);

  mobileSessionSummary.classList.remove("hidden");
  mobileSessionSummary.innerHTML = `
    <h3>${escapeHtml(course.name)}</h3>
    <p class="hero-stat">${presentCount}/${participants.length}</p>
      <p class="stat-meta">anwesend am ${escapeHtml(sessionDate)}</p>
    <p class="stat-meta">${absentCount} aktuell noch offen oder abwesend</p>
  `;
}

function renderStats() {
  statsCards.innerHTML = "";

  if (!state.courses.length) {
    statsCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.courses.forEach((course) => {
    const courseParticipants = getParticipantsForCourse(course.id);
    const courseSessions = getSessionsForCourse(course.id);
    const relevantRecords = state.records.filter((record) => {
      return courseSessions.some((session) => session.id === record.session_id);
    });
    const average = courseParticipants.length && courseSessions.length
      ? Math.round((relevantRecords.filter((record) => record.present).length / (courseParticipants.length * courseSessions.length)) * 100)
      : 0;

    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(course.name)}</h3>
      <p class="stat-meta">${courseParticipants.length} Teilnehmer</p>
      <p class="stat-meta">${courseSessions.length} dokumentierte Termine</p>
      <p class="stat-meta">Trainer: ${escapeHtml(getCourseTrainerName(course))}</p>
      <p class="hero-stat">${average}%</p>
      <p class="stat-meta">durchschnittliche Anwesenheit</p>
    `;
    statsCards.appendChild(card);
  });
}

function renderBusinessDashboard() {
  businessCards.innerHTML = "";
  businessInsights.innerHTML = "";

  if (!state.courses.length) {
    businessCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const selectedMonth = getSelectedMonth();
  const monthSessions = getSessionsForMonth(selectedMonth);
  const monthSessionIds = new Set(monthSessions.map((session) => session.id));
  const monthRecords = state.records.filter((record) => monthSessionIds.has(record.session_id));
  const presentRecords = monthRecords.filter((record) => record.present).length;
  const absentRecords = monthRecords.filter((record) => !record.present).length;
  const totalMarked = presentRecords + absentRecords;
  const noShowRate = totalMarked ? Math.round((absentRecords / totalMarked) * 100) : 0;
  const avgAttendance = totalMarked ? Math.round((presentRecords / totalMarked) * 100) : 0;
  const activeTrainerIds = new Set(
    state.courses
      .map((course) => getCourseTrainerKey(course))
      .filter(Boolean),
  );
  const newParticipantsThisMonth = state.participants.filter((participant) => {
    return String(participant.created_at || "").startsWith(selectedMonth);
  }).length;
  const monthTrials = state.trialRequests.filter((trial) => {
    const session = trial.attendance_session_id
      ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
      : null;
    const referenceDate = session?.session_date || String(trial.created_at || "");
    return String(referenceDate).startsWith(selectedMonth);
  });
  const convertedTrials = monthTrials.filter((trial) => trial.status === "konvertiert").length;
  const trialConversionRate = monthTrials.length ? Math.round((convertedTrials / monthTrials.length) * 100) : 0;

  const summaryCards = [
    { title: "Teilnehmer gesamt", value: state.participants.length, meta: `${newParticipantsThisMonth} neu in ${getSelectedMonthLabel()}` },
    { title: "Aktive Trainer", value: activeTrainerIds.size, meta: `${state.courses.length} Kurse live` },
    { title: "Sessions im Monat", value: monthSessions.length, meta: getSelectedMonthLabel() },
    { title: "No-Show-Rate", value: `${noShowRate}%`, meta: `${avgAttendance}% Anwesenheit` },
    { title: "Probetrainings", value: monthTrials.length, meta: `${convertedTrials} konvertiert in ${getSelectedMonthLabel()}` },
    { title: "Conversion", value: `${trialConversionRate}%`, meta: "Probetrainings zu Teilnehmern" },
  ];

  summaryCards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    businessCards.appendChild(card);
  });

  const topCourse = getTopCourseByAttendance();
  const topTrainer = getTopTrainerByAttendance();
  const busiestWeekday = getBusiestWeekday();
  const weakestCourse = getWeakestCourseByAttendance();

  const insightCards = [
    {
      title: "Staerkster Kurs",
      value: topCourse ? `${topCourse.name} (${topCourse.rate}%)` : "Noch keine Daten",
      meta: "beste Anwesenheitsquote",
    },
    {
      title: "Staerkster Trainer",
      value: topTrainer ? `${topTrainer.name} (${topTrainer.rate}%)` : "Noch keine Daten",
      meta: "durchschnittliche Anwesenheit",
    },
    {
      title: "Bester Wochentag",
      value: busiestWeekday ? busiestWeekday.label : "Noch keine Daten",
      meta: busiestWeekday ? `${busiestWeekday.sessions} Sessions dokumentiert` : "ohne Datenbasis",
    },
    {
      title: "Handlungsbedarf",
      value: weakestCourse ? `${weakestCourse.name} (${weakestCourse.rate}%)` : "Kein Ausreisser",
      meta: "niedrigste Anwesenheitsquote",
    },
  ];

  insightCards.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    businessInsights.appendChild(card);
  });

  const trialSeasonCard = document.createElement("article");
  trialSeasonCard.className = "stat-card";
  trialSeasonCard.innerHTML = `
    <h3>Conversion pro Season</h3>
    <p class="stat-meta">Probetrainings je Season und wie viele davon konvertiert wurden.</p>
  `;
  const trialSeasonList = document.createElement("div");
  trialSeasonList.className = "stack";
  const trialSeasonSummaries = getTrialSeasonSummaries(selectedMonth);
  if (trialSeasonSummaries.length) {
    trialSeasonSummaries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(entry.label)}</strong>
          <div class="stat-meta">${entry.total} Probetrainings | ${entry.converted} konvertiert</div>
        </div>
      `;
      const rowActions = document.createElement("div");
      rowActions.className = "mini-actions";
      const conversionPill = document.createElement("span");
      conversionPill.className = `status-pill ${entry.rate >= 50 ? "status-pill-info" : "status-pill-warn"}`;
      conversionPill.textContent = `${entry.rate}% Conversion`;
      rowActions.appendChild(conversionPill);
      row.appendChild(rowActions);
      trialSeasonList.appendChild(row);
    });
  } else {
    trialSeasonList.innerHTML = '<p class="stat-meta">Noch keine Probetrainings mit Season-Bezug im gewaehlten Monat.</p>';
  }
  trialSeasonCard.appendChild(trialSeasonList);
  businessInsights.appendChild(trialSeasonCard);
}

function renderMonthlyOverview() {
  monthlyCards.innerHTML = "";

  if (!state.courses.length) {
    monthlyCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const monthSessions = getSessionsForMonth(getSelectedMonth());
  const monthCourseIds = new Set(monthSessions.map((session) => session.course_id));
  const monthParticipants = state.participants.filter((participant) => monthCourseIds.has(participant.course_id));
  const monthRecords = state.records.filter((record) => monthSessions.some((session) => session.id === record.session_id));
  const average = monthParticipants.length && monthSessions.length
    ? Math.round((monthRecords.filter((record) => record.present).length / (monthParticipants.length * monthSessions.length)) * 100)
    : 0;

  const items = [
    { title: "Termine im Monat", value: monthSessions.length, meta: getSelectedMonthLabel() },
    { title: "Aktive Kurse", value: monthCourseIds.size, meta: "mit dokumentierten Sessions" },
    { title: "Durchschnitt", value: `${average}%`, meta: "Anwesenheit im Monat" },
    { title: "Top Teilnehmer", value: getTopParticipantName(), meta: "beste Quote im Sichtbereich" },
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    monthlyCards.appendChild(card);
  });
}

function renderReportPreview() {
  reportPreview.innerHTML = "";

  if (!state.courses.length) {
    reportPreview.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const selectedCourse = getSelectedCourse();
  const items = [
    {
      title: "Report-Fokus",
      value: selectedCourse ? selectedCourse.name : "Alle Kurse",
      meta: `Monat: ${getSelectedMonthLabel()}`,
    },
    {
      title: "Suchfilter",
      value: state.participantSearch || "Kein Filter",
      meta: "fuer Teilnehmerlisten und Ranking",
    },
    {
      title: "Aufmerksamkeiten",
      value: getLowAttendanceParticipants().length,
      meta: "Teilnehmer unter 60% Quote",
    },
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <p class="hero-stat">${escapeHtml(item.value)}</p>
      <p class="stat-meta">${escapeHtml(item.meta)}</p>
    `;
    reportPreview.appendChild(card);
  });
}

async function toggleAttendance(courseId, participantId) {
  const course = state.courses.find((entry) => entry.id === courseId);
  if (!course || !canEditCourse(course)) {
    return;
  }

  const sessionDate = getEffectiveAttendanceDate();
  const session = getSessionForCourseAndDate(courseId, sessionDate);
  const currentRecord = getRecordsForSession(session?.id).find((entry) => entry.participant_id === participantId);
  const nextPresent = !currentRecord?.present;

  if (state.isOffline) {
    applyLocalAttendanceChange(courseId, participantId, sessionDate, nextPresent);
    queueOfflineAction({
      type: "set-attendance",
      payload: { courseId, participantId, sessionDate, present: nextPresent },
    });
    persistOfflineCache();
    render();
    notify("Anwesenheit offline gespeichert und vorgemerkt.");
    return;
  }

  const success = await saveAttendanceValue(courseId, participantId, sessionDate, nextPresent);
  if (!success) {
    return;
  }

  applyLocalAttendanceChange(courseId, participantId, sessionDate, nextPresent);
  markOptimisticVisibility("records", 60000);
  state.acceptEmptyFetch.records = false;
  if (nextPresent) {
    await clearBeatOutForParticipantSession(participantId, sessionDate, courseId);
  }

  persistOfflineCache();
  render();
  notify(nextPresent ? "Anwesenheit bestaetigt." : "Anwesenheit entfernt.");

  await refreshVisibleData({ context: "Attendance refresh", silent: true });
}

async function toggleBeatOut(courseId, participantId) {
  const course = state.courses.find((entry) => entry.id === courseId);
  const participant = state.participants.find((entry) => entry.id === participantId);
  if (!course || !participant || !canEditCourse(course)) {
    return;
  }

  if (state.isOffline) {
    notify("BEAT-OUTs koennen aktuell nur online eingetragen werden.", true);
    return;
  }

  const booking = getParticipantSeasonBooking(participant);
  if (!booking) {
    notify("BEAT-OUT ist nur fuer Season-Buchungen verfuegbar.", true);
    return;
  }

  const sessionDate = getEffectiveAttendanceDate();
  let sessionId;
  try {
    sessionId = await ensureSession(courseId, sessionDate);
  } catch (error) {
    notify(error.message, true);
    return;
  }

  const existingEntry = getBeatOutEntryForParticipantSession(participantId, sessionId);
  if (existingEntry) {
    const { error } = await state.supabase
      .from("beat_out_entries")
      .delete()
      .eq("id", existingEntry.id);

    if (error) {
      notify(getFriendlySupabaseMessage(error, "BEAT-OUT konnte nicht entfernt werden."), true);
      return;
    }

    await saveAttendanceValue(courseId, participantId, sessionDate, false);
    state.beatOutEntries = state.beatOutEntries.filter((entry) => entry.id !== existingEntry.id);
    applyLocalAttendanceChange(courseId, participantId, sessionDate, false);
    markOptimisticVisibility("records", 60000);
    markOptimisticVisibility("beatOutEntries", 60000);
    state.acceptEmptyFetch.records = false;
    state.acceptEmptyFetch.beatOutEntries = false;
    persistOfflineCache();
    render();
    notify(`BEAT-OUT fuer ${participant.full_name} wurde entfernt.`);
    await refreshVisibleData({ context: "Beat-out refresh", silent: true });
    return;
  }

  const usage = getBeatOutUsageForBooking(booking.id);
  if (usage.used >= usage.limit) {
    notify(`${booking.full_name} hat in dieser Season bereits alle ${usage.limit} BEAT-OUTs verbraucht.`, true);
    return;
  }

  const insertResult = await state.supabase
    .from("beat_out_entries")
    .insert({
      session_id: sessionId,
      participant_id: participantId,
      season_booking_id: booking.id,
    });

  if (insertResult.error) {
    notify(getFriendlySupabaseMessage(insertResult.error, "BEAT-OUT konnte nicht gespeichert werden."), true);
    return;
  }

  await saveAttendanceValue(courseId, participantId, sessionDate, false);
  state.beatOutEntries = [
    {
      id: `local-beatout:${sessionId}:${participantId}`,
      session_id: sessionId,
      participant_id: participantId,
      season_booking_id: booking.id,
      created_at: new Date().toISOString(),
    },
    ...state.beatOutEntries.filter((entry) => !(entry.session_id === sessionId && entry.participant_id === participantId)),
  ];
  applyLocalAttendanceChange(courseId, participantId, sessionDate, false);
  markOptimisticVisibility("records", 60000);
  markOptimisticVisibility("beatOutEntries", 60000);
  state.acceptEmptyFetch.records = false;
  state.acceptEmptyFetch.beatOutEntries = false;
  persistOfflineCache();
  render();
  notify(`BEAT-OUT fuer ${participant.full_name} wurde eingetragen.`);
  await refreshVisibleData({ context: "Beat-out refresh", silent: true });
}

async function setAttendanceForAll(value) {
  const course = getSelectedCourse();
  if (!course || !canEditCourse(course)) {
    return;
  }

  const sessionDate = attendanceDate.value || getToday();
  const session = getSessionForCourseAndDate(course.id, sessionDate);
  const attendanceParticipants = getAttendanceParticipantsForCourse(course.id, session?.id);

  if (state.isOffline) {
    attendanceParticipants.forEach((participant) => {
      applyLocalAttendanceChange(course.id, participant.id, sessionDate, value);
    });
    queueOfflineAction({
      type: "set-attendance-all",
      payload: { courseId: course.id, sessionDate, value },
    });
    persistOfflineCache();
    render();
    notify("Sammelaenderung offline gespeichert.");
    return;
  }

  let sessionId;
  try {
    sessionId = await ensureSession(course.id, sessionDate);
  } catch (error) {
    notify(error.message, true);
    return;
  }

  const payload = attendanceParticipants.map((participant) => ({
    session_id: sessionId,
    participant_id: participant.id,
    present: value,
  }));

  if (!payload.length) {
    return;
  }

  const { error } = await state.supabase
    .from("attendance_records")
    .upsert(payload, {
      onConflict: "session_id,participant_id",
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  if (value) {
    const participantIds = attendanceParticipants.map((participant) => participant.id);
    if (participantIds.length) {
      const beatOutDeleteResult = await state.supabase
        .from("beat_out_entries")
        .delete()
        .eq("session_id", sessionId)
        .in("participant_id", participantIds);

      if (beatOutDeleteResult.error) {
        notify(getFriendlySupabaseMessage(beatOutDeleteResult.error, "BEAT-OUTs konnten nicht bereinigt werden."), true);
      }
    }
  }

  await fetchSupportData();
  persistOfflineCache();
  render();
}

async function ensureSession(courseId, sessionDate) {
  const existing = getSessionForCourseAndDate(courseId, sessionDate);
  if (existing && !String(existing.id).startsWith("offline:")) {
    return existing.id;
  }

  const insertResult = await state.supabase
    .from("attendance_sessions")
    .insert({
      course_id: courseId,
      session_date: sessionDate,
      season_id: resolveSeasonIdForSession(sessionDate),
      created_by: state.session.user.id,
    })
      .select("id, course_id, session_date, season_id")
    .single();

  if (insertResult.error) {
    const normalizedMessage = String(insertResult.error.message || "").toLowerCase();
    if (normalizedMessage.includes("duplicate") || normalizedMessage.includes("unique")) {
      const existingResult = await state.supabase
        .from("attendance_sessions")
      .select("id, course_id, session_date, season_id")
        .eq("course_id", courseId)
        .eq("session_date", sessionDate)
        .single();

      if (existingResult.error) {
        throw new Error(existingResult.error.message);
      }

      state.sessions = [
        existingResult.data,
        ...state.sessions.filter((session) => session.id !== existingResult.data.id),
      ];
      return existingResult.data.id;
    }

    throw new Error(insertResult.error.message);
  }

  state.sessions = [
    insertResult.data,
    ...state.sessions.filter((session) => session.id !== insertResult.data.id),
  ];
  return insertResult.data.id;
}

async function createPlannedSessions(mode) {
  const course = getSelectedCourse();
  if (!course || !canEditCourse(course)) {
    return;
  }

  const dates = mode === "month"
    ? getMonthCourseDates(course, getSelectedMonth())
    : getUpcomingCourseDates(course, 4);

  if (!dates.length) {
    notify("Fuer diesen Kurs konnten keine Termine berechnet werden.", true);
    return;
  }

  const payload = dates
    .filter((date) => !getSessionForCourseAndDate(course.id, date))
    .map((date) => ({
      course_id: course.id,
      session_date: date,
      season_id: resolveSeasonIdForSession(date),
      created_by: state.session.user.id,
    }));

  if (!payload.length) {
    notify("Alle berechneten Termine sind bereits angelegt.");
    return;
  }

  if (state.isOffline) {
    payload.forEach((entry) => {
      ensureLocalSession(entry.course_id, entry.session_date);
    });
    queueOfflineAction({
      type: "create-sessions",
      payload: {
        courseId: course.id,
        dates: payload.map((entry) => entry.session_date),
      },
    });
    persistOfflineCache();
    render();
    notify(`${payload.length} Termine offline vorgemerkt.`);
    return;
  }

  const { error } = await state.supabase
    .from("attendance_sessions")
    .insert(payload);

  if (error) {
    notify(error.message, true);
    return;
  }

  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`${payload.length} Termine wurden angelegt.`);
}

function exportSelectedCourseCsv() {
  const course = getSelectedCourse();
  if (!course) {
    notify("Bitte zuerst einen Kurs auswaehlen.", true);
    return;
  }

  const sessions = getSessionsForCourse(course.id);
  const participants = getParticipantsForCourse(course.id);
  const rows = [
    ["Teilnehmer", "Telefon", ...sessions.map((session) => session.session_date), "Anwesenheitsquote"],
  ];

  participants.forEach((participant) => {
    const marks = sessions.map((session) => {
      const record = getRecordsForSession(session.id).find((entry) => entry.participant_id === participant.id);
      const beatOutEntry = getBeatOutEntryForParticipantSession(participant.id, session.id);
      if (record?.present) {
        return "Anwesend";
      }
      return beatOutEntry ? "BEAT-OUT" : "Abwesend";
    });
    rows.push([
      participant.full_name,
      participant.phone,
      ...marks,
      `${calculateAttendanceRate(course.id, participant.id)}%`,
    ]);
  });

  downloadCsv(`${slugify(course.name)}-anwesenheit.csv`, rows);
}

function exportMonthlyReportCsv() {
  const monthSessions = getSessionsForMonth(getSelectedMonth());
  const rows = [["Monat", "Kurs", "Trainer", "Termin", "Teilnehmer", "Anwesend", "Quote"]];

  monthSessions.forEach((session) => {
    const course = state.courses.find((entry) => entry.id === session.course_id);
    getParticipantsForCourse(session.course_id).forEach((participant) => {
      const record = getRecordsForSession(session.id).find((entry) => entry.participant_id === participant.id);
      const beatOutEntry = getBeatOutEntryForParticipantSession(participant.id, session.id);
      rows.push([
        getSelectedMonthLabel(),
        course?.name || "-",
        getCourseTrainerName(course),
        session.session_date,
        participant.full_name,
        record?.present ? "Ja" : beatOutEntry ? "BEAT-OUT" : "Nein",
        `${calculateAttendanceRate(session.course_id, participant.id)}%`,
      ]);
    });
  });

  downloadCsv(`beatfield-monatsreport-${getSelectedMonth()}.csv`, rows);
  notify("Monatsreport exportiert.");
}

function exportLeaderboardCsv() {
  const rows = [["Kurs", "Teilnehmer", "Telefon", "Anwesenheitsquote", "Dokumentierte Termine"]];

  state.courses.forEach((course) => {
    getFilteredParticipants(course.id)
      .sort((left, right) => calculateAttendanceRate(course.id, right.id) - calculateAttendanceRate(course.id, left.id))
      .forEach((participant) => {
        rows.push([
          course.name,
          participant.full_name,
          participant.phone,
          `${calculateAttendanceRate(course.id, participant.id)}%`,
          getSessionsForCourse(course.id).length,
        ]);
      });
  });

  downloadCsv(`beatfield-ranking-${getSelectedMonth()}.csv`, rows);
  notify("Anwesenheitsranking exportiert.");
}

function exportTrainerReportCsv() {
  const rows = [["Trainer", "Kurse", "Termine", "Teilnehmer", "Durchschnitt"]];

  const trainerSummaries = getTrainerSummaries();

  trainerSummaries.forEach((trainer) => {
    const trainerCourses = state.courses.filter((course) => getCourseTrainerKey(course) === trainer.key);
    const trainerSessions = trainerCourses.flatMap((course) => getSessionsForCourse(course.id));
    const trainerParticipants = trainerCourses.flatMap((course) => getParticipantsForCourse(course.id));
    const trainerRecords = state.records.filter((record) => trainerSessions.some((session) => session.id === record.session_id));
    const average = trainerParticipants.length && trainerSessions.length
      ? Math.round((trainerRecords.filter((record) => record.present).length / (trainerParticipants.length * trainerSessions.length)) * 100)
      : 0;

    rows.push([
      trainer.name,
      trainerCourses.length,
      trainerSessions.length,
      trainerParticipants.length,
      `${average}%`,
    ]);
  });

  downloadCsv(`beatfield-trainerreport-${getSelectedMonth()}.csv`, rows);
  notify("Trainerreport exportiert.");
}

function downloadCsv(filename, rows) {
  const csvContent = rows.map((row) => row.map(escapeCsvValue).join(";")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function calculateAttendanceRate(courseId, participantId) {
  const sessions = getSessionsForCourse(courseId);
  if (!sessions.length) {
    return 0;
  }

  const sessionIds = sessions.map((session) => session.id);
  const present = state.records.filter((record) => {
    return sessionIds.includes(record.session_id) && record.participant_id === participantId && record.present;
  }).length;

  return Math.round((present / sessions.length) * 100);
}

function getParticipantAttendanceRate(participant) {
  if (!participant?.course_id || !participant?.id) {
    return 0;
  }

  return calculateAttendanceRate(participant.course_id, participant.id);
}

function getParticipantSeasonAttendanceRate(participant, seasonId) {
  if (!participant?.course_id || !participant?.id || !seasonId) {
    return getParticipantAttendanceRate(participant);
  }

  const season = state.seasons.find((entry) => entry.id === seasonId);
  if (!season) {
    return getParticipantAttendanceRate(participant);
  }

  const sessions = getSessionsForCourse(participant.course_id).filter((session) => {
    return session.session_date >= season.start_date && session.session_date <= season.end_date;
  });

  if (!sessions.length) {
    return 0;
  }

  const sessionIds = new Set(sessions.map((session) => session.id));
  const present = state.records.filter((record) => {
    return sessionIds.has(record.session_id) && record.participant_id === participant.id && record.present;
  }).length;

  return Math.round((present / sessions.length) * 100);
}

function getSelectedCourse() {
  return state.courses.find((course) => course.id === state.selectedCourseId) || null;
}

function getSelectedSeason() {
  return state.seasons.find((season) => season.id === state.attendanceSeasonId) || null;
}

function getParticipantsForCourse(courseId) {
  const selectedSeasonId = state.attendanceSeasonId;
  return state.participants.filter((participant) => {
    if (participant.course_id !== courseId) {
      return false;
    }

    if (!selectedSeasonId) {
      return true;
    }

    return participant.season_id === selectedSeasonId;
  });
}

function getAttendanceParticipantsForCourse(courseId, sessionId = null) {
  const baseParticipants = getParticipantsForCourse(courseId);
  if (!sessionId) {
    return baseParticipants;
  }

  const movedOutIds = new Set(
    state.sessionOverrides
      .filter((entry) => entry.source_session_id === sessionId)
      .map((entry) => entry.participant_id),
  );

  const roster = baseParticipants.filter((participant) => !movedOutIds.has(participant.id));
  const rosterIds = new Set(roster.map((participant) => participant.id));

  state.sessionOverrides
    .filter((entry) => entry.target_session_id === sessionId)
    .forEach((entry) => {
      const participant = state.participants.find((item) => item.id === entry.participant_id);
      if (!participant) {
        return;
      }
      if (state.attendanceSeasonId && participant.season_id !== state.attendanceSeasonId) {
        return;
      }
      if (!rosterIds.has(participant.id)) {
        roster.push(participant);
        rosterIds.add(participant.id);
      }
    });

  const trialRoster = state.trialRequests
    .filter((entry) => entry.status !== "konvertiert" && entry.status !== "abgesagt" && entry.attendance_session_id === sessionId)
    .map((entry) => ({
      id: `trial-${entry.id}`,
      course_id: entry.course_id,
      season_id: state.sessions.find((session) => session.id === entry.attendance_session_id)?.season_id || null,
      season_booking_id: null,
      full_name: `${entry.full_name} (Probetraining)`,
      phone: entry.phone || "",
      email: entry.email || "",
      is_trial: true,
      trial_request_id: entry.id,
    }));

  trialRoster.forEach((participant) => {
    if (!rosterIds.has(participant.id)) {
      roster.push(participant);
      rosterIds.add(participant.id);
    }
  });

  const dropInRoster = state.dropInBookings
    .filter((entry) => entry.status !== "abgesagt" && entry.attendance_session_id === sessionId)
    .map((entry) => ({
      id: `dropin-${entry.id}`,
      course_id: entry.course_id,
      season_id: state.sessions.find((session) => session.id === entry.attendance_session_id)?.season_id || null,
      season_booking_id: null,
      full_name: `${entry.full_name} (DROP-IN)`,
      phone: entry.phone || "",
      email: entry.email || "",
      is_dropin: true,
      drop_in_booking_id: entry.id,
      drop_in_status: entry.status,
    }));

  dropInRoster.forEach((participant) => {
    if (!rosterIds.has(participant.id)) {
      roster.push(participant);
      rosterIds.add(participant.id);
    }
  });

  return roster.sort((left, right) => String(left.full_name || "").localeCompare(String(right.full_name || "")));
}

function getFilteredParticipants(courseId, sessionId = null) {
  const participants = getAttendanceParticipantsForCourse(courseId, sessionId);
  if (!state.participantSearch) {
    return participants;
  }

  return participants.filter((participant) => {
    return participant.full_name.toLowerCase().includes(state.participantSearch)
      || String(participant.phone || "").toLowerCase().includes(state.participantSearch);
  });
}

function getOpenTrialRequests() {
  return state.trialRequests
    .filter((trial) => trial.status !== "konvertiert" && trial.status !== "abgesagt")
    .sort((left, right) => {
      const leftSession = left.attendance_session_id
        ? state.sessions.find((entry) => entry.id === left.attendance_session_id) || null
        : null;
      const rightSession = right.attendance_session_id
        ? state.sessions.find((entry) => entry.id === right.attendance_session_id) || null
        : null;
      const leftDate = leftSession?.session_date || String(left.created_at || "");
      const rightDate = rightSession?.session_date || String(right.created_at || "");
      return String(leftDate).localeCompare(String(rightDate));
    });
}

function getTrialPipelineMeta(trial) {
  const status = trial?.status || "angefragt";
  if (status === "angefragt") {
    return {
      label: "Anfrage offen",
      meta: "Termin bestaetigen oder rueckmelden",
      tone: "status-pill-info",
    };
  }
  if (status === "gebucht") {
    return {
      label: "Termin steht",
      meta: "am Termin erinnern",
      tone: "status-pill-info",
    };
  }
  if (status === "teilgenommen") {
    return {
      label: "Conversion offen",
      meta: "Nachfassen und in Teilnehmer uebernehmen",
      tone: "status-pill-warn",
    };
  }
  if (status === "konvertiert") {
    return {
      label: "Konvertiert",
      meta: "bereits in Teilnehmer uebernommen",
      tone: "status-pill-info",
    };
  }
  return {
    label: "Abgesagt",
    meta: "kein weiterer Schritt noetig",
    tone: "status-pill-critical",
  };
}

function getDropInPipelineMeta(dropIn) {
  const status = dropIn?.status || "gebucht";
  if (status === "gebucht") {
    return {
      label: "Einzelstunde gebucht",
      meta: "nur fuer diesen einen Termin aktiv",
      tone: "status-pill-info",
    };
  }
  if (status === "teilgenommen") {
    return {
      label: "Teilgenommen",
      meta: "DROP-IN wurde wahrgenommen",
      tone: "status-pill-info",
    };
  }
  return {
    label: "Storniert",
    meta: "kein weiterer Schritt noetig",
    tone: "status-pill-critical",
  };
}

function formatTrialSessionLabel(trial) {
  const session = trial.attendance_session_id
    ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
    : null;
  const course = trial.course_id
    ? state.courses.find((entry) => entry.id === trial.course_id) || null
    : null;
  const season = session?.season_id
    ? state.seasons.find((entry) => entry.id === session.season_id) || null
    : null;
  const base = session
    ? `${formatDateLabel(session.session_date)} | ${course ? course.name : "Kein Kurs"}`
    : course
      ? course.name
      : "Kein Termin";
  return season ? `${base} | ${season.name}` : base;
}

function formatDropInSessionLabel(dropIn) {
  const session = dropIn.attendance_session_id
    ? state.sessions.find((entry) => entry.id === dropIn.attendance_session_id) || null
    : null;
  const course = dropIn.course_id
    ? state.courses.find((entry) => entry.id === dropIn.course_id) || null
    : null;
  const season = session?.season_id
    ? state.seasons.find((entry) => entry.id === session.season_id) || null
    : null;
  const base = session
    ? `${formatDateLabel(session.session_date)} | ${course ? course.name : "Kein Kurs"}`
    : course
      ? course.name
      : "Kein Termin";
  return season ? `${base} | ${season.name}` : base;
}

function getTrialSeasonSummaries(monthValue) {
  const grouped = new Map();
  state.trialRequests.forEach((trial) => {
    const session = trial.attendance_session_id
      ? state.sessions.find((entry) => entry.id === trial.attendance_session_id) || null
      : null;
    const referenceDate = session?.session_date || String(trial.created_at || "").slice(0, 10);
    if (!String(referenceDate).startsWith(monthValue)) {
      return;
    }
    const season = session?.season_id
      ? state.seasons.find((entry) => entry.id === session.season_id) || null
      : null;
    const key = season?.id || "no-season";
    if (!grouped.has(key)) {
      grouped.set(key, {
        label: season?.name || "Ohne Season",
        total: 0,
        converted: 0,
      });
    }
    const bucket = grouped.get(key);
    bucket.total += 1;
    if (trial.status === "konvertiert") {
      bucket.converted += 1;
    }
  });

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      rate: entry.total ? Math.round((entry.converted / entry.total) * 100) : 0,
    }))
    .sort((left, right) => {
      if (right.rate !== left.rate) {
        return right.rate - left.rate;
      }
      return right.total - left.total;
    });
}

function getPreferredTrialSeasonId() {
  if (state.selectedSeasonId && state.seasons.some((entry) => entry.id === state.selectedSeasonId)) {
    return state.selectedSeasonId;
  }
  if (state.attendanceSeasonId && state.seasons.some((entry) => entry.id === state.attendanceSeasonId)) {
    return state.attendanceSeasonId;
  }
  return state.seasons.find((entry) => entry.status === "aktiv")?.id || null;
}

function getUpcomingTrialSessions() {
  return state.sessions
    .filter((session) => session.session_date >= getToday() && isSessionAlignedWithCourse(session))
    .sort((left, right) => {
      const dateCompare = String(left.session_date).localeCompare(String(right.session_date));
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return String(left.course_id || "").localeCompare(String(right.course_id || ""));
    });
}

function getSessionsForCourse(courseId) {
  return state.sessions.filter((session) => session.course_id === courseId);
}

function isSessionAlignedWithCourse(session) {
  if (!session?.course_id || !session?.session_date) {
    return false;
  }

  const course = state.courses.find((entry) => entry.id === session.course_id);
  if (!course) {
    return false;
  }

  const weekdayNumber = getWeekdayNumber(course.weekday);
  if (weekdayNumber === null) {
    return false;
  }

  const sessionDate = new Date(`${session.session_date}T00:00:00`);
  return sessionDate.getDay() === weekdayNumber;
}

function getSeasonSessions(seasonId) {
  const season = state.seasons.find((entry) => entry.id === seasonId);
  if (!season) {
    return [];
  }

  const merged = new Map();

  state.sessions
    .filter((session) => session.season_id === seasonId && isSessionAlignedWithCourse(session))
    .forEach((session) => {
      merged.set(session.id, session);
    });

  state.sessions
    .filter((session) => {
      return session.session_date >= season.start_date
        && session.session_date <= season.end_date
        && isSessionAlignedWithCourse(session);
    })
    .forEach((session) => {
      if (!merged.has(session.id)) {
        merged.set(session.id, session);
      }
    });

  return Array.from(merged.values()).sort((left, right) => {
    const dateCompare = String(left.session_date).localeCompare(String(right.session_date));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return String(left.course_id || "").localeCompare(String(right.course_id || ""));
  });
}

function getSeasonSessionsForCourse(seasonId, courseId) {
  return getSeasonSessions(seasonId).filter((session) => session.course_id === courseId);
}

function getSeasonTrainingDates(seasonId) {
  return Array.from(new Set(getSeasonSessions(seasonId).map((session) => session.session_date))).sort();
}

function getSessionsForMonth(monthValue) {
  return state.sessions.filter((session) => String(session.session_date).startsWith(monthValue));
}

function getSessionForCourseAndDate(courseId, sessionDate) {
  return state.sessions.find((session) => session.course_id === courseId && session.session_date === sessionDate) || null;
}

function getRecordsForSession(sessionId) {
  return state.records.filter((record) => record.session_id === sessionId);
}

function getBeatOutEntriesForSession(sessionId) {
  return state.beatOutEntries.filter((entry) => entry.session_id === sessionId);
}

function getBeatOutEntryForParticipantSession(participantId, sessionId) {
  if (!participantId || !sessionId) {
    return null;
  }

  return state.beatOutEntries.find((entry) => entry.participant_id === participantId && entry.session_id === sessionId) || null;
}

function getSessionOverrideForSource(participantId, sessionId) {
  if (!participantId || !sessionId) {
    return null;
  }

  return state.sessionOverrides.find((entry) => entry.participant_id === participantId && entry.source_session_id === sessionId) || null;
}

function getSessionOverrideForTarget(participantId, sessionId) {
  if (!participantId || !sessionId) {
    return null;
  }

  return state.sessionOverrides.find((entry) => entry.participant_id === participantId && entry.target_session_id === sessionId) || null;
}

function getSessionOverrideLabel(override) {
  if (!override) {
    return "";
  }

  const sourceSession = state.sessions.find((entry) => entry.id === override.source_session_id);
  const sourceCourse = sourceSession ? state.courses.find((entry) => entry.id === sourceSession.course_id) : null;
  if (!sourceSession || !sourceCourse) {
    return "Einzeltermin umgebucht";
  }

  return `Ersatz fuer ${sourceCourse.weekday} ${formatDateLabel(sourceSession.session_date)}`;
}

function getBeatOutLimitForPackage(packageType) {
  if (packageType === "1x TRAIN") {
    return 1;
  }
  if (packageType === "2x BEAT") {
    return 2;
  }
  if (packageType === "3x REPEAT") {
    return 3;
  }
  return 0;
}

function getPackageTypeForDayCount(dayCount) {
  if (dayCount === 1) {
    return "1x TRAIN";
  }
  if (dayCount === 2) {
    return "2x BEAT";
  }
  if (dayCount === 3) {
    return "3x REPEAT";
  }
  return null;
}

function getBeatOutUsageForBooking(bookingId) {
    const booking = state.seasonBookings.find((entry) => entry.id === bookingId) || null;
    const used = state.beatOutEntries.filter((entry) => entry.season_booking_id === bookingId).length;
    const limit = getBeatOutLimitForPackage(booking?.package_type);
    return {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
    };
  }

function getParticipantSeasonBooking(participant) {
  if (!participant) {
    return null;
  }

  if (participant.season_booking_id) {
    const directBooking = state.seasonBookings.find((entry) => entry.id === participant.season_booking_id) || null;
    if (directBooking) {
      return directBooking;
    }
  }

  const participantName = String(participant.full_name || "").trim().toLowerCase();
  const participantPhone = String(participant.phone || "").trim();

  return state.seasonBookings.find((entry) => {
    if (participant.season_id && entry.season_id !== participant.season_id) {
      return false;
    }
    if (String(entry.full_name || "").trim().toLowerCase() !== participantName) {
      return false;
    }
    if (!participantPhone) {
      return true;
    }
    return String(entry.phone || "").trim() === participantPhone;
  }) || null;
}

function getPersonKey({ full_name: fullName, phone } = {}) {
  const normalizedPhone = String(phone || "").replace(/\s+/g, "");
  if (normalizedPhone) {
    return `phone:${normalizedPhone.toLowerCase()}`;
  }
  return `name:${String(fullName || "").trim().toLowerCase()}`;
}

function getLifetimeBeatOutCount(bookingOrParticipant) {
  const key = getPersonKey(bookingOrParticipant);
  const bookingIds = state.seasonBookings
    .filter((entry) => getPersonKey(entry) === key)
    .map((entry) => entry.id);

  return state.beatOutEntries.filter((entry) => bookingIds.includes(entry.season_booking_id)).length;
}

function getFreeSeasonRewardStatus(bookingOrParticipant) {
  const total = getLifetimeBeatOutCount(bookingOrParticipant);
  const milestones = [4, 8, 12];
  const achievedRewards = Math.min(Math.floor(total / 4), 3);
  const nextMilestone = milestones.find((value) => value > total) || null;
  const remainingToNext = nextMilestone ? Math.max(nextMilestone - total, 0) : 0;
  return {
    total,
    achievedRewards,
    nextMilestone,
    remainingToNext,
  };
}

function getVisibleSeasonBookings() {
  return state.seasonBookings;
}

function getVisibleSeasons() {
  if (state.seasonFilter === "all") {
    return state.seasons;
  }

  return state.seasons.filter((season) => season.status === state.seasonFilter);
}

function getNextSeasonForRenewal(season) {
  if (!season) {
    return null;
  }

  const seasonEnd = new Date(`${season.end_date}T00:00:00`).getTime();
  return state.seasons
    .filter((entry) => entry.id !== season.id)
    .map((entry) => ({
      ...entry,
      startTime: new Date(`${entry.start_date}T00:00:00`).getTime(),
    }))
    .filter((entry) => entry.startTime >= seasonEnd)
    .sort((left, right) => left.startTime - right.startTime)[0] || null;
}

function getRenewalCandidates(seasonId) {
  const bookings = state.seasonBookings.filter((entry) => entry.season_id === seasonId);
  return bookings
    .map((booking) => {
      const participant = state.participants.find((entry) => entry.season_booking_id === booking.id) || null;
      const rate = participant ? getParticipantSeasonAttendanceRate(participant, seasonId) : 0;
      return {
        ...booking,
        participantId: participant?.id || null,
        rate,
      };
    })
    .filter((entry) => entry.rate < 60)
    .sort((left, right) => left.rate - right.rate);
}

function getRecoverySeverity(rate) {
  return rate <= 30 ? "critical" : "warn";
}

function getParticipantRecentHistory(participantId, limit = 6) {
  return state.records
    .filter((record) => record.participant_id === participantId)
    .map((record) => {
      const session = state.sessions.find((entry) => entry.id === record.session_id);
      const course = session ? state.courses.find((entry) => entry.id === session.course_id) : null;
      const beatOutEntry = getBeatOutEntryForParticipantSession(participantId, record.session_id);
      return {
        date: session?.session_date || "",
        courseName: course?.name || "Unbekannter Kurs",
        present: Boolean(record.present),
        beatOut: Boolean(beatOutEntry),
      };
    })
    .filter((entry) => entry.date)
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, limit);
}

function getTrainerName(trainerId) {
  return state.trainers.find((trainer) => trainer.user_id === trainerId)?.full_name || "Nicht zugewiesen";
}

function getTrainerDirectoryName(directoryId) {
  return state.trainerDirectory.find((entry) => entry.id === directoryId)?.full_name || "Nicht zugewiesen";
}

function getCourseTrainerName(course) {
  if (!course) {
    return "Nicht zugewiesen";
  }

  if (course.trainer_id) {
    return getTrainerName(course.trainer_id);
  }

  if (course.trainer_directory_id) {
    return getTrainerDirectoryName(course.trainer_directory_id);
  }

  return "Nicht zugewiesen";
}

function getCourseTrainerKey(course) {
  if (!course) {
    return null;
  }

  if (course.trainer_id) {
    return `auth:${course.trainer_id}`;
  }

  if (course.trainer_directory_id) {
    return `directory:${course.trainer_directory_id}`;
  }

  return null;
}

function getLatestInviteForTrainer(entry) {
  if (!entry) {
    return null;
  }

  const normalizedEmail = String(entry.email || "").trim().toLowerCase();
  return state.invites.find((invite) => {
    const inviteEmail = String(invite.invited_email || "").trim().toLowerCase();
    return invite.trainer_directory_id === entry.id
      || (normalizedEmail && inviteEmail === normalizedEmail);
  }) || null;
}

function getTrainerAccessState(entry) {
  if (!entry) {
    return { label: "Unbekannt" };
  }

  if (entry.linked_user_id) {
    return { label: "Registriert" };
  }

  const latestInvite = getLatestInviteForTrainer(entry);
  if (latestInvite?.active) {
    return {
      label: `Einladung offen (${latestInvite.code})`,
    };
  }

  if (entry.email) {
    return { label: "Noch kein Zugang vorbereitet" };
  }

  return { label: "Manuell ohne E-Mail" };
}

function getSelectedMonth() {
    return monthPicker.value || getCurrentMonth();
  }

function getEffectiveAttendanceDate() {
  syncAttendanceDateWithSeasonSessions();
  return attendanceDate?.value || getToday();
}

function getSelectedMonthLabel() {
  const [year, month] = getSelectedMonth().split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function getTopParticipantName() {
  const ranked = state.courses.flatMap((course) => getParticipantsForCourse(course.id).map((participant) => ({
    name: participant.full_name,
    rate: calculateAttendanceRate(course.id, participant.id),
  }))).sort((left, right) => right.rate - left.rate);

  return ranked[0] ? `${ranked[0].name} (${ranked[0].rate}%)` : "Noch keine Daten";
}

function getLowAttendanceParticipants() {
  return state.courses.flatMap((course) => getParticipantsForCourse(course.id)
    .filter((participant) => calculateAttendanceRate(course.id, participant.id) < 60));
}

function getUpcomingCourseDates(course, count) {
  const targetWeekday = getWeekdayNumber(course.weekday);
  if (targetWeekday === null) {
    return [];
  }

  const results = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (results.length < count) {
    if (cursor.getDay() === targetWeekday) {
      results.push(formatDateValue(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

function getMonthCourseDates(course, monthValue) {
  const targetWeekday = getWeekdayNumber(course.weekday);
  if (targetWeekday === null) {
    return [];
  }

  const [year, month] = monthValue.split("-").map(Number);
  const cursor = new Date(year, month - 1, 1);
  const results = [];

  while (cursor.getMonth() === month - 1) {
    if (cursor.getDay() === targetWeekday) {
      results.push(formatDateValue(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

function getWeekdayNumber(label) {
  const normalizedLabel = normalizeWeekdayLabel(label);
  const map = {
    Sonntag: 0,
    Montag: 1,
    Dienstag: 2,
    Mittwoch: 3,
    Donnerstag: 4,
    Freitag: 5,
    Samstag: 6,
  };
  return Object.prototype.hasOwnProperty.call(map, normalizedLabel) ? map[normalizedLabel] : null;
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCompactDateLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getTopCourseByAttendance() {
  const ranked = state.courses
    .map((course) => ({
      name: course.name,
      rate: getCourseAttendanceAverage(course.id),
    }))
    .filter((course) => course.rate !== null)
    .sort((left, right) => right.rate - left.rate);

  return ranked[0] || null;
}

function getWeakestCourseByAttendance() {
  const ranked = state.courses
    .map((course) => ({
      name: course.name,
      rate: getCourseAttendanceAverage(course.id),
    }))
    .filter((course) => course.rate !== null)
    .sort((left, right) => left.rate - right.rate);

  return ranked[0] || null;
}

function getTopTrainerByAttendance() {
  const ranked = getTrainerSummaries()
    .map((trainer) => {
      const trainerCourses = state.courses.filter((course) => getCourseTrainerKey(course) === trainer.key);
      if (!trainerCourses.length) {
        return null;
      }

      const averages = trainerCourses
        .map((course) => getCourseAttendanceAverage(course.id))
        .filter((value) => value !== null);

      if (!averages.length) {
        return null;
      }

      return {
        name: trainer.name,
        rate: Math.round(averages.reduce((sum, value) => sum + value, 0) / averages.length),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.rate - left.rate);

  return ranked[0] || null;
}

function getBusiestWeekday() {
  const counts = state.courses.reduce((accumulator, course) => {
    const key = course.weekday || "Unbekannt";
    accumulator[key] ||= 0;
    accumulator[key] += getSessionsForCourse(course.id).length;
    return accumulator;
  }, {});

  const ranked = Object.entries(counts)
    .map(([label, sessions]) => ({ label, sessions }))
    .sort((left, right) => right.sessions - left.sessions);

  return ranked[0] || null;
}

function getCourseAttendanceAverage(courseId) {
  const participants = getParticipantsForCourse(courseId);
  const sessions = getSessionsForCourse(courseId);
  if (!participants.length || !sessions.length) {
    return null;
  }

  const relevantRecords = state.records.filter((record) => sessions.some((session) => session.id === record.session_id));
  return Math.round((relevantRecords.filter((record) => record.present).length / (participants.length * sessions.length)) * 100);
}

function getNextCourseForToday() {
  const todayWeekday = normalizeWeekdayLabel(new Date().toLocaleDateString("de-DE", { weekday: "long" }));
  const todayCourses = state.courses
    .filter((course) => normalizeWeekdayLabel(course.weekday) === todayWeekday)
    .sort((left, right) => String(left.time || "").localeCompare(String(right.time || "")));

  if (!todayCourses.length) {
    return null;
  }

  const nowMinutes = getCurrentMinutes();
  return todayCourses.find((course) => getTimeInMinutes(course.time) >= nowMinutes) || todayCourses[0];
}

function isAdmin() {
  return state.profile?.role === "admin";
}

function canEditCourse(course) {
  return Boolean(state.session && state.profile && (isAdmin() || course.trainer_id === state.session.user.id));
}

function resetProtectedState() {
  state.profile = null;
  state.courses = [];
  state.seasons = [];
  state.seasonBookings = [];
  state.trainers = [];
  state.trainerDirectory = [];
  state.invites = [];
  state.participants = [];
  state.trialRequests = [];
  state.dropInBookings = [];
  state.sessions = [];
  state.records = [];
  state.beatOutEntries = [];
  state.selectedCourseId = null;
    state.selectedSeasonId = null;
    state.attendanceSeasonId = null;
    state.selectedParticipantId = null;
    state.participantSearch = "";
    closeParticipantProfileModal();
  }

function toggleMobileNav() {
  const isOpen = appNav.classList.toggle("is-open");
  navToggleBtn.setAttribute("aria-expanded", String(isOpen));
}

function closeNavGroups() {
  navGroups.forEach((group) => {
    group.open = false;
  });
}

function closeMobileNav() {
  appNav.classList.remove("is-open");
  navToggleBtn.setAttribute("aria-expanded", "false");
}

function isCompactViewport() {
  return window.matchMedia("(max-width: 860px)").matches;
}

async function handleConnectivityChange() {
  state.isOffline = !navigator.onLine;
  if (!state.isOffline && state.session) {
    await flushOfflineQueue();
    await loadProtectedData();
  }
  render();
}

function scrollToSection(selector) {
  setActiveSection(selector);
  closeMobileNav();
}

function updateActiveNavLink() {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === state.activeSection);
  });
}

function setActiveSection(sectionId) {
  if (!sectionId) {
    return;
  }

  state.activeSection = sectionId;
  render();
  mainGrid?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getAvailableSections({ connected, loggedIn, appUnlocked }) {
  const sections = [];

  if (!connected || !loggedIn) {
    sections.push("#authPanel");
  }

  if (loggedIn) {
    sections.push("#sessionPanel");
  }

  if (loggedIn && isAdmin()) {
    sections.push("#adminPanel", "#coursePanel", "#seasonPanel", "#bookingPanel");
  }

  if (appUnlocked) {
    sections.push(
      "#todayPanel",
      "#trialsPanel",
      "#courseListPanel",
      "#planningPanel",
      "#attendancePanel",
      "#monthlyPanel",
      "#statsPanel",
      "#businessPanel",
      "#reportsPanel",
    );
  }

  return sections;
}

function ensureActiveSection(availableSections, { connected, loggedIn, appUnlocked }) {
  if (state.activeSection && availableSections.includes(state.activeSection)) {
    return;
  }

  if (!connected || !loggedIn) {
    state.activeSection = "#authPanel";
    return;
  }

  if (appUnlocked && isCompactViewport()) {
    state.activeSection = availableSections.includes("#todayPanel") ? "#todayPanel" : availableSections[0] || null;
    return;
  }

  if (isAdmin()) {
    state.activeSection = availableSections.includes("#seasonPanel") ? "#seasonPanel" : availableSections[0] || null;
    return;
  }

  if (appUnlocked) {
    state.activeSection = availableSections.includes("#todayPanel") ? "#todayPanel" : availableSections[0] || null;
    return;
  }

  state.activeSection = availableSections[0] || null;
}

async function saveAttendanceValue(courseId, participantId, sessionDate, present) {
  let sessionId;
  try {
    sessionId = await ensureSession(courseId, sessionDate);
  } catch (error) {
    notify(error.message, true);
    return false;
  }

  const { error } = await state.supabase
    .from("attendance_records")
    .upsert({
      session_id: sessionId,
      participant_id: participantId,
      present,
    }, {
      onConflict: "session_id,participant_id",
    });

  if (error) {
    notify(error.message, true);
    return false;
  }

  return true;
}

async function clearBeatOutForParticipantSession(participantId, sessionDate, courseId) {
  if (!participantId || !sessionDate || !courseId || state.isOffline) {
    return;
  }

  const session = getSessionForCourseAndDate(courseId, sessionDate);
  if (!session) {
    return;
  }

  const existingEntry = getBeatOutEntryForParticipantSession(participantId, session.id);
  if (!existingEntry) {
    return;
  }

  const { error } = await state.supabase
    .from("beat_out_entries")
    .delete()
    .eq("id", existingEntry.id);

  if (error) {
    notify(getFriendlySupabaseMessage(error, "BEAT-OUT konnte nicht entfernt werden."), true);
  }
}

function applyLocalAttendanceChange(courseId, participantId, sessionDate, present) {
  const session = ensureLocalSession(courseId, sessionDate);
  const existing = state.records.find((record) => {
    return record.session_id === session.id && record.participant_id === participantId;
  });

  if (existing) {
    existing.present = present;
  } else {
    state.records.push({
      session_id: session.id,
      participant_id: participantId,
      present,
    });
  }
}

function ensureLocalSession(courseId, sessionDate) {
  const existing = getSessionForCourseAndDate(courseId, sessionDate);
  if (existing) {
    return existing;
  }

  const offlineSession = {
    id: `offline:${courseId}:${sessionDate}`,
    course_id: courseId,
    session_date: sessionDate,
  };
  state.sessions.push(offlineSession);
  return offlineSession;
}

function queueOfflineAction(action) {
  state.pendingActions.push({
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...action,
  });
  persistOfflineQueue();
}

async function flushOfflineQueue() {
  if (state.isOffline || !state.session || !state.pendingActions.length) {
    return;
  }

  const remaining = [];

  for (const action of state.pendingActions) {
    try {
      await executeOfflineAction(action);
    } catch (error) {
      remaining.push(action);
      console.error("Offline action failed", error);
    }
  }

  state.pendingActions = remaining;
  persistOfflineQueue();
}

async function executeOfflineAction(action) {
  if (action.type === "set-attendance") {
    const success = await saveAttendanceValue(
      action.payload.courseId,
      action.payload.participantId,
      action.payload.sessionDate,
      action.payload.present,
    );
    if (!success) {
      throw new Error("Attendance sync failed");
    }
    return;
  }

  if (action.type === "set-attendance-all") {
    let sessionId;
    try {
      sessionId = await ensureSession(action.payload.courseId, action.payload.sessionDate);
    } catch (error) {
      throw error;
    }

    const payload = getParticipantsForCourse(action.payload.courseId).map((participant) => ({
      session_id: sessionId,
      participant_id: participant.id,
      present: action.payload.value,
    }));

    const { error } = await state.supabase
      .from("attendance_records")
      .upsert(payload, {
        onConflict: "session_id,participant_id",
      });

    if (error) {
      throw error;
    }
    return;
  }

  if (action.type === "create-sessions") {
    const payload = action.payload.dates.map((date) => ({
      course_id: action.payload.courseId,
      session_date: date,
      created_by: state.session.user.id,
    }));

    const { error } = await state.supabase
      .from("attendance_sessions")
      .insert(payload);

    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      throw error;
    }
  }
}

function persistOfflineCache() {
  if (!ENABLE_OFFLINE_MODE) {
    return;
  }
  const payload = {
    profile: state.profile,
    courses: state.courses,
    seasons: state.seasons,
    seasonBookings: state.seasonBookings,
    trainers: state.trainers,
    trainerDirectory: state.trainerDirectory,
    invites: state.invites,
    participants: state.participants,
    trialRequests: state.trialRequests,
    sessions: state.sessions,
      records: state.records,
      beatOutEntries: state.beatOutEntries,
      selectedCourseId: state.selectedCourseId,
    };
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
}

function hydrateFromOfflineCache() {
  if (!ENABLE_OFFLINE_MODE) {
    return;
  }
  const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
  if (!raw) {
    return;
  }

  try {
    const cached = JSON.parse(raw);
    state.profile = cached.profile || state.profile;
    state.courses = Array.isArray(cached.courses) ? cached.courses : [];
    state.seasons = Array.isArray(cached.seasons) ? cached.seasons : [];
    state.seasonBookings = Array.isArray(cached.seasonBookings) ? cached.seasonBookings : [];
    state.trainers = Array.isArray(cached.trainers) ? cached.trainers : [];
    state.trainerDirectory = Array.isArray(cached.trainerDirectory) ? cached.trainerDirectory : [];
    state.invites = Array.isArray(cached.invites) ? cached.invites : [];
    state.participants = Array.isArray(cached.participants) ? cached.participants : [];
    state.trialRequests = Array.isArray(cached.trialRequests) ? cached.trialRequests : [];
    state.sessions = Array.isArray(cached.sessions) ? cached.sessions : [];
      state.records = Array.isArray(cached.records) ? cached.records : [];
      state.beatOutEntries = Array.isArray(cached.beatOutEntries) ? cached.beatOutEntries : [];
      state.selectedCourseId = cached.selectedCourseId || state.selectedCourseId;
      state.selectedSeasonId = null;
      state.attendanceSeasonId = null;
    } catch (error) {
      console.error("Offline cache konnte nicht geladen werden", error);
    }
  }

function loadOfflineQueue() {
  if (!ENABLE_OFFLINE_MODE) {
    return [];
  }
  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistOfflineQueue() {
  if (!ENABLE_OFFLINE_MODE) {
    return;
  }
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(state.pendingActions));
}

async function clearLegacyOfflineState() {
  try {
    localStorage.removeItem("beatfield-offline-cache-v1");
    localStorage.removeItem("beatfield-offline-queue-v1");
    localStorage.removeItem("beatfield-offline-cache-v2");
    localStorage.removeItem("beatfield-offline-queue-v2");

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith("beatfield-attendance-cache-"))
          .map((key) => caches.delete(key)),
      );
    }
  } catch (error) {
    console.error("Legacy offline state cleanup failed", error);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
      if (registration.waiting) {
        window.location.reload();
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}

function notify(message, isError = false) {
  statusHeadline.textContent = isError ? "Aktion fehlgeschlagen" : "Status aktualisiert";
  statusText.textContent = message;
  if (statusMeta) {
    statusMeta.textContent = `${isError ? "Fehler" : "Letzte Aktion"} • ${formatStatusTimestamp()}`;
    statusMeta.dataset.locked = "true";
    window.clearTimeout(notify.resetTimerId);
    notify.resetTimerId = window.setTimeout(() => {
      if (!statusMeta) {
        return;
      }
      delete statusMeta.dataset.locked;
      if (state.session && state.profile) {
        statusMeta.textContent = "Bereit fuer den Tagesbetrieb";
      } else if (state.supabase) {
        statusMeta.textContent = "Warte auf Anmeldung";
      } else {
        statusMeta.textContent = "Setup offen";
      }
    }, 6000);
  }
}

function formatStatusTimestamp() {
  return new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function refreshVisibleData({ includeCourses = false, context = "Refresh", silent = false } = {}) {
  try {
    if (includeCourses) {
      await fetchVisibleCourses();
    }
    await fetchSupportData();
    persistOfflineCache();
    render();
    return true;
  } catch (error) {
    console.error(`${context} failed`, error);
    if (!silent) {
      notify("Daten konnten nicht vollstaendig aktualisiert werden.", true);
    }
    return false;
  }
}

function markOptimisticVisibility(key, durationMs = 15000) {
  state.optimisticVisibilityUntil[key] = Date.now() + durationMs;
}

function clearOptimisticVisibility(key) {
  state.optimisticVisibilityUntil[key] = 0;
}

function shouldPreserveFetchedList(key, currentList, fetchedList) {
  if (
    !state.acceptEmptyFetch[key]
    && Array.isArray(currentList)
    && currentList.length > 0
    && Array.isArray(fetchedList)
    && fetchedList.length === 0
  ) {
    return true;
  }

  const preserveUntil = state.optimisticVisibilityUntil[key] || 0;
  if (Date.now() > preserveUntil) {
    return false;
  }

  return Array.isArray(currentList)
    && currentList.length > 0
    && Array.isArray(fetchedList)
    && fetchedList.length === 0;
}

function mergeOptimisticItems(currentList, fetchedList) {
  const merged = new Map();

  (fetchedList || []).forEach((item) => {
    merged.set(item.id, item);
  });

  (currentList || []).forEach((item) => {
    if (!merged.has(item.id)) {
      merged.set(item.id, item);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    return String(right.created_at || "").localeCompare(String(left.created_at || ""));
  });
}

function mergeAttendanceRecords(currentList, fetchedList) {
  const merged = new Map();

  (fetchedList || []).forEach((record) => {
    merged.set(`${record.session_id}:${record.participant_id}`, record);
  });

  (currentList || []).forEach((record) => {
    const key = `${record.session_id}:${record.participant_id}`;
    if (!merged.has(key)) {
      merged.set(key, record);
    }
  });

  return Array.from(merged.values());
}

function mergeBeatOutEntries(currentList, fetchedList) {
  const merged = new Map();

  (fetchedList || []).forEach((entry) => {
    merged.set(`${entry.session_id}:${entry.participant_id}`, entry);
  });

  (currentList || []).forEach((entry) => {
    const key = `${entry.session_id}:${entry.participant_id}`;
    if (!merged.has(key)) {
      merged.set(key, entry);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    return String(right.created_at || "").localeCompare(String(left.created_at || ""));
  });
}

function getFriendlySupabaseMessage(error, fallback) {
  const message = String(error?.message || fallback || "").trim();
  const normalized = message.toLowerCase();

  if (
    normalized.includes("trainer_directory")
    || normalized.includes("trainer_directory_id")
    || normalized.includes("invited_email")
    || normalized.includes("season_bookings")
    || normalized.includes("season_id")
    || normalized.includes("seasons")
    || normalized.includes("selected_days")
    || normalized.includes("beat_out")
    || normalized.includes("beat out")
    || normalized.includes("session_overrides")
    || normalized.includes("source_session_id")
    || normalized.includes("target_session_id")
  ) {
    return "Die App braucht das neueste Supabase-Schema. Bitte `supabase-schema.sql` noch einmal komplett im SQL Editor ausfuehren.";
  }

  if (normalized.includes("relation") && normalized.includes("does not exist")) {
    return "In Supabase fehlt noch mindestens eine Tabelle. Bitte `supabase-schema.sql` noch einmal komplett ausfuehren.";
  }

  return message || fallback || "Aktion fehlgeschlagen.";
}

function generateInviteCode() {
  return `BF-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function isRecoveryMode() {
  const fragment = window.location.hash || "";
  const query = window.location.search || "";
  return fragment.includes("type=recovery") || query.includes("type=recovery");
}

function buildInviteLink(code) {
  const url = new URL(config.siteUrl);
  url.searchParams.set("invite", code);
  return url.toString();
}

function applyInviteCodeFromUrl() {
  const inviteCode = new URLSearchParams(window.location.search).get("invite");
  if (!inviteCode) {
    return;
  }

  const inviteInput = signupForm.querySelector('input[name="inviteCode"]');
  if (inviteInput) {
    inviteInput.value = inviteCode;
  }
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getDefaultSeasonId() {
  const today = getToday();
  const activeSeason = state.seasons.find((season) => season.start_date <= today && season.end_date >= today);
  return activeSeason?.id || state.seasons[0]?.id || null;
}

function calculateSeasonEndDate(startDate) {
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + 27);
  return formatDateValue(date);
}

function getExpectedDayCount(packageType) {
  if (packageType === "1x TRAIN") {
    return 1;
  }

  if (packageType === "2x BEAT") {
    return 2;
  }

  return 3;
}

function syncBookingDayInputs() {
  if (!seasonBookingForm) {
    return;
  }

  const selectedPackage = bookingPackageSelect?.value || "1x TRAIN";
  const dayInputs = Array.from(seasonBookingForm.querySelectorAll('input[name="selectedDays"]'));

  if (selectedPackage === "3x REPEAT") {
    dayInputs.forEach((input) => {
      input.checked = true;
      input.disabled = true;
    });
    return;
  }

  dayInputs.forEach((input) => {
    input.disabled = false;
  });

  const selectedCount = dayInputs.filter((input) => input.checked).length;
  const maxCount = getExpectedDayCount(selectedPackage);
  if (selectedCount > maxCount) {
    let toUncheck = selectedCount - maxCount;
    dayInputs.slice().reverse().forEach((input) => {
      if (toUncheck > 0 && input.checked) {
        input.checked = false;
        toUncheck -= 1;
      }
    });
  }
}

function buildSeasonSessionPayload(startDate, endDate, seasonId = null, explicitDates = []) {
  const payload = [];
  const exactDates = Array.isArray(explicitDates) && explicitDates.length
    ? Array.from(new Set(explicitDates)).sort()
    : null;

  state.courses.forEach((course) => {
    const weekdayNumber = getWeekdayNumber(course.weekday);
    if (weekdayNumber === null) {
      return;
    }

    const matchingDates = exactDates
      ? exactDates.filter((date) => new Date(`${date}T00:00:00`).getDay() === weekdayNumber)
      : null;

    if (matchingDates) {
      matchingDates.forEach((date) => {
        payload.push({
          course_id: course.id,
          session_date: date,
          season_id: seasonId,
          created_by: state.session.user.id,
        });
      });
      return;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const cursor = new Date(start);
    while (cursor <= end) {
      if (cursor.getDay() === weekdayNumber) {
        payload.push({
          course_id: course.id,
          session_date: formatDateValue(cursor),
          season_id: seasonId,
          created_by: state.session.user.id,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return payload;
}

function parseSeasonDateEntries(rawValue) {
  const matches = String(rawValue || "").match(/\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4}/g) || [];
  const parsed = matches
    .map((value) => {
      if (value.includes("-")) {
        return value;
      }
      const [day, month, year] = value.split(".");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    })
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();

  return Array.from(new Set(parsed));
}

function handleGenerateSeasonDates() {
  if (!seasonForm) {
    return;
  }

  const startDate = String(new FormData(seasonForm).get("startDate") || "").trim();
  if (!startDate) {
    notify("Bitte zuerst ein Startdatum fuer die Season setzen.", true);
    return;
  }

  const endDate = calculateSeasonEndDate(startDate);
  state.seasonDraftDates = getGeneratedSeasonDates(startDate, endDate);
  renderSeasonDateEditor();
  notify(`${state.seasonDraftDates.length} Standardtermine fuer die Season geladen.`);
}

function handleAddSeasonDraftDate() {
  const dateValue = String(seasonDateDraftInput?.value || "").trim();
  if (!dateValue) {
    notify("Bitte zuerst ein Datum fuer den Season-Termin waehlen.", true);
    return;
  }

  state.seasonDraftDates = Array.from(new Set([...state.seasonDraftDates, dateValue])).sort();
  if (seasonDateDraftInput) {
    seasonDateDraftInput.value = "";
  }
  renderSeasonDateEditor();
}

function getGeneratedSeasonDates(startDate, endDate) {
  const dates = new Set();
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const weekdayNumbers = Array.from(new Set(
    state.courses
      .map((course) => getWeekdayNumber(course.weekday))
      .filter((value) => value !== null),
  ));

  const cursor = new Date(start);
  while (cursor <= end) {
    if (weekdayNumbers.includes(cursor.getDay())) {
      dates.add(formatDateValue(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(dates).sort();
}

function getSeasonDatesWithoutMatchingCourse(dateValues) {
  return (dateValues || []).filter((date) => {
    const weekday = getWeekdayLabelFromDate(date);
    return !state.courses.some((course) => normalizeWeekdayLabel(course.weekday) === weekday);
  });
}

function getWeekdayLabelFromDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const map = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return map[date.getDay()] || "";
}

function addDaysToDate(dateValue, dayCount) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + dayCount);
  return formatDateValue(date);
}

function resolveSeasonIdForSession(sessionDate) {
  const season = getSelectedSeason();
  if (!season) {
    return null;
  }

  if (sessionDate < season.start_date || sessionDate > season.end_date) {
    return null;
  }

  return season.id;
}

function formatSelectedDays(days) {
  if (!Array.isArray(days) || !days.length) {
    return "Keine Tage";
  }

  return days.join(" + ");
}

function resolveRelevantCoursesForDays(selectedDays) {
  const relevantCourses = selectedDays.map((weekday) => {
    const normalizedWeekday = normalizeWeekdayLabel(weekday);
    const matches = state.courses.filter((course) => normalizeWeekdayLabel(course.weekday) === normalizedWeekday);
    return { weekday: normalizedWeekday, course: matches[0] || null, matchCount: matches.length };
  });

  const missingWeekdays = relevantCourses.filter((entry) => !entry.course).map((entry) => entry.weekday);
  if (missingWeekdays.length) {
    return {
      ok: false,
      message: `Fuer diese Trainingstage fehlt noch ein Kurs: ${missingWeekdays.join(", ")}.`,
    };
  }

  const ambiguousWeekdays = relevantCourses.filter((entry) => entry.matchCount > 1).map((entry) => entry.weekday);
  if (ambiguousWeekdays.length) {
    return {
      ok: false,
      message: `Bitte pro Trainingstag genau einen Kurs pflegen. Mehrfach gefunden fuer: ${ambiguousWeekdays.join(", ")}.`,
    };
  }

  return {
    ok: true,
    data: relevantCourses,
  };
}

function getAvailableSessionMoveTargets(participant, booking, sourceSessionId) {
  if (!participant || !booking || !sourceSessionId) {
    return [];
  }

  const season = state.seasons.find((entry) => entry.id === booking.season_id);
  if (!season) {
    return [];
  }

  const takenTargetSessionIds = new Set(
    state.sessionOverrides
      .filter((entry) => entry.participant_id === participant.id)
      .map((entry) => entry.target_session_id),
  );

  return getSeasonSessions(season.id)
    .filter((session) => {
      if (session.id === sourceSessionId) {
        return false;
      }
      if (takenTargetSessionIds.has(session.id)) {
        return false;
      }
      const course = state.courses.find((entry) => entry.id === session.course_id);
      if (!course) {
        return false;
      }
      return true;
    })
    .map((session) => ({
      session,
      course: state.courses.find((entry) => entry.id === session.course_id),
    }))
    .filter((entry) => entry.course)
    .sort((left, right) => String(left.session.session_date).localeCompare(String(right.session.session_date)));
}

async function removeSessionOverride(override, participantName = "Teilnehmer") {
  if (!override?.id) {
    return;
  }

  const deleteResult = await state.supabase
    .from("session_overrides")
    .delete()
    .eq("id", override.id);

  if (deleteResult.error) {
    notify(getFriendlySupabaseMessage(deleteResult.error, "Termin-Umbuchung konnte nicht aufgehoben werden."), true);
    return;
  }

  state.sessionOverrides = state.sessionOverrides.filter((entry) => entry.id !== override.id);
  render();
  notify(`Termin-Umbuchung fuer ${participantName} wurde aufgehoben.`);
  await refreshVisibleData({ context: "Session override delete refresh", silent: true });
}

function syncAttendanceDateWithSeasonSessions() {
  if (!attendanceDate) {
    return;
  }

  const course = getSelectedCourse();
  const season = getSelectedSeason();
  if (!course || !season) {
    return;
  }

  const seasonSessions = getSeasonSessionsForCourse(season.id, course.id);
  if (!seasonSessions.length) {
    return;
  }

  const availableDates = seasonSessions.map((session) => session.session_date);
  const currentValue = attendanceDate.value;
  if (availableDates.includes(currentValue)) {
    return;
  }

  const today = getToday();
  const nextDate = availableDates.find((date) => date >= today) || availableDates[0];
  attendanceDate.value = nextDate;
}

function normalizeWeekdayLabel(value) {
  const raw = String(value || "").trim().toLowerCase();
  const normalized = raw
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/s$/, "");

  const map = {
    so: "Sonntag",
    sonntag: "Sonntag",
    sunday: "Sonntag",
    mo: "Montag",
    montag: "Montag",
    monday: "Montag",
    di: "Dienstag",
    dienstag: "Dienstag",
    tue: "Dienstag",
    tuesday: "Dienstag",
    mi: "Mittwoch",
    mittwoch: "Mittwoch",
    wed: "Mittwoch",
    wednesday: "Mittwoch",
    do: "Donnerstag",
    donnerstag: "Donnerstag",
    thu: "Donnerstag",
    thursday: "Donnerstag",
    fr: "Freitag",
    freitag: "Freitag",
    fri: "Freitag",
    friday: "Freitag",
    sa: "Samstag",
    samstag: "Samstag",
    saturday: "Samstag",
  };

  return map[normalized] || String(value || "").trim();
}

function getNextSeasonStartDate(endDate) {
  const date = new Date(`${endDate}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return formatDateValue(date);
}

function normalizeOptionalId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === "null" || normalized.toLowerCase() === "undefined") {
    return null;
  }

  return normalized;
}

function parseTrainerSelection(value) {
  const normalized = normalizeOptionalId(value);
  if (!normalized) {
    return { trainerId: null, directoryId: null };
  }

  if (normalized.startsWith("auth:")) {
    return {
      trainerId: normalized.replace("auth:", ""),
      directoryId: null,
    };
  }

  if (normalized.startsWith("directory:")) {
    return {
      trainerId: null,
      directoryId: normalized.replace("directory:", ""),
    };
  }

  return {
    trainerId: normalized,
    directoryId: null,
  };
}

function getTrainerSummaries() {
  const authSummaries = state.trainers.map((trainer) => ({
    key: `auth:${trainer.user_id}`,
    name: trainer.full_name,
  }));

  const manualSummaries = state.trainerDirectory
    .filter((entry) => !entry.linked_user_id)
    .map((entry) => ({
      key: `directory:${entry.id}`,
      name: entry.full_name,
    }));

  return [...authSummaries, ...manualSummaries];
}

function getCurrentMinutes() {
  const now = new Date();
  return (now.getHours() * 60) + now.getMinutes();
}

function getTimeInMinutes(value) {
  if (!value || !String(value).includes(":")) {
    return Number.POSITIVE_INFINITY;
  }

  const [hours, minutes] = String(value).split(":").map(Number);
  return (hours * 60) + minutes;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
