# Community chess setup

1. Run the latest `chess_game.sql` in the Supabase SQL Editor. It creates a publicly readable move history; direct browser writes are disabled. It also enables Supabase Realtime and creates the secure move-save/reset functions. If you ran an earlier version, run the whole updated script again so it adds these functions.
2. Install and sign in to the Supabase CLI, then link this repository to the existing project:

   ```sh
   supabase login
   supabase link --project-ref yrfsiojjutfefihrkwqz
   ```

3. Deploy the Edge Function:

   ```sh
   supabase functions deploy chess-move
   ```

   Supabase provides its URL and service-role key to Edge Functions as environment variables. Keep the service-role key out of website files and source control.
4. Enable the `chess_moves` table in the `public` schema if Supabase Data API exposure is restricted. The browser only needs `SELECT`; all moves are validated and written by the Edge Function.

Anyone can make the move for the side whose turn it is; there is no admin login and visitors are not assigned separate games. The function reads the complete move history and validates it with `chess.js`. The database serializes move saves and resets so concurrent moves cannot overwrite each other. Finished games remain visible for 10 seconds, then reset automatically for everyone.

Until the `chess_moves` table exists, the chess page falls back to a local two-sided demo saved in that browser only. It is not shared with other visitors.
