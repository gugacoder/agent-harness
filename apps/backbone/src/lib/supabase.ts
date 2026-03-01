import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_PUBLIC_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_PUBLIC_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in environment"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
