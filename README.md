# Beatfield Attendance

Produktionsnaehere Web-App fuer Outdoor-Fitnesskurse mit Supabase Auth und Vercel-Deployment.

## Enthalten

- Login mit E-Mail und Passwort ueber Supabase Auth
- Signup mit optionalem Einladungscode
- Passwort-Reset per E-Mail
- Rollen: `admin`, `trainer`, `pending`
- Admin kann Einladungscodes erzeugen und Kurse Trainern zuweisen
- Trainer sieht nur eigene Kurse
- Teilnehmer- und Anwesenheitsverwaltung mit CSV-Export

## Dateien

- `index.html`: UI
- `app.js`: Frontend-Logik und Supabase-Anbindung
- `config.js`: Projektkonfiguration
- `supabase-schema.sql`: Tabellen, Trigger und RLS-Policies
- `supabase-update-latest.sql`: sichere Nachzuege fuer bestehende Projekte
- `vercel.json`: einfaches Vercel-Setup

## Supabase einrichten

1. Neues Supabase-Projekt anlegen
2. In SQL Editor den Inhalt aus `supabase-schema.sql` ausfuehren
3. In Authentication:
   - E-Mail Provider aktivieren
   - `Site URL` auf eure spaetere App-URL setzen
   - diese URL auch bei Redirect URLs hinterlegen
4. In `config.js` eintragen:
   - `supabaseUrl`
   - `supabaseAnonKey`
   - `siteUrl`

## Supabase aktualisieren

Wenn ein bestehendes Projekt neue App-Funktionen bekommt, nicht blind das komplette Schema erneut ausfuehren.

Stattdessen:
1. In Supabase `SQL Editor > New query`
2. den Inhalt aus `supabase-update-latest.sql` ausfuehren

Das ist fuer bestehende Projekte die sicherere Update-Datei fuer:
- Trainerverzeichnis
- manuelle Trainer-Zuweisung
- Seasons und Buchungen
- Teilnehmer-Verknuepfung zu Buchungen
- BEAT-OUTs

`supabase-schema.sql` bleibt die Datei fuer Neuaufsetzungen.

## Rollenlogik

- Der erste registrierte Benutzer wird automatisch `admin`
- Weitere Benutzer werden mit gueltigem Einladungscode `trainer` oder `admin`
- Ohne gueltigen Einladungscode landen spaetere Registrierungen auf `pending`

## Vercel Deployment

1. Diesen Ordner in ein Git-Repository legen
2. Repository bei Vercel importieren
3. Root Directory auf diesen Ordner setzen
4. Nach dem ersten Deploy die Vercel-URL in Supabase als `Site URL` und Redirect URL eintragen
5. Dieselbe URL in `config.js` als `siteUrl` setzen und erneut deployen

## Trainer-Einladungen per E-Mail

Trainer koennen beim manuellen Anlegen jetzt optional nicht nur einen Einladungscode bekommen, sondern auch direkt einen Einladungslink per E-Mail.

Dafuer im Vercel-Projekt diese Umgebungsvariablen setzen:
- `RESEND_API_KEY`
- `INVITE_FROM_EMAIL`

Beispiel fuer `INVITE_FROM_EMAIL`:
- `BEATFIELD <noreply@deine-domain.de>`

Wenn diese Variablen fehlen, wird der Trainerzugang trotzdem vorbereitet und der Link bleibt in der App sichtbar. Nur der automatische E-Mail-Versand faellt dann aus.

## Wichtige Hinweise

- Diese Version ist bewusst buildless gehalten, damit ihr ohne Node-Setup starten koennt
- `app.js` nutzt das Supabase JavaScript SDK als ESM-Import im Browser
- Fuer einen noch haerteren Produktivbetrieb waeren als naechster Schritt sinnvoll:
  - separates Frontend-Framework
  - serverseitige Invite-Flows
  - Audit-Logging
  - Soft-Delete und Abrechnungsreports
