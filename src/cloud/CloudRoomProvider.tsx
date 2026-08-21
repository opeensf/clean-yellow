import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useGameStore } from '../store/gameStore';
import {
  applyGameSnapshot,
  createGameSnapshot,
  parseGameSnapshot,
  serializeGameSnapshot,
  type GameSnapshot,
} from './gameSnapshot';
import {
  createRoom as createRoomRequest,
  forceSaveRoom,
  isCloudConfigured,
  isValidRoomCode,
  loadRoom,
  normalizeRoomCode,
  RoomApiError,
  saveRoom,
} from './roomApi';

const ACTIVE_ROOM_KEY = 'clean-yellow-active-room';
const ROOM_CACHE_PREFIX = 'clean-yellow-room-cache:';
const AUTO_SAVE_DELAY = 800;

export type CloudRoomStatus =
  | 'local'
  | 'unconfigured'
  | 'loading'
  | 'saving'
  | 'synced'
  | 'offline'
  | 'conflict'
  | 'error';

interface ActiveRoomMeta {
  roomCode: string;
  revision: number;
  updatedAt: string;
}

interface CachedRoom extends ActiveRoomMeta {
  snapshot: GameSnapshot;
  dirty?: boolean;
}

interface CloudConflict {
  cloudSnapshot: GameSnapshot;
  cloudRevision: number;
  cloudUpdatedAt: string;
}

interface CloudRoomContextValue {
  configured: boolean;
  roomCode: string | null;
  revision: number | null;
  updatedAt: string | null;
  status: CloudRoomStatus;
  error: string | null;
  hasConflict: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (roomCode: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (choice: 'cloud' | 'local') => Promise<void>;
}

const CloudRoomContext = createContext<CloudRoomContextValue | null>(null);

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The main Zustand store still provides a local fallback if storage is full.
  }
}

function getRoomCodeFromHash(): string | null {
  const query = window.location.hash.split('?')[1];
  const code = query ? new URLSearchParams(query).get('room') : null;
  return code && isValidRoomCode(code) ? normalizeRoomCode(code) : null;
}

export function CloudRoomProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<CloudRoomStatus>(
    isCloudConfigured ? 'local' : 'unconfigured',
  );
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<CloudConflict | null>(null);

  const roomCodeRef = useRef<string | null>(null);
  const revisionRef = useRef<number | null>(null);
  const baselineRef = useRef(serializeGameSnapshot());
  const dirtyRef = useRef(false);
  const applyingRef = useRef(false);
  const savingRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveCurrentRef = useRef<() => Promise<void>>(async () => undefined);
  const initializedRef = useRef(false);

  const persistRoomMeta = useCallback((meta: ActiveRoomMeta) => {
    writeJson(ACTIVE_ROOM_KEY, meta);
    setRoomCode(meta.roomCode);
    setRevision(meta.revision);
    setUpdatedAt(meta.updatedAt);
    roomCodeRef.current = meta.roomCode;
    revisionRef.current = meta.revision;
  }, []);

  const cacheRoom = useCallback((
    meta: ActiveRoomMeta,
    snapshot: GameSnapshot,
    dirty = false,
  ) => {
    writeJson(
      `${ROOM_CACHE_PREFIX}${meta.roomCode}`,
      { ...meta, snapshot, dirty } satisfies CachedRoom,
    );
  }, []);

  const applyRemoteRoom = useCallback((meta: ActiveRoomMeta, snapshot: GameSnapshot) => {
    applyingRef.current = true;
    try {
      applyGameSnapshot(snapshot);
    } finally {
      applyingRef.current = false;
    }
    baselineRef.current = serializeGameSnapshot(snapshot);
    dirtyRef.current = false;
    persistRoomMeta(meta);
    cacheRoom(meta, snapshot);
    setConflict(null);
    setError(null);
    setStatus('synced');
  }, [cacheRoom, persistRoomMeta]);

  const handleSyncError = useCallback((syncError: unknown) => {
    const message = syncError instanceof Error ? syncError.message : '云端同步失败';
    setError(message);
    setStatus(syncError instanceof RoomApiError && syncError.code === 'NETWORK_ERROR'
      ? 'offline'
      : 'error');
  }, []);

  const loadConflict = useCallback(async (code: string) => {
    try {
      const remote = await loadRoom(code);
      setConflict({
        cloudSnapshot: remote.snapshot,
        cloudRevision: remote.revision,
        cloudUpdatedAt: remote.updatedAt,
      });
      setError('云端有较新的存档，请选择保留哪一份');
      setStatus('conflict');
    } catch (loadError) {
      handleSyncError(loadError);
    }
  }, [handleSyncError]);

  const saveCurrent = useCallback(async () => {
    const code = roomCodeRef.current;
    const expectedRevision = revisionRef.current;
    if (!code || expectedRevision === null || savingRef.current || conflict) return;

    const snapshot = createGameSnapshot();
    const serialized = serializeGameSnapshot(snapshot);
    if (serialized === baselineRef.current) {
      dirtyRef.current = false;
      setStatus('synced');
      return;
    }

    cacheRoom(
      { roomCode: code, revision: expectedRevision, updatedAt: updatedAt ?? '' },
      snapshot,
      true,
    );

    if (!navigator.onLine) {
      dirtyRef.current = true;
      setStatus('offline');
      return;
    }

    savingRef.current = true;
    let retryAfterSave = false;
    setStatus('saving');
    setError(null);

    try {
      const result = await saveRoom(code, expectedRevision, snapshot);
      const meta = { roomCode: code, revision: result.revision, updatedAt: result.updatedAt };
      baselineRef.current = serialized;
      dirtyRef.current = serializeGameSnapshot() !== serialized;
      retryAfterSave = dirtyRef.current;
      persistRoomMeta(meta);
      cacheRoom(meta, dirtyRef.current ? createGameSnapshot() : snapshot, dirtyRef.current);
      setStatus(dirtyRef.current ? 'saving' : 'synced');
    } catch (saveError) {
      dirtyRef.current = true;
      if (saveError instanceof RoomApiError && saveError.code === 'REVISION_CONFLICT') {
        await loadConflict(code);
      } else {
        handleSyncError(saveError);
      }
    } finally {
      savingRef.current = false;
      if (retryAfterSave && navigator.onLine) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => void saveCurrentRef.current(), AUTO_SAVE_DELAY);
      }
    }
  }, [cacheRoom, conflict, handleSyncError, loadConflict, persistRoomMeta, updatedAt]);

  saveCurrentRef.current = saveCurrent;

  const joinRoom = useCallback(async (input: string) => {
    const code = normalizeRoomCode(input);
    if (!isValidRoomCode(code)) throw new Error('请输入完整的 8 位房间码');
    if (!isCloudConfigured) throw new Error('云端服务尚未配置');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setStatus('loading');
    setError(null);

    try {
      const remote = await loadRoom(code);
      applyRemoteRoom({
        roomCode: code,
        revision: remote.revision,
        updatedAt: remote.updatedAt,
      }, remote.snapshot);
    } catch (joinError) {
      const cached = readJson<CachedRoom>(`${ROOM_CACHE_PREFIX}${code}`);
      if (
        joinError instanceof RoomApiError
        && joinError.code === 'NETWORK_ERROR'
        && cached?.snapshot
      ) {
        const snapshot = parseGameSnapshot(cached.snapshot);
        applyRemoteRoom(cached, snapshot);
        dirtyRef.current = true;
        setStatus('offline');
        setError('当前离线，已打开这台设备上的最近存档');
        return;
      }
      handleSyncError(joinError);
      throw joinError;
    }
  }, [applyRemoteRoom, handleSyncError]);

  const createRoom = useCallback(async () => {
    if (!isCloudConfigured) throw new Error('云端服务尚未配置');
    setStatus('loading');
    setError(null);
    const snapshot = createGameSnapshot();

    try {
      const result = await createRoomRequest(snapshot);
      const meta = {
        roomCode: result.roomCode,
        revision: result.revision,
        updatedAt: result.updatedAt,
      };
      baselineRef.current = serializeGameSnapshot(snapshot);
      dirtyRef.current = false;
      persistRoomMeta(meta);
      cacheRoom(meta, snapshot);
      setStatus('synced');
      return result.roomCode;
    } catch (createError) {
      handleSyncError(createError);
      throw createError;
    }
  }, [cacheRoom, handleSyncError, persistRoomMeta]);

  const syncNow = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || conflict) return;
    if (dirtyRef.current) {
      await saveCurrentRef.current();
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const remote = await loadRoom(code);
      if (remote.revision !== revisionRef.current) {
        applyRemoteRoom({
          roomCode: code,
          revision: remote.revision,
          updatedAt: remote.updatedAt,
        }, remote.snapshot);
      } else {
        setStatus('synced');
      }
    } catch (syncError) {
      handleSyncError(syncError);
    }
  }, [applyRemoteRoom, conflict, handleSyncError]);

  const leaveRoom = useCallback(async () => {
    if (dirtyRef.current && navigator.onLine && !conflict) {
      await saveCurrentRef.current();
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    localStorage.removeItem(ACTIVE_ROOM_KEY);
    roomCodeRef.current = null;
    revisionRef.current = null;
    dirtyRef.current = false;
    setRoomCode(null);
    setRevision(null);
    setUpdatedAt(null);
    setConflict(null);
    setError(null);
    setStatus(isCloudConfigured ? 'local' : 'unconfigured');
  }, [conflict]);

  const resolveConflict = useCallback(async (choice: 'cloud' | 'local') => {
    const code = roomCodeRef.current;
    if (!code || !conflict) return;
    setStatus(choice === 'cloud' ? 'loading' : 'saving');
    setError(null);

    try {
      if (choice === 'cloud') {
        applyRemoteRoom({
          roomCode: code,
          revision: conflict.cloudRevision,
          updatedAt: conflict.cloudUpdatedAt,
        }, conflict.cloudSnapshot);
        return;
      }

      const snapshot = createGameSnapshot();
      const result = await forceSaveRoom(code, snapshot);
      const meta = { roomCode: code, revision: result.revision, updatedAt: result.updatedAt };
      baselineRef.current = serializeGameSnapshot(snapshot);
      dirtyRef.current = false;
      persistRoomMeta(meta);
      cacheRoom(meta, snapshot);
      setConflict(null);
      setStatus('synced');
    } catch (resolveError) {
      handleSyncError(resolveError);
    }
  }, [applyRemoteRoom, cacheRoom, conflict, handleSyncError, persistRoomMeta]);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(() => {
      if (applyingRef.current || !roomCodeRef.current) return;
      const serialized = serializeGameSnapshot();
      if (serialized === baselineRef.current) return;
      dirtyRef.current = true;
      const activeRevision = revisionRef.current;
      if (activeRevision !== null) {
        cacheRoom({
          roomCode: roomCodeRef.current,
          revision: activeRevision,
          updatedAt: readJson<ActiveRoomMeta>(ACTIVE_ROOM_KEY)?.updatedAt ?? '',
        }, createGameSnapshot(), true);
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => void saveCurrentRef.current(), AUTO_SAVE_DELAY);
    });

    if (!initializedRef.current) {
      initializedRef.current = true;
      const queryRoom = getRoomCodeFromHash();
      const storedRoom = readJson<ActiveRoomMeta>(ACTIVE_ROOM_KEY);
      const initialRoom = queryRoom ?? (
        storedRoom && isValidRoomCode(storedRoom.roomCode) ? storedRoom.roomCode : null
      );

      if (initialRoom && isCloudConfigured) {
        const cached = readJson<CachedRoom>(`${ROOM_CACHE_PREFIX}${initialRoom}`);
        if (cached?.dirty) {
          applyingRef.current = true;
          try {
            applyGameSnapshot(parseGameSnapshot(cached.snapshot));
          } finally {
            applyingRef.current = false;
          }
          baselineRef.current = '';
          dirtyRef.current = true;
          persistRoomMeta(cached);
          setStatus(navigator.onLine ? 'saving' : 'offline');
          if (navigator.onLine) {
            autoSaveTimerRef.current = setTimeout(
              () => void saveCurrentRef.current(),
              AUTO_SAVE_DELAY,
            );
          }
        } else {
          void joinRoom(initialRoom).catch(() => undefined);
        }
      }
    }

    const handleOnline = () => {
      if (roomCodeRef.current) void syncNow();
    };
    const handleOffline = () => {
      if (roomCodeRef.current) setStatus('offline');
    };
    const handleFocus = () => {
      if (roomCodeRef.current && navigator.onLine) void syncNow();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cacheRoom, joinRoom, persistRoomMeta, syncNow]);

  const value = useMemo<CloudRoomContextValue>(() => ({
    configured: isCloudConfigured,
    roomCode,
    revision,
    updatedAt,
    status,
    error,
    hasConflict: Boolean(conflict),
    createRoom,
    joinRoom,
    leaveRoom,
    syncNow,
    resolveConflict,
  }), [
    conflict,
    createRoom,
    error,
    joinRoom,
    leaveRoom,
    resolveConflict,
    revision,
    roomCode,
    status,
    syncNow,
    updatedAt,
  ]);

  return <CloudRoomContext.Provider value={value}>{children}</CloudRoomContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCloudRoom(): CloudRoomContextValue {
  const context = useContext(CloudRoomContext);
  if (!context) throw new Error('useCloudRoom must be used inside CloudRoomProvider');
  return context;
}
