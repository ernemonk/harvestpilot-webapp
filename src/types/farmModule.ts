import type { Timestamp } from 'firebase/firestore';

// ============================================
// FARM MODULE TYPES
// ============================================

export interface FarmModule {
  id: string; // e.g., "module-rack-a"
  deviceId: string; // e.g., "raspserver-001"
  deviceName?: string; // Device display name
  name: string; // e.g., "Greenhouse Rack A"
  location?: string; // e.g., "Greenhouse - North Wall"
  organizationId: string;
  status: 'online' | 'offline' | 'error';
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  hardwareSerial?: string;
  platform?: string;
  os?: string;
  firmwareVersion?: string;
  lastHeartbeat: Timestamp;
  lastSyncAt?: Timestamp;
  initializedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// DEVICE (SENSOR/ACTUATOR) TYPES
// ============================================

export type DeviceType = 'sensor' | 'actuator' | 'camera';
export type SensorType = 'temperature' | 'humidity' | 'soil_moisture' | 'water_level' | 'ec' | 'ph' | 'light';
export type ActuatorType = 'pump' | 'light' | 'fan' | 'valve' | 'motor';

export interface ModuleDevice {
  id: string;
  moduleId: string; // Reference to FarmModule
  name: string; // e.g., "Primary Pump", "DHT22 Sensor"
  type: DeviceType;
  subtype: SensorType | ActuatorType | 'camera';
  gpioPin?: number; // For Raspberry Pi GPIO
  enabled: boolean;
  calibration?: {
    offset?: number;
    multiplier?: number;
    notes?: string;
  };
  lastReading?: number | boolean; // Sensor value or actuator state
  lastReadingAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, any>;
}

// ============================================
// READING (TIME-SERIES DATA)
// ============================================

export interface Reading {
  id: string;
  moduleId: string;
  deviceId: string; // Which sensor/actuator
  sensorType?: SensorType; // Temperature, humidity, soil moisture, etc.
  timestamp: Timestamp;
  value: number | boolean;
  unit?: string; // °F, %, etc.
}

// ============================================
// AUTOMATION RULE
// ============================================

export type RuleConditionOperator = 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
export type RuleActionType = 'turn_on' | 'turn_off' | 'set_value' | 'send_alert';

export interface AutomationRule {
  id: string;
  moduleId: string;
  name: string; // e.g., "Mist when humidity low"
  enabled: boolean;
  condition: {
    deviceId: string; // Which sensor to monitor
    operator: RuleConditionOperator;
    value: number;
  };
  action: {
    type: RuleActionType;
    targetDeviceId: string; // Which actuator to control
    value?: any; // Duration, PWM value, etc.
  };
  cooldownSeconds?: number; // Prevent rapid triggering
  lastTriggeredAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// SCHEDULE
// ============================================

export interface Schedule {
  id: string;
  moduleId: string;
  name: string; // e.g., "Daily Lights"
  deviceId: string; // Which actuator
  enabled: boolean;
  scheduleType: 'time_based' | 'interval';
  // Time-based
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  daysOfWeek?: number[]; // 0=Sun, 6=Sat
  // Interval-based
  intervalMinutes?: number;
  durationSeconds?: number;
  value?: any; // PWM duty, etc.
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// HARVEST CYCLE
// ============================================

export type HarvestStage = 'seeding' | 'germination' | 'blackout' | 'light_exposure' | 'growth' | 'harvest' | 'completed';

export interface HarvestCycle {
  id: string;
  moduleId: string;
  cropType: string; // e.g., "Broccoli Microgreens"
  variety?: string;
  startDate: Timestamp;
  currentStage: HarvestStage;
  status?: 'pending' | 'active' | 'completed' | 'failed';
  expectedDays?: number;
  stageHistory: {
    stage: HarvestStage;
    startedAt: Timestamp;
    completedAt?: Timestamp;
    notes?: string;
  }[];
  expectedHarvestDate: Timestamp;
  harvestDate?: Timestamp;
  actualHarvestDate?: Timestamp;
  yieldWeight?: number; // in oz or grams
  yieldUnit?: 'oz' | 'g' | 'lbs' | 'kg';
  quality?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// CAMERA CONFIG
// ============================================

export interface CameraConfig {
  id: string;
  moduleId: string;
  name: string;
  enabled: boolean;
  streamUrl?: string; // RTSP or HTTP stream
  snapshotUrl?: string; // HTTP endpoint for still image
  resolution?: string; // e.g., "1920x1080"
  fps?: number;
  frameRate?: number;
  lastSnapshotAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// GROWTH ANALYTICS
// ============================================

export interface GrowthMetrics {
  moduleId: string;
  cycleId: string;
  date: string; // YYYY-MM-DD
  avgTemperature: number;
  minTemperature?: number;
  maxTemperature?: number;
  avgHumidity: number;
  avgSoilMoisture?: number;
  lightHours: number;
  wateringEvents: number;
  totalWaterMl?: number;
  notes?: string;
}
