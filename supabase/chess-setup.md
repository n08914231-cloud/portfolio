# Community chess setup

1. Run `chess_game.sql` in the Supabase SQL Editor. It creates a publicly readable move history; direct browser writes are disabled.
2. In Supabase Authentication, create the account Noah will use to sign in. Then run this in the SQL Editor, replacing the email with that account’s email. This sets a server-controlled flag; do not put it in `user_metadata`.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"chess_admin": true}'::jsonb
   where email = 'YOUR_ACCOUNT_EMAIL'
   returning id;
   ```

   Confirm that exactly one account ID is returned.
3. Install and sign in to the Supabase CLI, then link this repository to the existing project:

   ```sh
   supabase login
   supabase link --project-ref yrfsiojjutfefihrkwqz
   ```

4. Deploy the Edge Function:

   ```sh
   supabase functions deploy chess-move
   ```

   Supabase provides its URL, anon key, and service-role key to Edge Functions as environment variables. Keep the service-role key out of website files and source control.
5. Enable the `chess_moves` table in the `public` schema if Supabase Data API exposure is restricted. The browser only needs `SELECT`; all moves are validated and written by the Edge Function.

The function reads the complete move history, replays and validates it with `chess.js`, then inserts the next numbered move. The primary key on `ply` prevents two visitors from overwriting the same turn.

Until the `chess_moves` table exists, the chess page falls back to a local two-sided demo saved in that browser only. It is not shared with other visitors.
