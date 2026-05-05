const { createClient } = require('@supabase/supabase-js');

// Mengambil URL dan Key dari file .env
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = supabase;