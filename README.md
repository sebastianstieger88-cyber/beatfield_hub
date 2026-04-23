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
- eigener Bereich `Übungen` mit Notion-Synchronisation

## Dateien

- `index.html`: UI
- `app.js`: Frontend-Logik und Supabase-Anbindung
- `config.js`: Projektkonfiguration
- `supabase-schema.sql`: Tabellen, Trigger und RLS-Policies
- `supabase-update-latest.sql`: sichere Nachzuege fuer bestehende Projekte
- `vercel.json`: einfaches Vercel-Setup
- `api/sync-exercises.js`: geschützter Notion -> Supabase Sync für die Übungsbibliothek

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
- aktuelle Trainer-/RLS-Fixes wie `current_user_role()` und Teilnehmerrechte fuer Trainer

`supabase-schema.sql` bleibt die Datei fuer Neuaufsetzungen.

Wenn nach einem Update ploetzlich Login, Traineransicht oder Teilnehmerrechte auffaellig werden, zuerst `supabase-update-latest.sql` erneut im SQL Editor ausfuehren, bevor einzelne Policy-Bloecke manuell nachgezogen werden.

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

## Notion-Übungsdatenbank synchronisieren

Die App kann eine Notion-Datenbank voll in den eigenen Bereich `Übungen` spiegeln.

Der Ablauf ist bewusst einseitig:
- Notion bleibt der Pflegeort
- die App bleibt der Arbeitsort für Trainer und Admins

### 1. In Supabase

Für bestehende Projekte `supabase-update-latest.sql` ausführen.

### 2. In Notion

1. Eine Notion-Integration anlegen
2. Die Übungsdatenbank mit dieser Integration teilen
3. Die Datenbank-ID kopieren

### 3. In Vercel Environment Variables

Pflicht:
- `NOTION_TOKEN`
- `NOTION_EXERCISE_DATABASE_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional für exakte Feldzuordnung:
- `NOTION_EXERCISE_TITLE_FIELD`
- `NOTION_EXERCISE_CATEGORY_FIELD`
- `NOTION_EXERCISE_FOCUS_FIELD`
- `NOTION_EXERCISE_LEVEL_FIELD`
- `NOTION_EXERCISE_EQUIPMENT_FIELD`
- `NOTION_EXERCISE_COACHING_FIELD`
- `NOTION_EXERCISE_DESCRIPTION_FIELD`
- `NOTION_EXERCISE_VIDEO_FIELD`
- `NOTION_EXERCISE_SOURCE_FIELD`
- `NOTION_EXERCISE_TAGS_FIELD`

Wenn die Feldnamen in Notion klar benannt sind, reichen oft schon die eingebauten Standardnamen wie:
- `Übung`
- `Kategorie`
- `Fokus`
- `Level`
- `Equipment`
- `Coaching`
- `Beschreibung`
- `Video`
- `Link`
- `Tags`

### 4. In der App

- Admin öffnet den Bereich `Übungen`
- klickt `Jetzt mit Notion synchronisieren`
- danach können Trainer und Admins die Bibliothek durchsuchen und filtern

## Trainer-Einladungen vorbereiten

Trainer koennen beim manuellen Anlegen mit E-Mail-Adresse direkt einen Einladungscode und Einladungslink bekommen.

Im Admin-Bereich gibt es dafuer auf der Trainerkarte:
- `Zugang neu erzeugen`
- `E-Mail vorbereiten`

`E-Mail vorbereiten` oeffnet eure normale Mail-App bereits mit:
- Empfaenger
- Betreff
- Einladungstext
- Einladungslink

Das ist die aktuell empfohlene Loesung, wenn eure Domain/DNS-Mailstruktur nicht fuer einen automatischen Versand aus der App eingerichtet werden soll.

## Wichtige Hinweise

- Diese Version ist bewusst buildless gehalten, damit ihr ohne Node-Setup starten koennt
- `app.js` nutzt das Supabase JavaScript SDK als ESM-Import im Browser
- Fuer einen noch haerteren Produktivbetrieb waeren als naechster Schritt sinnvoll:
  - separates Frontend-Framework
  - serverseitige Invite-Flows
  - Audit-Logging
  - Soft-Delete und Abrechnungsreports
