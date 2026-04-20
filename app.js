import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.APP_CONFIG || {};
const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.siteUrl);
const OFFLINE_CACHE_KEY = "beatfield-offline-cache-v1";
const OFFLINE_QUEUE_KEY = "beatfield-offline-queue-v1";

const state = {
  supabase: null,
  session: null,
  profile: null,
  courses: [],
  seasons: [],
  seasonBookings: [],
  trainers: [],
  trainerDirectory: [],
  invites: [],
  participants: [],
  trialRequests: [],
  sessions: [],
  records: [],
  beatOutEntries: [],
  selectedCourseId: null,
  selectedSeasonId: null,
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
  },
  acceptEmptyFetch: {
    courses: false,
    trainerDirectory: false,
    invites: false,
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
const seasonBookingForm = document.querySelector("#seasonBookingForm");
const saveBookingBtn = document.querySelector("#saveBookingBtn");
const cancelBookingEditBtn = document.querySelector("#cancelBookingEditBtn");
const participantForm = document.querySelector("#participantForm");
const trialForm = document.querySelector("#trialForm");
const inviteOutput = document.querySelector("#inviteOutput");
const inviteOutputCode = document.querySelector("#inviteOutputCode");
const inviteOutputLink = document.querySelector("#inviteOutputLink");
const copyInviteLinkBtn = document.querySelector("#copyInviteLinkBtn");
const attendanceDate = document.querySelector("#attendanceDate");
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
const moveParticipantTargetCourse = document.querySelector("#moveParticipantTargetCourse");
const closeMoveParticipantModalBtn = document.querySelector("#closeMoveParticipantModalBtn");
const cancelMoveParticipantBtn = document.querySelector("#cancelMoveParticipantBtn");
const trialCourseSelect = document.querySelector("#trialCourseSelect");
const inviteList = document.querySelector("#inviteList");
const courseList = document.querySelector("#courseList");
const trialCards = document.querySelector("#trialCards");
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
seasonBookingForm?.addEventListener("submit", handleSeasonBookingCreate);
cancelBookingEditBtn?.addEventListener("click", resetBookingForm);
deleteCourseBtn?.addEventListener("click", handleCourseDelete);
participantForm?.addEventListener("submit", handleParticipantCreate);
trialForm?.addEventListener("submit", handleTrialCreate);
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
monthPicker?.addEventListener("change", render);
attendanceSeasonSelect?.addEventListener("change", () => {
  state.selectedSeasonId = normalizeOptionalId(attendanceSeasonSelect.value);
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
mobileTodayBtn?.addEventListener("click", () => scrollToSection("#attendancePanel"));
mobileMonthBtn?.addEventListener("click", () => scrollToSection("#monthlyPanel"));
mobileReportsBtn?.addEventListener("click", () => scrollToSection("#reportsPanel"));
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
  registerServiceWorker();

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

  hydrateFromOfflineCache();
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
      .select("id, course_id, session_date")
      .in("course_id", courseIds)
      .order("session_date")
    : Promise.resolve({ data: [], error: null });

  const trialsQuery = courseIds.length
    ? state.supabase
      .from("trial_requests")
      .select("id, course_id, full_name, email, phone, status, notes, created_at, converted_participant_id")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const [seasonResult, seasonBookingResult, trainerResult, trainerDirectoryResult, inviteResult, participantResult, sessionResult, trialResult] = await Promise.all([
    seasonsQuery,
    seasonBookingsQuery,
    trainerQuery,
    trainerDirectoryQuery,
    inviteQuery,
    participantsQuery,
    sessionsQuery,
    trialsQuery,
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

  if (!seasonResult.error) {
    state.seasons = seasonResult.data || [];
  }
  if (!seasonBookingResult.error) {
    state.seasonBookings = seasonBookingResult.data || [];
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
    state.participants = participantResult.data || [];
  }
  if (!sessionResult.error) {
    state.sessions = sessionResult.data || [];
  }
  if (!trialResult.error) {
    state.trialRequests = trialResult.data || [];
  }

  if (!state.selectedSeasonId || !state.seasons.some((season) => season.id === state.selectedSeasonId)) {
    state.selectedSeasonId = getDefaultSeasonId();
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

  state.records = recordResult.data || [];

  const beatOutResult = await state.supabase
    .from("beat_out_entries")
    .select("id, session_id, participant_id, season_booking_id, created_at")
    .in("session_id", sessionIds);

  if (beatOutResult.error) {
    notify(getFriendlySupabaseMessage(beatOutResult.error, "BEAT-OUTs konnten nicht geladen werden."), true);
    state.beatOutEntries = [];
  } else {
    state.beatOutEntries = beatOutResult.data || [];
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
    await fetchSupportData();
    persistOfflineCache();
    render();
  } catch (error) {
    console.error("Invite refresh failed", error);
  }
}

async function handleTrainerDirectoryCreate(event) {
  event.preventDefault();

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
      await fetchSupportData();
      render();
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

  try {
    await fetchSupportData();
    persistOfflineCache();
    render();
  } catch (error) {
    console.error("Trainer refresh failed", error);
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

  try {
    await fetchVisibleCourses();
    await fetchSupportData();
    persistOfflineCache();
    render();
  } catch (error) {
    console.error("Course refresh failed", error);
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
  const endDate = calculateSeasonEndDate(startDate);

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

  const sessionPayload = buildSeasonSessionPayload(startDate, endDate);
  if (sessionPayload.length) {
    const sessionResult = await state.supabase
      .from("attendance_sessions")
      .insert(sessionPayload);

    if (sessionResult.error && !String(sessionResult.error.message).toLowerCase().includes("duplicate")) {
      notify(getFriendlySupabaseMessage(sessionResult.error, "Season wurde angelegt, aber die Termine konnten nicht vollstaendig erzeugt werden."), true);
    }
  }

  state.selectedSeasonId = data.id;
  seasonForm.reset();
  await fetchSupportData();
  render();
  notify(`Season "${name}" wurde angelegt.`);
}

async function handleSeasonBookingCreate(event) {
  event.preventDefault();

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
      .select("id")
      .single();

    if (bookingInsertResult.error) {
      notify(getFriendlySupabaseMessage(bookingInsertResult.error, "Buchung konnte nicht gespeichert werden."), true);
      return;
    }

    savedBookingId = bookingInsertResult.data.id;
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
    await fetchSupportData();
    render();
    return;
  }

  state.selectedSeasonId = seasonId;
  resetBookingForm();
  await fetchSupportData();
  render();
  notify(bookingId
    ? `${fullName} wurde in der Buchung aktualisiert.`
    : `${fullName} wurde fuer ${packageType} eingebucht.`);
}

async function handleCourseDelete() {
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

  const { error } = await state.supabase
    .from("courses")
    .delete()
    .eq("id", course.id);

  if (error) {
    notify(getFriendlySupabaseMessage(error, "Kurs konnte nicht geloescht werden."), true);
    return;
  }

  clearOptimisticVisibility("courses");
  state.acceptEmptyFetch.courses = true;
  await fetchVisibleCourses();
  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`Kurs "${course.name}" wurde geloescht.`);
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
  const sessionPayload = buildSeasonSessionPayload(nextStartDate, nextEndDate);
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

  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`Buchung von ${booking.full_name} wurde geloescht.`);
}

async function handleTrainerDirectoryDelete(entry) {
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

  const { error } = await state.supabase
    .from("trainer_directory")
    .delete()
    .eq("id", entry.id);

  if (error) {
    notify(getFriendlySupabaseMessage(error, "Trainer konnte nicht geloescht werden."), true);
    return;
  }

  clearOptimisticVisibility("trainerDirectory");
  clearOptimisticVisibility("invites");
  state.acceptEmptyFetch.trainerDirectory = true;
  state.acceptEmptyFetch.invites = true;
  await fetchVisibleCourses();
  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`Trainer "${entry.full_name}" wurde geloescht.`);
}

async function handleParticipantCreate(event) {
  event.preventDefault();

  const course = getSelectedCourse();
  if (!course || !canEditCourse(course)) {
    return;
  }

  const formData = new FormData(participantForm);
  const { error } = await state.supabase
    .from("participants")
    .insert({
      course_id: course.id,
      full_name: String(formData.get("fullName")).trim(),
      phone: String(formData.get("phone")).trim(),
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  participantForm.reset();
  await fetchSupportData();
  render();
  notify("Teilnehmer hinzugefuegt.");
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
        })
        .eq("id", existing.id);

      if (updateResult.error) {
        return {
          ok: false,
          message: getFriendlySupabaseMessage(updateResult.error, "Teilnehmer konnten nicht aktualisiert werden."),
        };
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
        });

      if (insertResult.error) {
        return {
          ok: false,
          message: getFriendlySupabaseMessage(insertResult.error, "Teilnehmer konnten nicht fuer die Buchung angelegt werden."),
        };
      }
    }
  }

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

  const availableCourses = state.courses.filter((course) => course.id !== currentCourse.id);
  if (!availableCourses.length) {
    notify("Es gibt keinen anderen Kurs zum Umbuchen.", true);
    return;
  }

  state.moveParticipantContext = {
    participantId: participant.id,
    currentCourseId: currentCourse.id,
    availableCourseIds: availableCourses.map((course) => course.id),
  };

  if (!moveParticipantModal || !moveParticipantTargetCourse || !moveParticipantText) {
    notify("Umbuchungsfenster konnte nicht geoeffnet werden.", true);
    return;
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
  const targetCourse = state.courses.find((entry) => entry.id === moveParticipantTargetCourse.value);

  if (!participant || !currentCourse || !targetCourse) {
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
  const courseId = normalizeOptionalId(formData.get("courseId"));
  if (!courseId) {
    notify("Bitte zuerst einen gueltigen Kurs fuer das Probetraining auswaehlen.", true);
    return;
  }
  const { error } = await state.supabase
    .from("trial_requests")
    .insert({
      course_id: courseId,
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
  backendStatus.textContent = connected
    ? state.isOffline
      ? "Offline mit lokalem Cache"
      : "Supabase verbunden"
    : "Nicht verbunden";
  offlineStatus.textContent = state.isOffline
    ? `Offline aktiv - ${state.pendingActions.length} offene Aenderungen`
    : state.pendingActions.length
      ? `${state.pendingActions.length} Aenderungen werden synchronisiert`
      : "Online";
  userStatus.textContent = loggedIn ? state.profile.full_name : "Niemand angemeldet";
  sessionName.textContent = state.profile?.full_name || "-";
  sessionRole.textContent = state.profile?.role || "-";
  sessionMode.textContent = state.profile?.role === "trainer" ? "Heute zuerst" : state.profile?.role === "admin" ? "Dashboard zuerst" : "-";
  if (deleteCourseBtn) {
    deleteCourseBtn.disabled = !isAdmin() || !state.selectedCourseId;
  }

  renderSeasonSelects();
  renderSeasons();
  renderSeasonBookings();
  renderTrainerSelect();
  renderTrainerDirectory();
  renderTrialCourseSelect();
  renderInvites();
  renderTrials();
  renderTodayDashboard();
  renderCourseList();
  renderPlanning();
  renderParticipants();
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
  const openTrials = state.trialRequests.filter((trial) => trial.status !== "konvertiert" && trial.status !== "abgesagt").length;

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
      title: "Offene Offline-Aktionen",
      value: state.pendingActions.length,
      meta: state.isOffline ? "werden spaeter synchronisiert" : "bereit",
    },
    {
      title: "Offene Probetrainings",
      value: openTrials,
      meta: "aktuelle Conversion-Chancen",
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
      meta: "erreichte Bonus-Stufen aus BEAT-OUTs",
      tone: rewardSummary ? "warn" : "neutral",
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
      option.selected = season.id === state.selectedSeasonId;
      attendanceSeasonSelect.appendChild(option);
    });
  }

  if (bookingSeasonSelect) {
    bookingSeasonSelect.innerHTML = "";
    state.seasons.forEach((season) => {
      const option = document.createElement("option");
      option.value = season.id;
      option.textContent = `${season.name} (${season.start_date} - ${season.end_date})`;
      option.selected = season.id === state.selectedSeasonId;
      bookingSeasonSelect.appendChild(option);
    });
  }

  syncBookingDayInputs();
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
    card.innerHTML = `
      <h3>${escapeHtml(season.name)}</h3>
      <p class="stat-meta">${escapeHtml(season.start_date)} bis ${escapeHtml(season.end_date)}</p>
      <p class="stat-meta">Status: ${escapeHtml(season.status)}</p>
      <p class="stat-meta">${bookings.length} Buchungen</p>
    `;

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

    card.appendChild(actions);
    seasonList.appendChild(card);
  });
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
  trialCourseSelect.innerHTML = "";

  state.courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.name}${course.time ? ` - ${course.time} Uhr` : ""}`;
    trialCourseSelect.appendChild(option);
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
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `
      <h3>${escapeHtml(trial.full_name)}</h3>
      <p class="stat-meta">${course ? escapeHtml(course.name) : "Kein Kurs"}</p>
      <p class="stat-meta">${trial.email ? escapeHtml(trial.email) : "Keine E-Mail"}</p>
      <p class="stat-meta">${trial.phone ? escapeHtml(trial.phone) : "Keine Telefonnummer"}</p>
      <p class="stat-meta">Status: ${escapeHtml(trial.status)}</p>
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

async function convertTrialToParticipant(trial) {
  const { data, error } = await state.supabase
    .from("participants")
    .insert({
      course_id: trial.course_id,
      full_name: trial.full_name,
      phone: trial.phone || "",
    })
    .select("id")
    .single();

  if (error) {
    notify(error.message, true);
    return;
  }

  const updateResult = await state.supabase
    .from("trial_requests")
    .update({
      status: "konvertiert",
      converted_participant_id: data.id,
    })
    .eq("id", trial.id);

  if (updateResult.error) {
    notify(updateResult.error.message, true);
    return;
  }

  await fetchSupportData();
  render();
  notify("Probetraining wurde in Teilnehmer uebernommen.");
}

function handleJumpToToday() {
  attendanceDate.value = getToday();
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
  participantForm.classList.toggle("hidden", !canEditCourse(course) || Boolean(season));
  markAllPresentBtn.disabled = !canEditCourse(course);
  markAllAbsentBtn.disabled = !canEditCourse(course);

  const participants = getFilteredParticipants(course.id);
  if (!participants.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5"><div class="empty-state"><p>Keine Teilnehmer fuer die aktuelle Suche gefunden.</p></div></td>`;
    participantTableBody.appendChild(row);
    participantCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const session = getSessionForCourseAndDate(course.id, attendanceDate.value);
  const records = getRecordsForSession(session?.id);

  participants.forEach((participant) => {
    const record = records.find((entry) => entry.participant_id === participant.id);
    const isPresent = Boolean(record?.present);
    const beatOutEntry = getBeatOutEntryForParticipantSession(participant.id, session?.id);
    const bookingUsage = getBeatOutUsageForBooking(participant.season_booking_id);
    const rate = calculateAttendanceRate(course.id, participant.id);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><button type="button" class="link-button participant-profile-btn">${escapeHtml(participant.full_name)}</button></td>
      <td>
        ${participant.phone ? escapeHtml(participant.phone) : '<span class="muted">-</span>'}
        ${participant.season_booking_id ? `<div class="stat-meta beatout-meta">BEAT-OUT ${bookingUsage.used}/${bookingUsage.limit}</div>` : ""}
      </td>
      <td><button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button></td>
      <td><span class="badge">${rate}%</span></td>
      <td>
        <div class="mini-actions table-actions">
          <button type="button" class="ghost participant-beatout-btn${beatOutEntry ? " is-active" : ""}">${beatOutEntry ? "BEAT-OUT aktiv" : "BEAT-OUT"}</button>
          <button type="button" class="ghost participant-move-btn">Umbuchen</button>
        </div>
      </td>
    `;

    const toggleButton = row.querySelector(".attendance-toggle");
    toggleButton.disabled = !canEditCourse(course);
    toggleButton.addEventListener("click", async () => {
      await toggleAttendance(course.id, participant.id);
    });
    const moveButton = row.querySelector(".participant-move-btn");
    moveButton.disabled = !canEditCourse(course);
    moveButton.addEventListener("click", async () => {
      await handleParticipantMove(participant, course);
    });
    const beatOutButton = row.querySelector(".participant-beatout-btn");
    beatOutButton.disabled = !canEditCourse(course) || !participant.season_booking_id;
    beatOutButton.addEventListener("click", async () => {
      await toggleBeatOut(course.id, participant.id);
    });
    row.querySelector(".participant-profile-btn").addEventListener("click", () => {
      openParticipantProfile(participant.id, participant.season_booking_id);
    });
    participantTableBody.appendChild(row);

    const card = document.createElement("article");
    card.className = "participant-card";
    card.innerHTML = `
      <div class="participant-card-head">
        <div>
          <h3><button type="button" class="link-button participant-profile-btn">${escapeHtml(participant.full_name)}</button></h3>
          <p class="stat-meta">${participant.phone ? escapeHtml(participant.phone) : "Keine Telefonnummer"}</p>
          ${participant.season_booking_id ? `<p class="stat-meta beatout-meta">BEAT-OUT ${bookingUsage.used}/${bookingUsage.limit}</p>` : ""}
        </div>
        <span class="badge">${rate}%</span>
      </div>
      <div class="participant-card-actions">
        <button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button>
        <button type="button" class="ghost participant-beatout-btn${beatOutEntry ? " is-active" : ""}">${beatOutEntry ? "BEAT-OUT aktiv" : "BEAT-OUT"}</button>
        <button type="button" class="ghost participant-move-btn">Umbuchen</button>
      </div>
    `;

    const mobileToggle = card.querySelector(".attendance-toggle");
    mobileToggle.disabled = !canEditCourse(course);
    mobileToggle.addEventListener("click", async () => {
      await toggleAttendance(course.id, participant.id);
    });
    const mobileMoveButton = card.querySelector(".participant-move-btn");
    mobileMoveButton.disabled = !canEditCourse(course);
    mobileMoveButton.addEventListener("click", async () => {
      await handleParticipantMove(participant, course);
    });
    const mobileBeatOutButton = card.querySelector(".participant-beatout-btn");
    mobileBeatOutButton.disabled = !canEditCourse(course) || !participant.season_booking_id;
    mobileBeatOutButton.addEventListener("click", async () => {
      await toggleBeatOut(course.id, participant.id);
    });
    card.querySelector(".participant-profile-btn").addEventListener("click", () => {
      openParticipantProfile(participant.id, participant.season_booking_id);
    });
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

  const participants = getParticipantsForCourse(course.id);
  const session = getSessionForCourseAndDate(course.id, attendanceDate.value);
  const records = getRecordsForSession(session?.id);
  const presentCount = records.filter((record) => record.present).length;
  const absentCount = Math.max(participants.length - presentCount, 0);

  mobileSessionSummary.classList.remove("hidden");
  mobileSessionSummary.innerHTML = `
    <h3>${escapeHtml(course.name)}</h3>
    <p class="hero-stat">${presentCount}/${participants.length}</p>
    <p class="stat-meta">anwesend am ${escapeHtml(attendanceDate.value || getToday())}</p>
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

  const summaryCards = [
    { title: "Teilnehmer gesamt", value: state.participants.length, meta: `${newParticipantsThisMonth} neu in ${getSelectedMonthLabel()}` },
    { title: "Aktive Trainer", value: activeTrainerIds.size, meta: `${state.courses.length} Kurse live` },
    { title: "Sessions im Monat", value: monthSessions.length, meta: getSelectedMonthLabel() },
    { title: "No-Show-Rate", value: `${noShowRate}%`, meta: `${avgAttendance}% Anwesenheit` },
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

  const sessionDate = attendanceDate.value || getToday();
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

  if (nextPresent) {
    await clearBeatOutForParticipantSession(participantId, sessionDate, courseId);
  }

  await fetchSupportData();
  persistOfflineCache();
  render();
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

  const booking = state.seasonBookings.find((entry) => entry.id === participant.season_booking_id) || null;
  if (!booking) {
    notify("BEAT-OUT ist nur fuer Season-Buchungen verfuegbar.", true);
    return;
  }

  const sessionDate = attendanceDate.value || getToday();
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
    await fetchSupportData();
    persistOfflineCache();
    render();
    notify(`BEAT-OUT fuer ${participant.full_name} wurde entfernt.`);
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
  await fetchSupportData();
  persistOfflineCache();
  render();
  notify(`BEAT-OUT fuer ${participant.full_name} wurde eingetragen.`);
}

async function setAttendanceForAll(value) {
  const course = getSelectedCourse();
  if (!course || !canEditCourse(course)) {
    return;
  }

  const sessionDate = attendanceDate.value || getToday();

  if (state.isOffline) {
    getParticipantsForCourse(course.id).forEach((participant) => {
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

  const payload = getParticipantsForCourse(course.id).map((participant) => ({
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
    const participantIds = getParticipantsForCourse(course.id).map((participant) => participant.id);
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

  const { data, error } = await state.supabase
    .from("attendance_sessions")
    .insert({
      course_id: courseId,
      session_date: sessionDate,
      created_by: state.session.user.id,
    })
    .select("id, course_id, session_date")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  state.sessions.push(data);
  return data.id;
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
  return state.seasons.find((season) => season.id === state.selectedSeasonId) || null;
}

function getParticipantsForCourse(courseId) {
  const selectedSeasonId = state.selectedSeasonId;
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

function getFilteredParticipants(courseId) {
  const participants = getParticipantsForCourse(courseId);
  if (!state.participantSearch) {
    return participants;
  }

  return participants.filter((participant) => {
    return participant.full_name.toLowerCase().includes(state.participantSearch)
      || String(participant.phone || "").toLowerCase().includes(state.participantSearch);
  });
}

function getSessionsForCourse(courseId) {
  return state.sessions.filter((session) => session.course_id === courseId);
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
  const achievedRewards = Math.min(Math.floor(total / 4), 3);
  const nextMilestone = [4, 8, 12].find((value) => value > total) || null;
  return {
    total,
    achievedRewards,
    nextMilestone,
  };
}

function getVisibleSeasonBookings() {
  if (!state.selectedSeasonId) {
    return state.seasonBookings;
  }

  return state.seasonBookings.filter((booking) => booking.season_id === state.selectedSeasonId);
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
  state.sessions = [];
  state.records = [];
  state.beatOutEntries = [];
  state.selectedCourseId = null;
  state.selectedSeasonId = null;
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
    selectedSeasonId: state.selectedSeasonId,
  };
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
}

function hydrateFromOfflineCache() {
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
    state.selectedSeasonId = cached.selectedSeasonId || state.selectedSeasonId;
  } catch (error) {
    console.error("Offline cache konnte nicht geladen werden", error);
  }
}

function loadOfflineQueue() {
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
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(state.pendingActions));
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

function buildSeasonSessionPayload(startDate, endDate) {
  const payload = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  state.courses.forEach((course) => {
    const weekdayNumber = getWeekdayNumber(course.weekday);
    if (weekdayNumber === null) {
      return;
    }

    const cursor = new Date(start);
    while (cursor <= end) {
      if (cursor.getDay() === weekdayNumber) {
        payload.push({
          course_id: course.id,
          session_date: formatDateValue(cursor),
          created_by: state.session.user.id,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return payload;
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
