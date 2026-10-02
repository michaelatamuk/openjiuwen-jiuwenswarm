// Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.

import { useSyncExternalStore } from 'react';

let trajectoryUiEnabled = false;
let trajectoryAnalysisEnabled = false;
const listeners = new Set<() => void>();

/** Normalize the trajectory switch from the config RPC boundary. */
export function normalizeTrajectoryUiEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(
    String(value ?? '').trim().toLowerCase(),
  );
}

/** Publish the latest persisted trajectory UI setting to the current window. */
export function setTrajectoryUiEnabled(enabled: boolean): void {
  if (trajectoryUiEnabled === enabled) return;
  trajectoryUiEnabled = enabled;
  listeners.forEach(listener => listener());
}

/** Return the current trajectory UI feature state. */
export function isTrajectoryUiEnabled(): boolean {
  return trajectoryUiEnabled;
}

/** Publish the latest trajectory analysis setting to the current window. */
export function setTrajectoryAnalysisEnabled(enabled: boolean): void {
  if (trajectoryAnalysisEnabled === enabled) return;
  trajectoryAnalysisEnabled = enabled;
  listeners.forEach(listener => listener());
}

/** Return whether trajectory AI analysis is currently enabled. */
export function isTrajectoryAnalysisEnabled(): boolean {
  return trajectoryAnalysisEnabled;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe App surfaces to trajectory setting changes without reloading. */
export function useTrajectoryUiEnabled(): boolean {
  return useSyncExternalStore(subscribe, isTrajectoryUiEnabled, isTrajectoryUiEnabled);
}

/** Subscribe surfaces to the trajectory analysis flag without reloading. */
export function useTrajectoryAnalysisEnabled(): boolean {
  return useSyncExternalStore(subscribe, isTrajectoryAnalysisEnabled, isTrajectoryAnalysisEnabled);
}
