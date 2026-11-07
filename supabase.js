const SUPABASE_URL = "https://ziyndtfvabxmrruffvji.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_eb_8J4rgAiR5TOcl3DuFHQ_L_l9RB26";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

window.supabaseClient = supabaseClient;

console.log("Supabase client initialized successfully.");
