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

## Wichtige Hinweise

- Diese Version ist bewusst buildless gehalten, damit ihr ohne Node-Setup starten koennt
- `app.js` nutzt das Supabase JavaScript SDK als ESM-Import im Browser
- Fuer einen noch haerteren Produktivbetrieb waeren als naechster Schritt sinnvoll:
  - separates Frontend-Framework
  - serverseitige Invite-Flows
  - Audit-Logging
  - Soft-Delete und Abrechnungsreports
