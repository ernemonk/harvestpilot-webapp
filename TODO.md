# TODO — harvestpilot-webapp

## Bugs

- [ ] **Legacy pages still routed** — `/dashboard`, `/customers`, `/fields` pages are routed but may be superseded by FarmDashboard. Evaluate and remove if unused.
- [ ] `loadTestData.ts` is imported by Crops and CropResearch pages — evaluate if this is dev-only test data or production seed data.
- [ ] `strict: false` in tsconfig — enable strict mode incrementally.

## Technical Debt

- [ ] **Path aliases unused** — `@/app/*`, `@/features/*`, `@/shared/*`, `@/core/*` are defined in tsconfig but the directories they pointed to have been deleted. Remove aliases from tsconfig.
- [ ] **No error boundaries** — add React error boundaries around route pages.
- [ ] **No loading skeleton states** — most pages show a spinner but could use skeletons.
- [ ] **zustand installed but unused** — no store files exist; remove from deps or implement proper state management.
- [ ] **axios installed but unused** — all Firestore calls use the Firebase SDK directly. Remove if not needed.

## Features

- [ ] **PWM control UI** — `_process_command` supports `pwm_control` commands but no UI exists for duty cycle adjustment.
- [ ] **Alert acknowledgment flow** — `useAlerts` has `acknowledgeAlert()` but the Alerts page may not fully wire it.
- [ ] **Harvest cycle tracking** — HarvestCycleSection UI exists but actual harvest belt control integration is incomplete.
- [ ] **Camera live preview** — CameraSection UI exists but no Pi camera streaming is implemented.
- [ ] **User invitation flow** — AcceptInvite page exists, `organizationService.inviteMember()` works, but email sending is not implemented.
- [ ] **Multi-device support** — FarmDashboard lists modules but the device selection UX needs polish.
- [ ] **Offline indicator** — show clear warning when Pi heartbeat is stale (>60s).
- [ ] **Schedule conflict detection** — no check for overlapping schedules on the same pin.
