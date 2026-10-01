import { createClient } from 'npm:@supabase/supabase-js@2';
import { Chess } from 'npm:chess.js@1.4.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Chess function is missing required Supabase environment variables.');
    return jsonResponse({ error: 'Chess service is not configured.' }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }
  if (!isRecord(body)) {
    return jsonResponse({ error: 'Request body must contain a chess move or reset action.' }, 400);
  }
  if (body.action !== 'reset' &&
    (typeof body.from !== 'string' || !/^[a-h][1-8]$/.test(body.from) ||
      typeof body.to !== 'string' || !/^[a-h][1-8]$/.test(body.to) ||
      (body.promotion !== undefined && !['q', 'r', 'b', 'n'].includes(String(body.promotion))))) {
    return jsonResponse({ error: 'Move coordinates or promotion piece are invalid.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: rows, error: readError } = await admin
    .from('chess_moves')
    .select('ply, from_square, to_square, promotion, san, fen, created_at')
    .order('ply', { ascending: true });
  if (readError) {
    console.error('Could not load chess history:', readError);
    return jsonResponse({ error: 'Could not load the shared game.' }, 500);
  }

  const game = new Chess();
  for (let index = 0; index < rows.length; index += 1) {
    const saved = rows[index];
    if (saved.ply !== index + 1) {
      console.error('Chess history contains a missing ply.', { expected: index + 1, actual: saved.ply });
      return jsonResponse({ error: 'The shared game history is inconsistent.' }, 500);
    }
    try {
      const replayed = game.move({
        from: saved.from_square,
        to: saved.to_square,
        ...(saved.promotion ? { promotion: saved.promotion } : {})
      });
      if (!replayed || replayed.san !== saved.san || game.fen() !== saved.fen) {
        return jsonResponse({ error: 'The shared game history is inconsistent.' }, 500);
      }
    } catch (error) {
      console.error('Could not replay chess history:', error);
      return jsonResponse({ error: 'The shared game history is inconsistent.' }, 500);
    }
  }

  if (body.action === 'reset') {
    if (!game.isGameOver() || rows.length === 0) {
      return jsonResponse({ reset: false });
    }

    const { data: reset, error: resetError } = await admin.rpc('reset_community_chess_if_finished', {
      p_expected_ply: rows.length,
      p_expected_fen: game.fen()
    });
    if (resetError) {
      console.error('Could not reset finished chess game:', resetError);
      return jsonResponse({ error: 'Could not reset the finished game.' }, 500);
    }
    return jsonResponse({ reset: Boolean(reset) });
  }

  if (game.isGameOver()) return jsonResponse({ error: 'This game is already over.' }, 409);

  let move;
  try {
    move = game.move({
      from: body.from,
      to: body.to,
      ...(body.promotion ? { promotion: body.promotion as string } : {})
    });
  } catch {
    return jsonResponse({ error: 'That is not a legal chess move.' }, 400);
  }
  if (!move) return jsonResponse({ error: 'That is not a legal chess move.' }, 400);

  const { error: insertError } = await admin.rpc('save_community_chess_move', {
    p_ply: rows.length + 1,
    p_from_square: move.from,
    p_to_square: move.to,
    p_promotion: move.promotion || null,
    p_san: move.san,
    p_fen: game.fen()
  });
  if (insertError) {
    if (insertError.code === '23505' || insertError.code === 'P0001') {
      return jsonResponse({ error: 'Someone just moved. The board has been refreshed; try again.' }, 409);
    }
    console.error('Could not save chess move:', insertError);
    return jsonResponse({ error: 'Could not save that move.' }, 500);
  }

  return jsonResponse({ ply: rows.length + 1, san: move.san, fen: game.fen() });
});
