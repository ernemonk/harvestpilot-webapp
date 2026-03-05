# RFC — harvestpilot-webapp

> Technical reference for what is currently built and working.
> Last updated: 2025-02-10

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.0 |
| Router | react-router-dom | 7.11.0 |
| Build | Vite | 7.2.4 |
| Language | TypeScript | ~5.9.3 |
| Backend | Firebase (Auth + Firestore) | 12.7.0 |
| CSS | Tailwind CSS | 4.1.18 |
| State | zustand | 5.0.9 |
| Forms | react-hook-form + zod | 7.69.0 / 4.2.1 |

## Architecture

```
Browser → React SPA → Firebase JS SDK (v9 modular) → Firestore ← Pi
```

- **No backend server.** All data flows through Firestore.
- **Real-time everywhere.** Every data-displaying hook uses `onSnapshot`.
- **Commands** are written to `devices/{serial}/commands/{id}` subcollection.
- **State** is read from `devices/{serial}` document (gpioState map).

## Directory Structure

```
src/
├── App.tsx              # Router + layout + sidebar nav
├── main.tsx             # Entry point
├── config/firebase.ts   # Firebase init (env vars or fallbacks)
├── contexts/AuthContext.tsx  # Auth + multi-tenant org context
├── pages/               # 16 route pages
├── components/          # UI components grouped by domain
│   ├── ui/              # Shared: Card, Modal, Table, LoadingSpinner, etc.
│   ├── farmModule/      # DevicesSection, ModuleOverview, Automations, etc.
│   ├── dashboard/       # ControlPanel, HealthCard, SensorGauges, ScheduleCard
│   ├── alerts/          # AlertBanner, AlertCard, AlertList
│   ├── auth/            # AuthLayout, LoginForm
│   ├── crops/           # CropTable, CropFilters, AddCropForm
│   ├── customers/       # CustomerTable, CustomerFilters, AddCustomerForm
│   ├── fields/          # FieldGrid, FieldCard, SectionList, AddFieldForm
│   ├── harvests/        # HarvestTable, AddHarvestForm
│   └── cropResearch/    # AddCropResearchForm
├── hooks/               # 7 hooks (all real-time Firestore listeners)
├── services/            # 7 Firestore CRUD services
├── types/               # TypeScript interfaces (index.ts + farmModule.ts)
├── utils/               # loadTestData.ts
└── styles/              # CSS
```

## Routes

| Route | Page | Auth | Purpose |
|-------|------|------|---------|
| `/` | FarmDashboard | Private | Module list + status overview |
| `/farm-module/:moduleId` | FarmModule | Private | Device management, GPIO control, schedules |
| `/device` | Device | Private | Single device dashboard (sensors, control, alerts) |
| `/device/setup` | DeviceSetup | Private | 3-step device onboarding wizard |
| `/alerts` | Alerts | Private | Alert list with severity filtering |
| `/crops` | Crops | Private | Crop CRUD with status tracking |
| `/harvests` | Harvests | Private | Harvest records with revenue |
| `/crop-research` | CropResearch | Private | Research database |
| `/crop-research/:id` | CropResearchDetail | Private | Research detail view |
| `/login` | Login | Public | Email/password login |
| `/signup` | SignUp | Public | Registration + org creation |
| `/forgot-password` | ForgotPassword | Public | Password reset |
| `/accept-invite` | AcceptInvite | Public | Team invite acceptance |
| `/dashboard` | Dashboard | Private | Legacy dashboard |
| `/customers` | Customers | Private | Legacy customer management |
| `/fields` | Fields | Private | Legacy field management |

## Hooks (Real-time Data)

| Hook | Firestore Path | Returns |
|------|---------------|---------|
| `useDeviceState(deviceId)` | `devices/{deviceId}` | Sensor readings, autopilot mode, crop config, failsafe |
| `useCommands(deviceId)` | Writes to `devices/{deviceId}/commands` | Command helpers: pump, lights, autopilot, emergency_stop |
| `useFarmModule(moduleId)` | `devices/{moduleId}` | Module metadata (IP, MAC, hostname, firmware, status) |
| `useAlerts(deviceId)` | `devices/{deviceId}/alerts` | Alerts, activeAlerts, criticalAlert, acknowledgeAlert() |
| `useHourlyHistory(deviceId)` | `devices/{deviceId}/hourly` | 24h sensor trends for charts |
| `usePermissions()` | AuthContext | RBAC: canEdit, canManageTeam, canDelete, isOwner |
| `useFirestore<T>(fn)` | Any | Generic async fetch wrapper with loading/error |

## Firestore Schema (from webapp's perspective)

```
devices/{hardware_serial}
├── status: "online" | "offline"
├── lastHeartbeat: Timestamp
├── gpioState: {
│   [bcmPin: number]: {
│     state: boolean          # desired (webapp sets this)
│     hardwareState: boolean  # actual (Pi confirms this)
│     mismatch: boolean
│     type: "sensor" | "actuator"
│     subtype: "pump" | "light" | "motor" | "sensor"
│     name: string
│     enabled: boolean
│     mode: "output" | "input"
│     lastUpdated: Timestamp
│     lastHardwareRead: Timestamp
│     schedules: {
│       [scheduleId]: {
│         name: string
│         durationSeconds: number
│         frequencySeconds: number
│         startTime: "HH:MM"
│         endTime: "HH:MM"
│         enabled: boolean
│         createdAt: Timestamp
│         last_run_at: Timestamp
│       }
│     }
│   }
│ }
├── commands/{id}              # subcollection
│   ├── type: "pin_control" | "pump_on" | ...
│   ├── pin: number
│   ├── action: "on" | "off"
│   ├── issuedAt: Timestamp
│   └── status: "pending"
├── alerts/{id}                # subcollection
│   ├── type: "water_low" | "temp_high" | ...
│   ├── severity: "warning" | "critical"
│   └── triggeredAt: Timestamp
└── hourly/{id}                # subcollection
    ├── hour: Timestamp
    ├── avgTemp, avgHumidity, avgSoilMoisture
    └── pumpOnMinutes, lightOnMinutes
```

## Auth & Multi-tenancy

- Firebase Auth (email/password)
- Organizations stored in `organizations` collection
- Membership stored in `organizations/{orgId}/members/{userId}`
- Roles: `owner`, `admin`, `member`, `viewer`
- Auto-creates default org on first signup
- Org selection persisted in `localStorage`

## GPIO Toggle Flow (Real-time)

```
1. User clicks toggle → optimistic UI update (instant)
2. Webapp writes command to devices/{serial}/commands/{id}
3. Pi on_snapshot fires (~500ms)
4. Pi _process_command → applies to GPIO hardware
5. Pi writes hardwareState back to Firestore (immediate)
6. Webapp onSnapshot fires → confirmedState replaces optimistic
```

Total latency: ~1-2 seconds end-to-end.

## Schedule Flow

```
1. User creates schedule in DevicesSection drawer
2. Webapp writes to gpioState.{pin}.schedules.{id}
3. Pi firestore_schedule_listener picks up change
4. Pi spawns executor thread with ON/OFF cycles
5. Cycles run within startTime–endTime window
6. User can override (turn OFF) → cancels schedule
```
