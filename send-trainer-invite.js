module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.INVITE_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return res.status(503).json({
      error: "Email sending is not configured. Please set RESEND_API_KEY and INVITE_FROM_EMAIL.",
    });
  }

  const { email, inviteCode, inviteLink, trainerName } = req.body || {};
  const recipient = String(email || "").trim().toLowerCase();
  const code = String(inviteCode || "").trim();
  const link = String(inviteLink || "").trim();
  const safeTrainerName = String(trainerName || "").trim();

  if (!recipient || !code || !link) {
    return res.status(400).json({ error: "email, inviteCode and inviteLink are required." });
  }

  const greeting = safeTrainerName ? `Hallo ${safeTrainerName},` : "Hallo,";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111;">
      <p>${greeting}</p>
      <p>dein Trainerzugang fuer BEATFIELD wurde vorbereitet.</p>
      <p>
        Nutze bitte diesen Einladungslink, um deinen Zugang abzuschliessen:<br>
        <a href="${link}">${link}</a>
      </p>
      <p>Falls du den Code lieber manuell eingeben moechtest: <strong>${code}</strong></p>
      <p>Bis gleich bei BEATFIELD.</p>
    </div>
  `;

  const text = [
    greeting,
    "",
    "dein Trainerzugang fuer BEATFIELD wurde vorbereitet.",
    "",
    `Einladungslink: ${link}`,
    `Einladungscode: ${code}`,
    "",
    "Bis gleich bei BEATFIELD.",
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject: "Dein BEATFIELD Trainerzugang",
      html,
      text,
    }),
  });

  const payload = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    return res.status(resendResponse.status).json({
      error: payload?.message || payload?.error || "Email could not be sent.",
    });
  }

  return res.status(200).json({ ok: true, id: payload?.id || null });
};
