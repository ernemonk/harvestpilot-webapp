# 🔄 HarvestPilot Webapp Reorganization Guide

## Overview
This document outlines the reorganization of the harvestpilot-webapp codebase to improve modularity, maintainability, and code understanding.

## New Structure

```
src/
├── app/                        # Application setup & routing
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # Entry point
│   └── routes.tsx              # Route definitions
│
├── features/                   # Feature-based modules (domain-driven)
│   ├── auth/                   # Authentication & Authorization
│   │   ├── components/         # Auth-specific components
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── index.ts        # Barrel export
│   │   ├── pages/              # Auth pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── AcceptInvitePage.tsx
│   │   │   └── index.ts
│   │   ├── hooks/              # Auth-specific hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── index.ts
│   │   ├── types.ts            # Auth types
│   │   └── index.ts            # Feature barrel export
│   │
│   ├── farm/                   # Farm management & devices
│   │   ├── components/
│   │   │   ├── dashboard/      # Dashboard-specific components
│   │   │   │   ├── ControlPanel.tsx
│   │   │   │   ├── HealthCard.tsx
│   │   │   │   ├── ScheduleCard.tsx
│   │   │   │   ├── SensorGauges.tsx
│   │   │   │   └── index.ts
│   │   │   ├── module/         # Farm module components
│   │   │   │   ├── ModuleOverview.tsx
│   │   │   │   ├── DevicesSection.tsx
│   │   │   │   ├── CameraSection.tsx
│   │   │   │   ├── AutomationsSection.tsx
│   │   │   │   ├── HarvestCycleSection.tsx
│   │   │   │   ├── GrowthAnalytics.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── FarmDashboardPage.tsx
│   │   │   ├── FarmModulePage.tsx
│   │   │   ├── DevicePage.tsx
│   │   │   ├── DeviceSetupPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useFarmModule.ts
│   │   │   ├── useDeviceState.ts
│   │   │   ├── useCommands.ts
│   │   │   ├── useHourlyHistory.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── crops/                  # Crop management
│   │   ├── components/
│   │   │   ├── CropTable.tsx
│   │   │   ├── AddCropForm.tsx
│   │   │   ├── CropCard.tsx
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── CropsPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── cropService.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── harvests/               # Harvest tracking
│   │   ├── components/
│   │   │   ├── HarvestTable.tsx
│   │   │   ├── AddHarvestForm.tsx
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── HarvestsPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── harvestService.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── fields/                 # Field management
│   │   ├── components/
│   │   │   ├── FieldGrid.tsx
│   │   │   ├── FieldCard.tsx
│   │   │   ├── AddFieldForm.tsx
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── FieldsPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── fieldService.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── alerts/                 # Alert management
│   │   ├── components/
│   │   │   ├── AlertList.tsx
│   │   │   ├── AlertCard.tsx
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── AlertsPage.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAlerts.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── customers/              # Customer management
│   │   ├── components/
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── AddCustomerForm.tsx
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── CustomersPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── customerService.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── team/                   # Team management
│   │   ├── pages/
│   │   │   ├── TeamPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── organizationService.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── research/               # Crop research
│       ├── components/
│       │   ├── ResearchTable.tsx
│       │   ├── ResearchFilters.tsx
│       │   └── index.ts
│       ├── pages/
│       │   ├── CropResearchPage.tsx
│       │   ├── CropResearchDetailPage.tsx
│       │   └── index.ts
│       ├── services/
│       │   ├── cropResearchService.ts
│       │   └── index.ts
│       ├── types.ts
│       └── index.ts
│
├── shared/                     # Shared code across features
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── NoOrganization.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useFirestore.ts     # Generic Firestore hook
│   │   └── index.ts
│   ├── utils/
│   │   ├── loadTestData.ts
│   │   ├── migrate.ts
│   │   ├── date.ts             # Date utilities
│   │   ├── format.ts           # Formatting utilities
│   │   └── index.ts
│   ├── types/
│   │   ├── index.ts            # Shared types
│   │   └── global.d.ts
│   └── constants/
│       ├── config.ts
│       └── index.ts
│
├── core/                       # Core infrastructure
│   ├── config/
│   │   ├── firebase.ts         # Firebase config
│   │   ├── constants.ts        # App constants
│   │   └── index.ts
│   ├── services/
│   │   ├── userService.ts      # User service
│   │   └── index.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Auth context
│   │   └── index.ts
│   └── api/                    # API layer (if needed)
│       └── client.ts
│
└── assets/                     # Static assets
    ├── images/
    └── icons/

```

## Migration Steps

### Phase 1: Create New Structure ✅
- [x] Create all new directories
- [x] Create index.ts barrel exports

### Phase 2: Move Core Infrastructure
1. Move `config/firebase.ts` → `core/config/firebase.ts`
2. Move `contexts/AuthContext.tsx` → `core/contexts/AuthContext.tsx`
3. Move `services/userService.ts` → `core/services/userService.ts`

### Phase 3: Move Shared Code
1. Move all `components/ui/*` → `shared/components/ui/`
2. Move `hooks/useFirestore.ts` → `shared/hooks/useFirestore.ts`
3. Move `utils/*` → `shared/utils/`
4. Move `types/index.ts` → `shared/types/index.ts`

### Phase 4: Move Feature Code
1. **Auth Feature:**
   - Move `components/auth/*` → `features/auth/components/`
   - Move `pages/Login.tsx` → `features/auth/pages/LoginPage.tsx`
   - Move `pages/SignUp.tsx` → `features/auth/pages/SignUpPage.tsx`
   - Move `pages/ForgotPassword.tsx` → `features/auth/pages/ForgotPasswordPage.tsx`
   - Move `pages/AcceptInvite.tsx` → `features/auth/pages/AcceptInvitePage.tsx`
   - Move `hooks/usePermissions.ts` → `features/auth/hooks/usePermissions.ts`

2. **Farm Feature:**
   - Move `components/dashboard/*` → `features/farm/components/dashboard/`
   - Move `components/farmModule/*` → `features/farm/components/module/`
   - Move `pages/FarmDashboard.tsx` → `features/farm/pages/FarmDashboardPage.tsx`
   - Move `pages/FarmModule.tsx` → `features/farm/pages/FarmModulePage.tsx`
   - Move `pages/Device.tsx` → `features/farm/pages/DevicePage.tsx`
   - Move `pages/DeviceSetup.tsx` → `features/farm/pages/DeviceSetupPage.tsx`
   - Move `pages/Settings.tsx` → `features/farm/pages/SettingsPage.tsx`
   - Move `hooks/useFarmModule.ts` → `features/farm/hooks/useFarmModule.ts`
   - Move `hooks/useDeviceState.ts` → `features/farm/hooks/useDeviceState.ts`
   - Move `hooks/useCommands.ts` → `features/farm/hooks/useCommands.ts`
   - Move `hooks/useHourlyHistory.ts` → `features/farm/hooks/useHourlyHistory.ts`

3. **Crops Feature:**
   - Move `components/crops/*` → `features/crops/components/`
   - Move `pages/Crops.tsx` → `features/crops/pages/CropsPage.tsx`
   - Move `services/cropService.ts` → `features/crops/services/cropService.ts`

4. **Harvests Feature:**
   - Move `components/harvests/*` → `features/harvests/components/`
   - Move `pages/Harvests.tsx` → `features/harvests/pages/HarvestsPage.tsx`
   - Move `services/harvestService.ts` → `features/harvests/services/harvestService.ts`

5. **Fields Feature:**
   - Move `components/fields/*` → `features/fields/components/`
   - Move `pages/Fields.tsx` → `features/fields/pages/FieldsPage.tsx`
   - Move `services/fieldService.ts` → `features/fields/services/fieldService.ts`

6. **Alerts Feature:**
   - Move `components/alerts/*` → `features/alerts/components/`
   - Move `pages/Alerts.tsx` → `features/alerts/pages/AlertsPage.tsx`
   - Move `hooks/useAlerts.ts` → `features/alerts/hooks/useAlerts.ts`

7. **Customers Feature:**
   - Move `components/customers/*` → `features/customers/components/`
   - Move `pages/Customers.tsx` → `features/customers/pages/CustomersPage.tsx`
   - Move `services/customerService.ts` → `features/customers/services/customerService.ts`

8. **Team Feature:**
   - Move `pages/Team.tsx` → `features/team/pages/TeamPage.tsx`
   - Move `services/organizationService.ts` → `features/team/services/organizationService.ts`

9. **Research Feature:**
   - Move `components/cropResearch/*` → `features/research/components/`
   - Move `pages/CropResearch.tsx` → `features/research/pages/CropResearchPage.tsx`
   - Move `pages/CropResearchDetail.tsx` → `features/research/pages/CropResearchDetailPage.tsx`
   - Move `services/cropResearchService.ts` → `features/research/services/cropResearchService.ts`

### Phase 5: Update Imports
- Update all import paths to use new structure
- Use barrel exports for cleaner imports

### Phase 6: Move App Files
- Move `App.tsx` → `app/App.tsx`
- Move `main.tsx` → `app/main.tsx`
- Update imports in `index.html`

## Benefits

### 1. **Feature-Based Organization**
- Related code is grouped together by domain
- Easy to find and understand feature boundaries
- Supports team scalability (teams can own features)

### 2. **Better Modularity**
- Each feature is self-contained
- Clear dependencies between features
- Easier to test features in isolation

### 3. **Improved Developer Experience**
- Shorter import paths with barrel exports
- Clear separation of concerns
- Easier onboarding for new developers

### 4. **Maintainability**
- Changes to a feature are localized
- Less cross-contamination between features
- Easier to refactor or remove features

### 5. **Scalability**
- Easy to add new features
- Can split features into separate packages later
- Supports micro-frontend architecture

## Import Examples

### Before:
```typescript
import { useAuth } from '../../../contexts/AuthContext'
import { cropService } from '../../../services/cropService'
import Card from '../../../components/ui/Card'
import ErrorMessage from '../../../components/ui/ErrorMessage'
```

### After:
```typescript
import { useAuth } from '@/core/contexts'
import { cropService } from '@/features/crops'
import { Card, ErrorMessage } from '@/shared/components/ui'
```

## Path Aliases (tsconfig.json)

Add these to `tsconfig.json` for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/app/*": ["src/app/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/core/*": ["src/core/*"],
      "@/assets/*": ["src/assets/*"]
    }
  }
}
```

## Notes

- This reorganization follows industry best practices
- Inspired by feature-sliced design and domain-driven design
- Maintains React Router structure
- Compatible with Vite build system
- Supports code splitting and lazy loading

## Testing Strategy

After reorganization:
1. ✅ Verify all imports resolve correctly
2. ✅ Run build: `npm run build`
3. ✅ Test in dev mode: `npm run dev`
4. ✅ Check for TypeScript errors
5. ✅ Verify all routes work correctly
6. ✅ Test feature functionality

---

**Status:** Ready for implementation
**Last Updated:** 2026-01-25
