# Campus Workout Timer

Integrated route: `#timerPanel`. No separate app, framework, authentication or Supabase project.

## Module API
`window.BEATFIELD_TIMER.loadWorkout(config)` opens a validated workout preview in the existing Campus route. Durations in WorkoutConfig are seconds; engine phase timestamps are milliseconds. Types: INTERVAL, TABATA, EMOM, AMRAP, FOR_TIME, CUSTOM. Custom blocks additionally support TIMER, REST, CUSTOM_BLOCK. FOR_TIME with `timeCap: 0` requires coach completion before the next block.

The engine uses absolute Date timestamps and catches up elapsed phases. It never decrements a stored second counter. Old cues are suppressed after suspension; a boundary event is dispatched at most once. Set pauses replace the final round rest between sets. There is no trailing rest after the final work round. EMOM cycles the exercise list.

Personal presets, favorites, settings, history and recovery are scoped by authenticated user ID in localStorage. Central presets use `workout_timer_presets` in the existing project: admin/trainer read, admin-only writes. See workout-timer-presets.sql for the applied schema and seed data.

## Verification
`npm run test:timer` runs the injected-clock engine regression suite. This static ES-module project has no TypeScript compilation or production build step. Use node syntax checks and browser checks. The historical `npm test` command references tests absent from this checkout; it is left unchanged.

Browser checks: configuration, start, automatic interval completion, summary, Custom block creation, mobile coach display, pause/resume, settings, history and error logs. Database checks: seed count, RLS/grants, admin CRUD and denial of unapproved authenticated access (transactions rolled back).

## Device limits
Short Web Audio tones initialize on the coach's start/test interaction. No Spotify API, media session or continuous audio stream. Spotify/Bluetooth/AirPods and iOS/Android hardware must be tested on the real devices. OS audio focus can vary. Browser suspension may prevent background tones; timestamps and recovery still catch up. Wake Lock is optional and reacquired on return. The existing app currently disables offline asset caching: a loaded workout works without network; reopening the complete app offline is not promised. Timer assets are registered in the existing service-worker asset list for future enablement.
