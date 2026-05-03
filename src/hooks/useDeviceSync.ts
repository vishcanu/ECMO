import { useEffect, useRef } from 'react';
import { useScenarioStore } from '../store/scenarioStore';
import type { DevicesState } from '../types';

const CHANNEL_NAME = 'ecmo-device-sync';

/**
 * Cross-tab device sync via BroadcastChannel.
 *
 * Mount this once in each app root (App.tsx and device-editor.tsx).
 * - When THIS tab changes devices → broadcasts to all other tabs.
 * - When ANOTHER tab broadcasts a change → applies it silently (no echo).
 */
export function useDeviceSync() {
  const setDevicesFromSync = useScenarioStore((s) => s.setDevicesFromSync);
  // Track the last devices reference to detect changes
  const lastDevicesRef = useRef<DevicesState | null>(null);
  // Flag to suppress re-broadcast of received messages
  const receivingRef = useRef(false);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // Listen for updates from other tabs
    channel.onmessage = (e: MessageEvent<DevicesState>) => {
      receivingRef.current = true;
      setDevicesFromSync(e.data);
      // Use queueMicrotask so the store update runs before we reset the flag
      queueMicrotask(() => { receivingRef.current = false; });
    };

    // Subscribe to store and broadcast when devices change in THIS tab
    const unsubscribe = useScenarioStore.subscribe((state) => {
      const devices = state.activeScenario.devices;
      if (devices !== lastDevicesRef.current && !receivingRef.current) {
        lastDevicesRef.current = devices;
        channel.postMessage(devices);
      }
    });

    return () => {
      unsubscribe();
      channel.close();
    };
  }, [setDevicesFromSync]);
}
