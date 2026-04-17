import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.APP_CONFIG || {};
const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.siteUrl);

const state = {
  supabase: null,
  session: null,
  profile: null,
  courses: [],
  trainers: [],
  invites: [],
  participants: [],
  sessions: [],
  records: [],
  selectedCourseId: null,
  participantSearch: "",
};

const setupNotice = document.querySelector("#setupNotice");
const authPanel = document.querySelector("#authPanel");
const sessionPanel = document.querySelector("#sessionPanel");
const adminPanel = document.querySelector("#adminPanel");
const coursePanel = document.querySelector("#coursePanel");
const courseListPanel = document.querySelector("#courseListPanel");
const attendancePanel = document.querySelector("#attendancePanel");
const monthlyPanel = document.querySelector("#monthlyPanel");
const statsPanel = document.querySelector("#statsPanel");
const businessPanel = document.querySelector("#businessPanel");
const reportsPanel = document.querySelector("#reportsPanel");
const appNav = document.querySelector(".app-nav");
const navToggleBtn = document.querySelector("#navToggleBtn");
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const resetForm = document.querySelector("#resetForm");
const updatePasswordForm = document.querySelector("#updatePasswordForm");
const logoutBtn = document.querySelector("#logoutBtn");
const inviteForm = document.querySelector("#inviteForm");
const courseForm = document.querySelector("#courseForm");
const participantForm = document.querySelector("#participantForm");
const inviteOutput = document.querySelector("#inviteOutput");
const inviteOutputCode = document.querySelector("#inviteOutputCode");
const inviteOutputLink = document.querySelector("#inviteOutputLink");
const copyInviteLinkBtn = document.querySelector("#copyInviteLinkBtn");
const attendanceDate = document.querySelector("#attendanceDate");
const monthPicker = document.querySelector("#monthPicker");
const participantSearch = document.querySelector("#participantSearch");
const trainerSelect = document.querySelector("#trainerSelect");
const inviteList = document.querySelector("#inviteList");
const courseList = document.querySelector("#courseList");
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
const backendStatus = document.querySelector("#backendStatus");
const userStatus = document.querySelector("#userStatus");
const sessionName = document.querySelector("#sessionName");
const sessionRole = document.querySelector("#sessionRole");
const markAllPresentBtn = document.querySelector("#markAllPresentBtn");
const markAllAbsentBtn = document.querySelector("#markAllAbsentBtn");
const exportBtn = document.querySelector("#exportBtn");
const exportMonthlyBtn = document.querySelector("#exportMonthlyBtn");
const exportLeaderboardBtn = document.querySelector("#exportLeaderboardBtn");
const exportTrainerReportBtn = document.querySelector("#exportTrainerReportBtn");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");

attendanceDate.value = getToday();
monthPicker.value = getCurrentMonth();

loginForm.addEventListener("submit", handleLogin);
signupForm.addEventListener("submit", handleSignup);
resetForm.addEventListener("submit", handleReset);
updatePasswordForm.addEventListener("submit", handleUpdatePassword);
logoutBtn.addEventListener("click", handleLogout);
inviteForm.addEventListener("submit", handleInviteCreate);
courseForm.addEventListener("submit", handleCourseCreate);
participantForm.addEventListener("submit", handleParticipantCreate);
attendanceDate.addEventListener("change", render);
monthPicker.addEventListener("change", render);
participantSearch.addEventListener("input", () => {
  state.participantSearch = participantSearch.value.trim().toLowerCase();
  renderParticipants();
  renderReportPreview();
});
markAllPresentBtn.addEventListener("click", () => setAttendanceForAll(true));
markAllAbsentBtn.addEventListener("click", () => setAttendanceForAll(false));
exportBtn.addEventListener("click", exportSelectedCourseCsv);
exportMonthlyBtn.addEventListener("click", exportMonthlyReportCsv);
exportLeaderboardBtn.addEventListener("click", exportLeaderboardCsv);
exportTrainerReportBtn.addEventListener("click", exportTrainerReportCsv);
copyInviteLinkBtn.addEventListener("click", handleCopyInviteLink);
navToggleBtn.addEventListener("click", toggleMobileNav);
mobileTodayBtn.addEventListener("click", () => scrollToSection("#attendancePanel"));
mobileMonthBtn.addEventListener("click", () => scrollToSection("#monthlyPanel"));
mobileReportsBtn.addEventListener("click", () => scrollToSection("#reportsPanel"));
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileNav();
  });
});
window.addEventListener("scroll", updateActiveNavLink, { passive: true });

initialize();

async function initialize() {
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

  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    await loadProtectedData();
    render();
  });

  await loadProtectedData();
  render();
  updateActiveNavLink();
}

async function loadProtectedData() {
  if (!state.session || !state.supabase) {
    resetProtectedState();
    return;
  }

  await fetchProfile();
  await fetchVisibleCourses();
  await fetchSupportData();
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
    .select("id, name, location, weekday, time, trainer_id")
    .order("weekday")
    .order("time");

  if (state.profile?.role === "trainer") {
    query = query.eq("trainer_id", state.session.user.id);
  }

  const { data, error } = await query;
  if (error) {
    notify(error.message, true);
    state.courses = [];
    return;
  }

  state.courses = data || [];

  if (!state.selectedCourseId || !state.courses.some((course) => course.id === state.selectedCourseId)) {
    state.selectedCourseId = state.courses[0]?.id || null;
  }
}

async function fetchSupportData() {
  const courseIds = state.courses.map((course) => course.id);

  const trainerQuery = state.supabase
    .from("profiles")
    .select("user_id, full_name, role")
    .in("role", ["admin", "trainer"])
    .order("full_name");

  const inviteQuery = isAdmin()
    ? state.supabase
      .from("invite_codes")
      .select("id, code, role, active, used_at")
      .order("created_at", { ascending: false })
    : Promise.resolve({ data: [], error: null });

  const participantsQuery = courseIds.length
    ? state.supabase
      .from("participants")
      .select("id, course_id, full_name, phone, created_at")
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

  const [trainerResult, inviteResult, participantResult, sessionResult] = await Promise.all([
    trainerQuery,
    inviteQuery,
    participantsQuery,
    sessionsQuery,
  ]);

  if (trainerResult.error) {
    notify(trainerResult.error.message, true);
  }
  if (inviteResult.error) {
    notify(inviteResult.error.message, true);
  }
  if (participantResult.error) {
    notify(participantResult.error.message, true);
  }
  if (sessionResult.error) {
    notify(sessionResult.error.message, true);
  }

  state.trainers = trainerResult.data || [];
  state.invites = inviteResult.data || [];
  state.participants = participantResult.data || [];
  state.sessions = sessionResult.data || [];

  const sessionIds = state.sessions.map((session) => session.id);
  if (!sessionIds.length) {
    state.records = [];
    return;
  }

  const recordResult = await state.supabase
    .from("attendance_records")
    .select("session_id, participant_id, present")
    .in("session_id", sessionIds);

  if (recordResult.error) {
    notify(recordResult.error.message, true);
    state.records = [];
    return;
  }

  state.records = recordResult.data || [];
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

  const { error } = await state.supabase
    .from("invite_codes")
    .insert({
      code,
      role,
      created_by: state.session.user.id,
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  inviteForm.reset();
  await fetchSupportData();
  showInviteOutput(code);
  render();
  notify(`Einladungscode ${code} wurde erstellt.`);
}

async function handleCourseCreate(event) {
  event.preventDefault();

  if (!isAdmin()) {
    return;
  }

  const formData = new FormData(courseForm);
  const { data, error } = await state.supabase
    .from("courses")
    .insert({
      name: String(formData.get("name")).trim(),
      location: String(formData.get("location")).trim(),
      weekday: String(formData.get("weekday")).trim(),
      time: String(formData.get("time")).trim() || null,
      trainer_id: String(formData.get("trainerId")) || null,
    })
    .select("id")
    .single();

  if (error) {
    notify(error.message, true);
    return;
  }

  state.selectedCourseId = data.id;
  courseForm.reset();
  await fetchVisibleCourses();
  await fetchSupportData();
  render();
  notify("Kurs gespeichert.");
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

function render() {
  const connected = Boolean(state.supabase);
  const loggedIn = Boolean(state.session && state.profile);
  const appUnlocked = loggedIn && (state.profile.role === "admin" || state.profile.role === "trainer");
  const recoveryMode = isRecoveryMode();

  authPanel.classList.toggle("hidden", loggedIn);
  sessionPanel.classList.toggle("hidden", !loggedIn);
  updatePasswordForm.classList.toggle("hidden", !loggedIn || !recoveryMode);
  adminPanel.classList.toggle("hidden", !loggedIn || !isAdmin());
  coursePanel.classList.toggle("hidden", !loggedIn || !isAdmin());
  courseListPanel.classList.toggle("hidden", !appUnlocked);
  attendancePanel.classList.toggle("hidden", !appUnlocked);
  monthlyPanel.classList.toggle("hidden", !appUnlocked);
  statsPanel.classList.toggle("hidden", !appUnlocked);
  businessPanel.classList.toggle("hidden", !appUnlocked);
  reportsPanel.classList.toggle("hidden", !appUnlocked);

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
  backendStatus.textContent = connected ? "Supabase verbunden" : "Nicht verbunden";
  userStatus.textContent = loggedIn ? state.profile.full_name : "Niemand angemeldet";
  sessionName.textContent = state.profile?.full_name || "-";
  sessionRole.textContent = state.profile?.role || "-";

  renderTrainerSelect();
  renderInvites();
  renderCourseList();
  renderParticipants();
  renderMonthlyOverview();
  renderStats();
  renderBusinessDashboard();
  renderReportPreview();
  renderMobileSessionSummary();
  updateActiveNavLink();
}

function renderTrainerSelect() {
  trainerSelect.innerHTML = "";

  state.trainers.forEach((trainer) => {
    const option = document.createElement("option");
    option.value = trainer.user_id;
    option.textContent = `${trainer.full_name} (${trainer.role})`;
    trainerSelect.appendChild(option);
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

function renderCourseList() {
  courseList.innerHTML = "";

  if (!state.courses.length) {
    courseList.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.courses.forEach((course) => {
    const trainer = getTrainerName(course.trainer_id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `course-card${course.id === state.selectedCourseId ? " active" : ""}`;
    card.innerHTML = `
      <h3>${escapeHtml(course.name)}</h3>
      <p class="course-meta">${escapeHtml(course.weekday)}${course.time ? ` - ${escapeHtml(course.time)} Uhr` : ""}</p>
      <p class="course-meta">${course.location ? escapeHtml(course.location) : "Ort noch nicht eingetragen"}</p>
      <p class="course-meta">Trainer: ${escapeHtml(trainer)}</p>
    `;
    card.addEventListener("click", () => {
      state.selectedCourseId = course.id;
      render();
    });
    courseList.appendChild(card);
  });
}

function renderParticipants() {
  const course = getSelectedCourse();
  participantTableBody.innerHTML = "";
  participantCards.innerHTML = "";

  if (!course) {
    participantSectionTitle.textContent = "Bitte zuerst einen Kurs auswaehlen";
    courseActions.classList.add("hidden");
    return;
  }

  participantSectionTitle.textContent = `${course.name} verwalten`;
  courseActions.classList.remove("hidden");
  participantForm.classList.toggle("hidden", !canEditCourse(course));
  markAllPresentBtn.disabled = !canEditCourse(course);
  markAllAbsentBtn.disabled = !canEditCourse(course);

  const participants = getFilteredParticipants(course.id);
  if (!participants.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4"><div class="empty-state"><p>Keine Teilnehmer fuer die aktuelle Suche gefunden.</p></div></td>`;
    participantTableBody.appendChild(row);
    participantCards.appendChild(emptyStateTemplate.content.cloneNode(true));
    return;
  }

  const session = getSessionForCourseAndDate(course.id, attendanceDate.value);
  const records = getRecordsForSession(session?.id);

  participants.forEach((participant) => {
    const record = records.find((entry) => entry.participant_id === participant.id);
    const isPresent = Boolean(record?.present);
    const rate = calculateAttendanceRate(course.id, participant.id);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(participant.full_name)}</td>
      <td>${participant.phone ? escapeHtml(participant.phone) : '<span class="muted">-</span>'}</td>
      <td><button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button></td>
      <td><span class="badge">${rate}%</span></td>
    `;

    const toggleButton = row.querySelector(".attendance-toggle");
    toggleButton.disabled = !canEditCourse(course);
    toggleButton.addEventListener("click", async () => {
      await toggleAttendance(course.id, participant.id);
    });
    participantTableBody.appendChild(row);

    const card = document.createElement("article");
    card.className = "participant-card";
    card.innerHTML = `
      <div class="participant-card-head">
        <div>
          <h3>${escapeHtml(participant.full_name)}</h3>
          <p class="stat-meta">${participant.phone ? escapeHtml(participant.phone) : "Keine Telefonnummer"}</p>
        </div>
        <span class="badge">${rate}%</span>
      </div>
      <div class="participant-card-actions">
        <button type="button" class="attendance-toggle${isPresent ? " is-present" : ""}" aria-label="Anwesenheit umschalten"></button>
      </div>
    `;

    const mobileToggle = card.querySelector(".attendance-toggle");
    mobileToggle.disabled = !canEditCourse(course);
    mobileToggle.addEventListener("click", async () => {
      await toggleAttendance(course.id, participant.id);
    });
    participantCards.appendChild(card);
  });
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
      <p class="stat-meta">Trainer: ${escapeHtml(getTrainerName(course.trainer_id))}</p>
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
  const activeTrainerIds = new Set(state.courses.map((course) => course.trainer_id).filter(Boolean));
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

  let sessionId;
  try {
    sessionId = await ensureSession(courseId, attendanceDate.value);
  } catch (error) {
    notify(error.message, true);
    return;
  }
  const currentRecord = getRecordsForSession(sessionId).find((entry) => entry.participant_id === participantId);

  const { error } = await state.supabase
    .from("attendance_records")
    .upsert({
      session_id: sessionId,
      participant_id: participantId,
      present: !currentRecord?.present,
    }, {
      onConflict: "session_id,participant_id",
    });

  if (error) {
    notify(error.message, true);
    return;
  }

  await fetchSupportData();
  render();
}

async function setAttendanceForAll(value) {
  const course = getSelectedCourse();
  if (!course || !canEditCourse(course)) {
    return;
  }

  let sessionId;
  try {
    sessionId = await ensureSession(course.id, attendanceDate.value);
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

  await fetchSupportData();
  render();
}

async function ensureSession(courseId, sessionDate) {
  const existing = getSessionForCourseAndDate(courseId, sessionDate);
  if (existing) {
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
      return record?.present ? "Anwesend" : "Abwesend";
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
      rows.push([
        getSelectedMonthLabel(),
        course?.name || "-",
        getTrainerName(course?.trainer_id),
        session.session_date,
        participant.full_name,
        record?.present ? "Ja" : "Nein",
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

  state.trainers.forEach((trainer) => {
    const trainerCourses = state.courses.filter((course) => course.trainer_id === trainer.user_id);
    const trainerSessions = trainerCourses.flatMap((course) => getSessionsForCourse(course.id));
    const trainerParticipants = trainerCourses.flatMap((course) => getParticipantsForCourse(course.id));
    const trainerRecords = state.records.filter((record) => trainerSessions.some((session) => session.id === record.session_id));
    const average = trainerParticipants.length && trainerSessions.length
      ? Math.round((trainerRecords.filter((record) => record.present).length / (trainerParticipants.length * trainerSessions.length)) * 100)
      : 0;

    rows.push([
      trainer.full_name,
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

function getSelectedCourse() {
  return state.courses.find((course) => course.id === state.selectedCourseId) || null;
}

function getParticipantsForCourse(courseId) {
  return state.participants.filter((participant) => participant.course_id === courseId);
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

function getTrainerName(trainerId) {
  return state.trainers.find((trainer) => trainer.user_id === trainerId)?.full_name || "Nicht zugewiesen";
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
  const ranked = state.trainers
    .map((trainer) => {
      const trainerCourses = state.courses.filter((course) => course.trainer_id === trainer.user_id);
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
        name: trainer.full_name,
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

function isAdmin() {
  return state.profile?.role === "admin";
}

function canEditCourse(course) {
  return Boolean(state.session && state.profile && (isAdmin() || course.trainer_id === state.session.user.id));
}

function resetProtectedState() {
  state.profile = null;
  state.courses = [];
  state.trainers = [];
  state.invites = [];
  state.participants = [];
  state.sessions = [];
  state.records = [];
  state.selectedCourseId = null;
  state.participantSearch = "";
}

function toggleMobileNav() {
  const isOpen = appNav.classList.toggle("is-open");
  navToggleBtn.setAttribute("aria-expanded", String(isOpen));
}

function closeMobileNav() {
  appNav.classList.remove("is-open");
  navToggleBtn.setAttribute("aria-expanded", "false");
}

function scrollToSection(selector) {
  const element = document.querySelector(selector);
  if (!element || element.classList.contains("hidden")) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });
  closeMobileNav();
}

function updateActiveNavLink() {
  const candidates = navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target || target.classList.contains("hidden")) {
        return null;
      }

      const rect = target.getBoundingClientRect();
      const offset = Math.abs(rect.top - 140);
      return { link, offset };
    })
    .filter(Boolean)
    .sort((left, right) => left.offset - right.offset);

  const activeLink = candidates[0]?.link || null;
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link === activeLink);
  });
}

function notify(message, isError = false) {
  statusHeadline.textContent = isError ? "Aktion fehlgeschlagen" : "Status aktualisiert";
  statusText.textContent = message;
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
