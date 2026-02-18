# VISION — harvestpilot-webapp

## What This Is

The HarvestPilot webapp is a React dashboard for monitoring and controlling indoor/vertical farming hardware. A farmer opens the app, sees their Raspberry Pi modules, and can toggle pumps, lights, and motors in real-time — as easily as flipping a light switch.

## Core Principles

1. **Real-time or nothing.** Every piece of data the user sees is a live Firestore listener. No refresh buttons. No stale state.
2. **Hardware truth.** The toggle shows what the GPIO pin actually reads, not what the user requested. If there's a mismatch, the user sees it.
3. **Multi-tenant from day one.** Organizations, roles, team invites — so a farm owner can give a worker view-only access.
4. **Modular by GPIO.** Each pin is an independent device with its own name, type, schedules, and state. No hardcoded pin assignments.
5. **User-defined grow programs.** Farmers create their own multi-stage harvest cycles with custom schedules, lighting windows, and environment targets — not just presets.

## Target User

Small-to-medium indoor/vertical farm operators who want:
- Remote monitoring and control from any browser
- Scheduled automation (pump cycles, lighting windows)
- Team access management
- Custom grow cycles for any crop (wheat grass, radish, sunflower, etc.)
- Eventually: crop tracking, harvest records, customer orders

## Where It's Going

- **Camera integration** — live preview from Pi camera module
- **Analytics dashboards** — temperature/humidity trends from hourly data
- **Mobile-first redesign** — currently desktop-oriented
- **Multi-device fleet view** — manage 10+ Pi modules from one dashboard
- **Crop lifecycle tracking** — seed-to-harvest workflow tied to hardware automation

---

## 🌡️ Sensor-Driven Grow Automation — Future Vision

### The Idea

Right now, grow cycles run on **time-based schedules** — pump runs for 30s every 2 hours. That's reliable but dumb. The next evolution is **condition-based automation**: the system watches live sensor readings (humidity, temperature, soil moisture, EC, pH) and actuates hardware in response.

### What This Looks Like for the User

Inside each grow stage, you'll be able to set optional **sensor conditions** that override or supplement the schedule:

```
Stage: Germination
  Pump schedule:  45s ON / 3h interval  (time-based, always runs)
  + Sensor rule:  IF soil_moisture < 40%  → run pump for 20s
  + Sensor rule:  IF humidity < 60%       → run mist for 10s
  + Sensor rule:  IF temperature > 78°F  → turn fan ON for 5 min
```

The stage editor will show all GPIO pins that are configured as **sensors** on the device. You pick the sensor pin, choose an operator (below / above / equals), set the threshold value, pick which actuator to trigger, and for how long.

### Implementation Plan (not yet started)

#### Phase 1 — Sensor reading pipeline
- Pi reads DHT22, DS18B20, or other sensors and writes readings to Firestore `devices/{serial}/gpioState.{pin}.lastReading` every 30–60 seconds
- The webapp already has `GPIOPinState.lastReading` and `GPIOSchedule` types — readings flow in live
- A new `SensorReading` collection captures time-series data: `{ moduleId, pin, value, unit, timestamp }`

#### Phase 2 — Per-stage sensor conditions in GrowStage
- Extend `GrowStage` with an optional `sensorConditions` array:
  ```ts
  interface StageSensorCondition {
    sensorPin: number;           // which GPIO input pin to watch
    sensorSubtype: SensorType;   // 'humidity' | 'temperature' | 'soil_moisture' | ...
    operator: 'lt' | 'gt' | 'lte' | 'gte';
    threshold: number;           // e.g. 60 (for 60% humidity)
    actuatorSubtype: string;     // 'pump' | 'mist' | 'fan'
    durationSeconds: number;     // how long to run the actuator
    cooldownSeconds: number;     // minimum gap between triggers (e.g. 300s)
    label?: string;              // "Trigger mist when RH < 60%"
  }
  ```

#### Phase 3 — Stage editor UI
- The stage editor modal gets a new **"Sensor Conditions"** section
- When editing a stage, available sensor pins are auto-loaded from the device's `gpioState`
- The user picks: sensor → operator → threshold → actuator → duration
- A human-readable summary renders: `IF humidity < 60% → run mist 10s (cooldown 5 min)`

#### Phase 4 — Evaluation engine (Pi-side or cloud function)
Two options for where the logic runs:

**Option A — Pi-side evaluation (preferred for low latency)**
- Pi's `main.py` already has a Firestore `on_snapshot` listener
- Extend it to evaluate `sensorConditions` on each sensor read
- When condition is met and cooldown has elapsed → trigger actuator via GPIO
- Writes a `conditionTriggerLog` entry back to Firestore for audit trail

**Option B — Cloud Function (backup for multi-Pi fleets)**
- A scheduled Cloud Function (every 2 min) reads latest sensor values
- Evaluates conditions per active grow cycle stage
- Writes schedule overrides to `gpioState.{pin}.state` in Firestore
- Pi picks up the state change via its existing snapshot listener

#### Phase 5 — Alerting
- If a sensor condition keeps triggering (e.g. humidity never recovers), fire an alert to the user
- Alert threshold: "condition triggered more than X times in Y minutes"
- Alerts surface in the Alerts tab and optionally via push notification

### Design Principles for Sensor Automation

1. **Non-destructive.** Sensor triggers don't replace time-based schedules — they add to them. Scheduled watering still runs.
2. **Cooldown always.** Every condition has a minimum cooldown to prevent rapid on/off cycling that can damage pumps.
3. **User picks the pins.** No hardcoded sensor assumptions. If the pin is configured as a sensor on the device, it appears as an option.
4. **Visible feedback.** The UI shows last sensor reading inline next to each condition, so the farmer can see: "Humidity is 58% — this rule is active."
5. **Safe defaults.** If a sensor goes offline (no reading for > 5 min), its conditions are suspended — don't pump blind.

### Ideas to Explore Later
- **Multi-sensor logic:** `IF temp > 75 AND humidity < 50 → run fan`
- **Trend-based triggers:** `IF humidity drops more than 10% in 30 min → alert`
- **Camera vision:** Detect mold or uneven growth via Pi camera + simple ML model
- **Yield prediction:** Correlate sensor logs with harvest weights over time to suggest optimal conditions
