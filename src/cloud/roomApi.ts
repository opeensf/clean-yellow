import {
  GAME_SNAPSHOT_VERSION,
  parseGameSnapshot,
  type GameSnapshot,
} from './gameSnapshot';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isCloudConfigured = Boolean(supabaseUrl && publishableKey);

export type RoomApiErrorCode =
  | 'NOT_CONFIGURED'
  | 'ROOM_NOT_FOUND'
  | 'REVISION_CONFLICT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class RoomApiError extends Error {
  constructor(public readonly code: RoomApiErrorCode, message: string) {
    super(message);
    this.name = 'RoomApiError';
  }
}

export interface RoomSnapshotResult {
  snapshot: GameSnapshot;
  revision: number;
  updatedAt: string;
}

export interface RoomWriteResult {
  revision: number;
  updatedAt: string;
}

export interface RoomCreateResult extends RoomWriteResult {
  roomCode: string;
}

export function normalizeRoomCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
}

export function isValidRoomCode(input: string): boolean {
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/.test(
    normalizeRoomCode(input),
  );
}

function mapApiError(error: unknown): RoomApiError {
  if (error instanceof RoomApiError) return error;
  if (error instanceof TypeError) {
    return new RoomApiError('NETWORK_ERROR', '暂时无法连接云端，已保留本地存档');
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ROOM_NOT_FOUND')) {
    return new RoomApiError('ROOM_NOT_FOUND', '没有找到这个房间，请检查房间码');
  }
  if (message.includes('REVISION_CONFLICT')) {
    return new RoomApiError('REVISION_CONFLICT', '云端存档已被另一台设备更新');
  }
  return new RoomApiError('UNKNOWN', '云端存档操作失败，请稍后重试');
}

async function callRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!isCloudConfigured || !supabaseUrl || !publishableKey) {
    throw new RoomApiError('NOT_CONFIGURED', '云端服务尚未配置');
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof payload?.message === 'string'
        ? payload.message
        : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    throw mapApiError(error);
  }
}

function firstRow<T>(rows: T[] | T): T {
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) throw new RoomApiError('UNKNOWN', '云端没有返回有效数据');
  return row;
}

export async function createRoom(snapshot: GameSnapshot): Promise<RoomCreateResult> {
  const result = firstRow(await callRpc<Array<{
    room_code: string;
    revision: number;
    updated_at: string;
  }>>('create_game_room', {
    p_initial_state: snapshot,
    p_schema_version: GAME_SNAPSHOT_VERSION,
  }));

  return {
    roomCode: normalizeRoomCode(result.room_code),
    revision: Number(result.revision),
    updatedAt: result.updated_at,
  };
}

export async function loadRoom(roomCode: string): Promise<RoomSnapshotResult> {
  const result = firstRow(await callRpc<Array<{
    state: unknown;
    schema_version: number;
    revision: number;
    updated_at: string;
  }>>('load_game_room', { p_room_code: normalizeRoomCode(roomCode) }));

  if (Number(result.schema_version) !== GAME_SNAPSHOT_VERSION) {
    throw new RoomApiError('UNKNOWN', '这个房间使用了暂不支持的存档版本');
  }

  return {
    snapshot: parseGameSnapshot(result.state),
    revision: Number(result.revision),
    updatedAt: result.updated_at,
  };
}

export async function saveRoom(
  roomCode: string,
  expectedRevision: number,
  snapshot: GameSnapshot,
): Promise<RoomWriteResult> {
  const result = firstRow(await callRpc<Array<{
    revision: number;
    updated_at: string;
  }>>('save_game_room', {
    p_room_code: normalizeRoomCode(roomCode),
    p_expected_revision: expectedRevision,
    p_next_state: snapshot,
    p_schema_version: GAME_SNAPSHOT_VERSION,
  }));

  return { revision: Number(result.revision), updatedAt: result.updated_at };
}

export async function forceSaveRoom(
  roomCode: string,
  snapshot: GameSnapshot,
): Promise<RoomWriteResult> {
  const result = firstRow(await callRpc<Array<{
    revision: number;
    updated_at: string;
  }>>('force_save_game_room', {
    p_room_code: normalizeRoomCode(roomCode),
    p_next_state: snapshot,
    p_schema_version: GAME_SNAPSHOT_VERSION,
  }));

  return { revision: Number(result.revision), updatedAt: result.updated_at };
}
