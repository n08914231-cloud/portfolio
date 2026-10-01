import { createClient, type User } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ownerUsername = Deno.env.get('CHESS_OWNER_USERNAME');
const ownerPassword = Deno.env.get('CHESS_OWNER_PASSWORD');
const ownerEmail = 'chess-owner@owner.invalid';
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

async function findOwnerByEmail(admin: ReturnType<typeof createClient>) {
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === ownerEmail);
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);
  if (!supabaseUrl || !serviceRoleKey || !ownerUsername || !ownerPassword) {
    console.error('Chess owner login is missing required Supabase secrets.');
    return jsonResponse({ error: 'Chess owner login is not configured.' }, 503);
  }
  if (new TextEncoder().encode(ownerPassword).length < 16 || new TextEncoder().encode(ownerPassword).length > 72) {
    console.error('Chess owner password must be between 16 and 72 UTF-8 bytes.');
    return jsonResponse({ error: 'Chess owner login is not configured.' }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }
  if (!isRecord(body) || typeof body.username !== 'string' || body.username !== ownerUsername) {
    return jsonResponse({ error: 'Invalid username or password.' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: access, error: accessError } = await admin
    .from('chess_access')
    .select('owner_user_id')
    .eq('singleton', true)
    .maybeSingle();
  if (accessError || !access) {
    console.error('Could not load chess owner settings:', accessError);
    return jsonResponse({ error: 'Chess access is not configured. Run the SQL setup first.' }, 503);
  }

  try {
    let owner: User;
    if (access.owner_user_id) {
      const { data, error } = await admin.auth.admin.getUserById(access.owner_user_id);
      if (error || !data.user) throw error || new Error('The configured chess owner account no longer exists.');
      owner = data.user;
      if (owner.email?.toLowerCase() !== ownerEmail || !owner.email_confirmed_at) {
        const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(owner.id, {
          email: ownerEmail,
          password: ownerPassword,
          email_confirm: true,
          app_metadata: { ...owner.app_metadata, chess_owner: true }
        });
        if (updateError) throw updateError;
        owner = updated.user;
      }
    } else {
      let existing = await findOwnerByEmail(admin);
      if (existing) {
        const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
          password: ownerPassword,
          email_confirm: true,
          app_metadata: { ...existing.app_metadata, chess_owner: true }
        });
        if (error) throw error;
        owner = data.user;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: ownerEmail,
          password: ownerPassword,
          email_confirm: true,
          app_metadata: { chess_owner: true }
        });
        if (error) {
          existing = await findOwnerByEmail(admin);
          if (!existing) throw error;
          const { data: recovered, error: recoveryError } = await admin.auth.admin.updateUserById(existing.id, {
            password: ownerPassword,
            email_confirm: true,
            app_metadata: { ...existing.app_metadata, chess_owner: true }
          });
          if (recoveryError) throw recoveryError;
          owner = recovered.user;
        } else {
          owner = data.user;
        }
      }

      const { data: assigned, error: assignError } = await admin
        .from('chess_access')
        .update({ owner_user_id: owner.id, owner_color: 'white' })
        .eq('singleton', true)
        .is('owner_user_id', null)
        .select('owner_user_id')
        .maybeSingle();
      if (assignError) throw assignError;
      if (!assigned) {
        const { data: current, error: currentError } = await admin
          .from('chess_access')
          .select('owner_user_id')
          .eq('singleton', true)
          .maybeSingle();
        if (currentError || current?.owner_user_id !== owner.id) {
          throw currentError || new Error('A different chess owner has already been configured.');
        }
      }
    }

    return jsonResponse({ username: ownerUsername, email: ownerEmail });
  } catch (error) {
    console.error('Could not provision the chess owner account:', error);
    return jsonResponse({ error: 'Could not prepare the chess owner account.' }, 500);
  }
});
