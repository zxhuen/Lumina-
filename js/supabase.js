import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const supabaseClient = createClient(
    "https://zelmgdfyezdkcvylfkva.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbG1nZGZ5ZXpka2N2eWxma3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDU0NjAsImV4cCI6MjEwMDEyMTQ2MH0.dJyS4NM4eYaw2GJxkxgDAZg1McCHwj1U61ofQdy4OLk"
);