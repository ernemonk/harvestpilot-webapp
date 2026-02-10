# VISION — harvestpilot-webapp

## What This Is

The HarvestPilot webapp is a React dashboard for monitoring and controlling indoor/vertical farming hardware. A farmer opens the app, sees their Raspberry Pi modules, and can toggle pumps, lights, and motors in real-time — as easily as flipping a light switch.

## Core Principles

1. **Real-time or nothing.** Every piece of data the user sees is a live Firestore listener. No refresh buttons. No stale state.
2. **Hardware truth.** The toggle shows what the GPIO pin actually reads, not what the user requested. If there's a mismatch, the user sees it.
3. **Multi-tenant from day one.** Organizations, roles, team invites — so a farm owner can give a worker view-only access.
4. **Modular by GPIO.** Each pin is an independent device with its own name, type, schedules, and state. No hardcoded pin assignments.

## Target User

Small-to-medium indoor/vertical farm operators who want:
- Remote monitoring and control from any browser
- Scheduled automation (pump cycles, lighting windows)
- Team access management
- Eventually: crop tracking, harvest records, customer orders

## Where It's Going

- **Camera integration** — live preview from Pi camera module
- **Analytics dashboards** — temperature/humidity trends from hourly data
- **Mobile-first redesign** — currently desktop-oriented
- **Multi-device fleet view** — manage 10+ Pi modules from one dashboard
- **Crop lifecycle tracking** — seed-to-harvest workflow tied to hardware automation
