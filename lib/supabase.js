import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://hodmhqrisqskgyggwgyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZG1ocXJpc3Fza2d5Z2d3Z3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDk1MzIsImV4cCI6MjA4MDAyNTUzMn0.l6mhCFYviJ93n__Oh7xZb4TMlGioqRwh1w2ZwsvrkHU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Changed to true for web OAuth
    flowType: 'pkce', // Use PKCE flow for better security
  },
});
