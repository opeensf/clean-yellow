import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const port = Number(process.env.MOCK_CLOUD_PORT ?? 54321);
const rooms = new Map();
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function createRoomCode() {
  const bytes = randomBytes(8);
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

function rpcError(response, message, status = 400) {
  json(response, status, { code: 'P0001', details: null, hint: null, message });
}

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    json(response, 200, {});
    return;
  }

  if (request.method !== 'POST' || !request.url?.startsWith('/rest/v1/rpc/')) {
    json(response, 404, { message: 'NOT_FOUND' });
    return;
  }

  let rawBody = '';
  request.on('data', (chunk) => { rawBody += chunk; });
  request.on('end', () => {
    let body;
    try {
      body = JSON.parse(rawBody || '{}');
    } catch {
      rpcError(response, 'INVALID_JSON');
      return;
    }

    const rpc = request.url.split('/').pop();
    const now = new Date().toISOString();

    if (rpc === 'create_game_room') {
      let roomCode = createRoomCode();
      while (rooms.has(roomCode)) roomCode = createRoomCode();
      rooms.set(roomCode, {
        state: body.p_initial_state,
        schemaVersion: body.p_schema_version,
        revision: 1,
        updatedAt: now,
      });
      json(response, 200, [{ room_code: roomCode, revision: 1, updated_at: now }]);
      return;
    }

    const roomCode = String(body.p_room_code ?? '').toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) {
      rpcError(response, 'ROOM_NOT_FOUND');
      return;
    }

    if (rpc === 'load_game_room') {
      json(response, 200, [{
        state: room.state,
        schema_version: room.schemaVersion,
        revision: room.revision,
        updated_at: room.updatedAt,
      }]);
      return;
    }

    if (rpc === 'save_game_room') {
      if (room.revision !== Number(body.p_expected_revision)) {
        rpcError(response, 'REVISION_CONFLICT');
        return;
      }
      room.state = body.p_next_state;
      room.schemaVersion = body.p_schema_version;
      room.revision += 1;
      room.updatedAt = now;
      json(response, 200, [{ revision: room.revision, updated_at: now }]);
      return;
    }

    if (rpc === 'force_save_game_room') {
      room.state = body.p_next_state;
      room.schemaVersion = body.p_schema_version;
      room.revision += 1;
      room.updatedAt = now;
      json(response, 200, [{ revision: room.revision, updated_at: now }]);
      return;
    }

    json(response, 404, { message: 'RPC_NOT_FOUND' });
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock cloud server ready at http://127.0.0.1:${port}`);
});
