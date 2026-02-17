import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { GrowProgram, GrowCycle, GrowStage, GrowStageType } from '../types/farmModule';
import { GROW_PROGRAM_PRESETS } from './growProgramPresets';

// Re-export presets for use by other modules
export { GROW_PROGRAM_PRESETS };

const PROGRAMS_COLLECTION = 'grow_programs';
const CYCLES_COLLECTION = 'grow_cycles';

// =============================================================================
// GROW PROGRAM SERVICE — Templates library
// =============================================================================

export const growProgramService = {
  /** Get all presets + user-created programs for an org */
  async getPrograms(organizationId: string): Promise<GrowProgram[]> {
    const presets = Object.entries(GROW_PROGRAM_PRESETS).map(([key, preset]) => ({
      ...preset,
      id: key,
    })) as GrowProgram[];

    try {
      const q = query(
        collection(db, PROGRAMS_COLLECTION),
        where('organizationId', '==', organizationId),
      );
      const snapshot = await getDocs(q);
      const custom = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GrowProgram[];

      return [...presets, ...custom];
    } catch {
      return presets;
    }
  },

  /** Save a custom program */
  async createProgram(program: Omit<GrowProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, PROGRAMS_COLLECTION), {
      ...program,
      isPreset: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  /** Update a custom program */
  async updateProgram(id: string, data: Partial<GrowProgram>): Promise<void> {
    await updateDoc(doc(db, PROGRAMS_COLLECTION, id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /** Delete a custom program */
  async deleteProgram(id: string): Promise<void> {
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, id));
  },
};

// =============================================================================
// GROW CYCLE SERVICE — Active cycle management
// =============================================================================

export const growCycleService = {
  /** Get all cycles for a module */
  async getModuleCycles(moduleId: string): Promise<GrowCycle[]> {
    try {
      const q = query(
        collection(db, CYCLES_COLLECTION),
        where('moduleId', '==', moduleId),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GrowCycle[];
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        const q = query(
          collection(db, CYCLES_COLLECTION),
          where('moduleId', '==', moduleId),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as GrowCycle[];
      }
      throw error;
    }
  },

  /** Get the active cycle for a module (only one allowed) */
  async getActiveCycle(moduleId: string): Promise<GrowCycle | null> {
    const q = query(
      collection(db, CYCLES_COLLECTION),
      where('moduleId', '==', moduleId),
      where('status', '==', 'active'),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GrowCycle;
  },

  /** Start a new grow cycle */
  async startCycle(
    program: GrowProgram,
    moduleId: string,
    organizationId: string,
    pinBindings: Record<string, number>,
  ): Promise<string> {
    // Check no active cycle exists
    const existing = await this.getActiveCycle(moduleId);
    if (existing) {
      throw new Error('Module already has an active grow cycle. Complete or abort it first.');
    }

    const firstStage = program.stages[0];
    const now = Timestamp.now();

    const cycle: Omit<GrowCycle, 'id'> = {
      moduleId,
      organizationId,
      programId: program.id || program.name,
      programName: program.name,
      cropType: program.cropType,
      totalDays: program.totalDays,
      status: 'active',
      startedAt: now,
      currentDay: 1,
      currentStage: firstStage.type,
      stages: program.stages, // Frozen snapshot
      pinBindings,
      stageHistory: [{
        stage: firstStage.type,
        stageName: firstStage.name,
        startedAt: now,
      }],
      dailyLog: [{
        day: 1,
        date: new Date().toISOString().split('T')[0],
        stage: firstStage.type,
      }],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, CYCLES_COLLECTION), cycle);

    // Write the first stage's schedules to the device pins
    await this.writeStageSchedules(moduleId, firstStage, pinBindings, docRef.id);

    return docRef.id;
  },

  /** Write schedules for a stage to the device's gpioState */
  async writeStageSchedules(
    moduleId: string,
    stage: GrowStage,
    pinBindings: Record<string, number>,
    cycleId: string,
  ): Promise<void> {
    const deviceRef = doc(db, 'devices', moduleId);

    // Build the update: for each schedule config in the stage,
    // find the bound pin and write a schedule entry
    const updates: Record<string, any> = {};

    for (const sched of stage.schedules) {
      const pin = pinBindings[sched.targetSubtype];
      if (pin === undefined) continue;

      const scheduleId = `cycle_${cycleId}_${sched.targetSubtype}`;
      updates[`gpioState.${pin}.schedules.${scheduleId}`] = {
        name: `${stage.name} — ${sched.targetSubtype}`,
        durationSeconds: sched.durationSeconds,
        frequencySeconds: sched.frequencySeconds,
        startTime: sched.startTime || null,
        endTime: sched.endTime || null,
        enabled: true,
        pin: pin,
        managedBy: 'grow_cycle',
        cycleId: cycleId,
        stage: stage.type,
        stageName: stage.name,
        createdAt: Timestamp.now(),
      };
    }

    // Also handle lighting schedule if the stage has lighting config
    if (stage.lighting.enabled && stage.lighting.onHour !== undefined && stage.lighting.offHour !== undefined) {
      const lightPin = pinBindings['light'];
      if (lightPin !== undefined) {
        const scheduleId = `cycle_${cycleId}_light`;
        // Light schedule: ON at onHour, run until offHour
        const onHour = stage.lighting.onHour;
        const offHour = stage.lighting.offHour;
        const startTime = `${String(onHour).padStart(2, '0')}:00`;
        const endTime = `${String(offHour).padStart(2, '0')}:00`;
        // Lights stay on the whole window — long duration, no repeat
        const durationHours = offHour > onHour ? offHour - onHour : 24 - onHour + offHour;
        updates[`gpioState.${lightPin}.schedules.${scheduleId}`] = {
          name: `${stage.name} — lights`,
          durationSeconds: durationHours * 3600,
          frequencySeconds: 86400, // once per day
          startTime,
          endTime,
          enabled: true,
          pin: lightPin,
          managedBy: 'grow_cycle',
          cycleId: cycleId,
          stage: stage.type,
          stageName: stage.name,
          createdAt: Timestamp.now(),
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(deviceRef, updates);
    }
  },

  /** Remove all cycle-managed schedules from a device */
  async clearCycleSchedules(
    moduleId: string,
    cycleId: string,
    pinBindings: Record<string, number>,
  ): Promise<void> {
    const deviceRef = doc(db, 'devices', moduleId);
    const deviceSnap = await getDoc(deviceRef);
    if (!deviceSnap.exists()) return;

    const data = deviceSnap.data();
    const gpioState = data?.gpioState || {};
    const updates: Record<string, any> = {};

    // Find and delete all schedules with this cycleId
    for (const [pinStr, pinData] of Object.entries(gpioState)) {
      const schedules = (pinData as any)?.schedules || {};
      for (const [schedId, schedData] of Object.entries(schedules)) {
        if ((schedData as any)?.cycleId === cycleId) {
          updates[`gpioState.${pinStr}.schedules.${schedId}`] = deleteField();
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(deviceRef, updates);
    }
  },

  /** Transition to a new stage: clear old schedules, write new ones */
  async transitionStage(
    cycle: GrowCycle,
    newStage: GrowStage,
  ): Promise<void> {
    if (!cycle.id) throw new Error('Cycle has no ID');

    // Clear old schedules
    await this.clearCycleSchedules(cycle.moduleId, cycle.id, cycle.pinBindings);

    // Write new schedules
    await this.writeStageSchedules(cycle.moduleId, newStage, cycle.pinBindings, cycle.id);

    // Update cycle document
    const now = Timestamp.now();
    const updatedHistory = [...cycle.stageHistory];
    
    // Complete the previous stage
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        completedAt: now,
      };
    }

    // Add new stage entry
    updatedHistory.push({
      stage: newStage.type,
      stageName: newStage.name,
      startedAt: now,
    });

    await updateDoc(doc(db, CYCLES_COLLECTION, cycle.id), {
      currentStage: newStage.type,
      stageHistory: updatedHistory,
      updatedAt: now,
    });
  },

  /** Evaluate a cycle and auto-transition if needed. Returns true if a transition occurred. */
  async evaluateCycle(cycle: GrowCycle): Promise<boolean> {
    if (cycle.status !== 'active' || !cycle.id) return false;

    const startMs = cycle.startedAt instanceof Timestamp
      ? cycle.startedAt.toMillis()
      : (cycle.startedAt as any)?.seconds ? (cycle.startedAt as any).seconds * 1000 : Date.now();

    const currentDay = Math.floor((Date.now() - startMs) / 86400000) + 1;

    // Find which stage this day belongs to
    const stages = cycle.stages || [];
    const targetStage = stages.find(s => currentDay >= s.dayStart && currentDay <= s.dayEnd);
    
    if (!targetStage) {
      // Past the last stage — cycle should be completed or in harvest
      if (currentDay > cycle.totalDays) {
        // Auto-mark as ready for harvest but don't auto-complete
        // The user decides when to actually harvest
        return false;
      }
      return false;
    }

    // Update currentDay if changed
    if (currentDay !== cycle.currentDay) {
      await updateDoc(doc(db, CYCLES_COLLECTION, cycle.id), {
        currentDay,
        updatedAt: Timestamp.now(),
      });
    }

    // Check if stage changed
    if (targetStage.type !== cycle.currentStage) {
      await this.transitionStage(cycle, targetStage);
      return true;
    }

    return false;
  },

  /** Complete a cycle with harvest data */
  async completeCycle(
    cycleId: string,
    moduleId: string,
    pinBindings: Record<string, number>,
    harvestData?: {
      yieldWeight?: number;
      yieldUnit?: 'oz' | 'g' | 'lbs' | 'kg';
      quality?: 'excellent' | 'good' | 'fair' | 'poor';
      notes?: string;
    },
  ): Promise<void> {
    // Remove all cycle schedules from device
    await this.clearCycleSchedules(moduleId, cycleId, pinBindings);

    const now = Timestamp.now();
    const updateData: Record<string, any> = {
      status: 'completed',
      completedAt: now,
      updatedAt: now,
    };

    if (harvestData) {
      updateData.harvest = {
        date: now,
        ...harvestData,
      };
    }

    await updateDoc(doc(db, CYCLES_COLLECTION, cycleId), updateData);
  },

  /** Abort a cycle — removes all schedules, marks aborted */
  async abortCycle(
    cycleId: string,
    moduleId: string,
    pinBindings: Record<string, number>,
  ): Promise<void> {
    await this.clearCycleSchedules(moduleId, cycleId, pinBindings);

    await updateDoc(doc(db, CYCLES_COLLECTION, cycleId), {
      status: 'aborted',
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /** Pause a cycle — disables all cycle schedules */
  async pauseCycle(
    cycleId: string,
    moduleId: string,
    pinBindings: Record<string, number>,
  ): Promise<void> {
    const deviceRef = doc(db, 'devices', moduleId);
    const deviceSnap = await getDoc(deviceRef);
    if (!deviceSnap.exists()) return;

    const data = deviceSnap.data();
    const gpioState = data?.gpioState || {};
    const updates: Record<string, any> = {};

    for (const [pinStr, pinData] of Object.entries(gpioState)) {
      const schedules = (pinData as any)?.schedules || {};
      for (const [schedId, schedData] of Object.entries(schedules)) {
        if ((schedData as any)?.cycleId === cycleId) {
          updates[`gpioState.${pinStr}.schedules.${schedId}.enabled`] = false;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(deviceRef, updates);
    }

    await updateDoc(doc(db, CYCLES_COLLECTION, cycleId), {
      status: 'paused',
      pausedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  /** Resume a paused cycle — re-enables schedules */
  async resumeCycle(cycle: GrowCycle): Promise<void> {
    if (!cycle.id) return;

    const deviceRef = doc(db, 'devices', cycle.moduleId);
    const deviceSnap = await getDoc(deviceRef);
    if (!deviceSnap.exists()) return;

    const data = deviceSnap.data();
    const gpioState = data?.gpioState || {};
    const updates: Record<string, any> = {};

    for (const [pinStr, pinData] of Object.entries(gpioState)) {
      const schedules = (pinData as any)?.schedules || {};
      for (const [schedId, schedData] of Object.entries(schedules)) {
        if ((schedData as any)?.cycleId === cycle.id) {
          updates[`gpioState.${pinStr}.schedules.${schedId}.enabled`] = true;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(deviceRef, updates);
    }

    await updateDoc(doc(db, CYCLES_COLLECTION, cycle.id), {
      status: 'active',
      pausedAt: deleteField(),
      updatedAt: Timestamp.now(),
    });
  },
};
