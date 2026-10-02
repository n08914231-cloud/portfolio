# Community chess setup

1. Run the latest `chess_game.sql` in the Supabase SQL Editor. It creates publicly readable move history and win totals; direct browser writes are disabled. It also enables Supabase Realtime and creates the secure move-save/reset functions. Existing win totals are preserved when you rerun the script.
2. Sign in to Supabase and link this repository to the existing project with `npx` (no global CLI installation required):

   ```sh
   npx supabase login
   npx supabase link --project-ref yrfsiojjutfefihrkwqz
   ```

3. Deploy the Edge Function:

   ```sh
   npx supabase functions deploy chess-move
   ```

   Supabase provides its URL and service-role key to Edge Functions as environment variables. Keep the service-role key out of website files and source control.
4. Enable the `chess_moves` table in the `public` schema if Supabase Data API exposure is restricted. The browser only needs `SELECT`; all moves are validated and written by the Edge Function.

Anyone can make the move for the side whose turn it is; there is no admin login and visitors are not assigned separate games. The function reads the complete move history and validates it with `chess.js`. The database serializes move saves and resets so concurrent moves cannot overwrite each other. Finished games remain visible for 10 seconds, then reset automatically for everyone.

Until the `chess_moves` table exists, the chess page falls back to a local two-sided demo saved in that browser only. It is not shared with other visitors.
